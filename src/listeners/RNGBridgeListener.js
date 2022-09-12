const ecc = require("eosjs-ecc");
const { BigNumber, ethers, utils } = require("ethers");
const Listener = require("../Listener");

const ACCOUNT_STATE_TABLE = "accountstate";
const EOSIO_EVM = "eosio.evm";

class RNGBridgeListener extends Listener {

    constructor(
        oracle,
        rpc,
        api,
        config,
        bridge
    ){
        super(oracle, rpc, api, config, bridge);
        const conf = config.scripts.listeners.rng.bridge;
        if(conf.check_interval_ms > 0){
            this.check_interval_ms = conf.check_interval_ms; // Override base interval
        }
    }

    async start() {
        await super.startStream("RNG Oracle Bridge", EOSIO_EVM, ACCOUNT_STATE_TABLE, this.bridge.eosio_evm_scope, async(data) => {
            if(this.counter == 11){
                await this.notify();
                this.counter = -1;
            }
            this.counter++;
        })
        // RPC TABLE CHECK
        await this.doTableCheck();
        setInterval(async () => {
            await this.doTableCheck();
        }, this.check_interval_ms)
    }

    async doTableCheck(){
        let table_counter = 0;
        await super.doTableCheck("RNG Oracle Bridge", EOSIO_EVM, this.bridge.eosio_evm_scope, ACCOUNT_STATE_TABLE, async() => {
            if(table_counter === 11) { // Counter to get only new requests (we only need to call reqnotify once, it will check the table for all requests, but table already has base rows (other contract variable))
                this.notify();
            }
            table_counter++;
        });
    }
    async notify(){
        return await this.api.transact({
            actions: [{
                account: this.bridge.antelope_account,
                name: 'reqnotify',
                authorization: [{ actor: this.caller.name, permission: this.caller.permission }],
                data: {},
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 90,
        }).then(result => {
            this.log('\nCalled reqnotify()');
        }).catch(e => {
            this.log('\nCaught exception: ' + e);
        });
    }
}

module.exports = RNGBridgeListener;