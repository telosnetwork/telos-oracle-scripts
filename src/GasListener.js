const fetch = require("node-fetch");
const {BigNumber, ethers } = require("ethers");
const ABI = [{ "inputs": [], "name": "getPrice", "outputs": [{ "internalType": "uint256",  "name": "", "type": "uint256"}],  "stateMutability": "view", "type": "function"}]
const EVMListener = require("./EVMListener");
const CONFIG_TABLE = "config";

class GasListener extends EVMListener {
    constructor(
        oracle,
        rpc,
        api,
        bridge,
        evm_provider,
        evm_api,
        interval
    ) {
        super(oracle, rpc, api, bridge, evm_provider, evm_api);
        this.interval = interval;
    }

    async start() {
        let ctx = this;
        setInterval(async function () {
            await ctx.doCheck();
        }, this.interval)
    }

    async doCheck() {
        let gas_price, evm_contract_gas_price = 0;

        // Get gas price from eosio.evm using TelosEVMApi
        try {
            gas_price = BigNumber.from(`0x${await this.evm_api.telos.getGasPrice()}`)
        } catch (e) {
            console.log(e);
            return false;
        }

        // Get EVM gas price from EVM bridge using ethers
        try {
            const evm_contract = new ethers.Contract(this.bridge.eth_account, ABI, this.evm_provider);
            evm_contract_gas_price = await evm_contract.getPrice();
        } catch (e) {
            console.log(e);
            return false;
        }

        if(gas_price.eq(evm_contract_gas_price) === false){
            console.log(`Updating price...`);
            this.api.transact({
                actions: [{
                    account: this.bridge.antelope_account,
                    name: 'verify',
                    authorization: [{ actor: this.oracle.name, permission: this.oracle.permission }],
                    data: {},
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 90,
            }).then(result => {
                console.log(`Updated price !`);
            }).catch(e => {
                console.log('Failed, caught exception: ' + e);
            });
        }
    }

}

module.exports = GasListener;
