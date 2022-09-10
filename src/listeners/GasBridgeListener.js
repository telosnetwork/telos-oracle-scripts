const fetch = require("node-fetch");
const {BigNumber, ethers } = require("ethers");
const ABI = [{ "inputs": [], "name": "gasPrice", "outputs": [{ "internalType": "uint256",  "name": "", "type": "uint256"}],  "stateMutability": "view", "type": "function"}]
const EVMListener = require("../EVMListener");

class GasListener extends EVMListener {
    constructor(
        oracle,
        rpc,
        api,
        evm_provider,
        evm_api,
        config,
        bridge,
    ) {
        super(oracle, rpc, api, evm_provider, evm_api, config, bridge);
        const conf = config.scripts.listeners.gas.bridge;
        if(conf.check_interval_ms){
            this.check_interval_ms = conf.check_interval_ms; // Override interval for gas listeners
        }
    }

    async start() {
        let ctx = this;
        setInterval(async function () {
            await ctx.doCheck();
        }, this.check_interval_ms)
    }

    async doCheck() {
        let gas_price, evm_contract_gas_price = 0;
        this.log("Checking gas prices...")
        // Get gas price from eosio.evm using TelosEVMApi
        try {
            gas_price = BigNumber.from(`0x${await this.evm_api.telos.getGasPrice()}`)
        } catch (e) {
            this.log(e);
            return false;
        }

        // Get EVM gas price from EVM bridge using ethers
        try {
            const evm_contract = new ethers.Contract(this.bridge.eth_account, ABI, this.evm_provider);
            evm_contract_gas_price = await evm_contract.gasPrice();
        } catch (e) {
            this.log(e);
            return false;
        }

        if(gas_price.eq(evm_contract_gas_price) === false){
            this.log(`Updating gas price...`);
            this.api.transact({
                actions: [{
                    account: this.bridge.antelope_account,
                    name: 'verify',
                    authorization: [{ actor: this.caller.name, permission: this.caller.permission }],
                    data: {},
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 90,
            }).then(result => {
                this.log(`Updated gas price !`);
            }).catch(e => {
                this.log('Failed, caught exception: ' + e);
            });
        } else {
            this.log(`No update needed for gas price`);
        }
    }

}

module.exports = GasListener;
