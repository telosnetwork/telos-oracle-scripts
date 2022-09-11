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
        await this.doTableCheck();
        await super.startStream("RNG Oracle Bridge", EOSIO_EVM, ACCOUNT_STATE_TABLE, this.bridge.eosio_evm_scope, (data) => {
            let row = data.content.data;
            if(this.counter == 0){
                this.api.transact({
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
            this.counter++;
            this.counter = (this.counter == 11) ? 0 : this.counter;
        })
        setInterval(async () => {
            await this.doTableCheck();
        }, this.check_interval_ms)
    }

    async doTableCheck() {
        this.log(`Doing table check for RNG Oracle Bridge...`);
        const results = await this.rpc.get_table_rows({
            code:  EOSIO_EVM,
            table: ACCOUNT_STATE_TABLE,
            scope: this.bridge.eosio_evm_scope,
            limit: 1000,
        });
        this.counter = 0;
        results.rows.forEach(async (row) => {
            if(this.counter == 11){
                // TODO: see if request exists before calling ? (ie: no oracles are answering)
                this.api.transact({
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
            this.counter++;
        });
        this.log('Done doing table check for RNG Oracle Bridge !');
    }
}

module.exports = RNGBridgeListener;