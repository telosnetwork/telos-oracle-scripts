const { HyperionStreamClient, StreamClientEvents } = require("@eosrio/hyperion-stream-client");
const nameToInt = require('./utils/anteloppeName');
const util = require('util');
const JsSignatureProvider = require('eosjs/dist/eosjs-jssig').JsSignatureProvider;
const Eos = require('eosjs');
const { PromisePool } = require('@supercharge/promise-pool')
const Api = Eos.Api;

class Listener {
    constructor(
        oracle,
        rpc,
        config,
        hyperion,
        caller
    ) {
        this.caller = caller;
        this.oracle = oracle;
        this.check_interval_ms = config.check_interval_ms;
        this.max_block_diff = config.max_block_diff;
        this.hyperion = hyperion;
        this.rpc = rpc;
        this.trx_batch_size = config.trx_batch_size;
        this.console_log = (config.console_log) ? true : false;
        this.counter = 0;
        this.checking_table = false;
        this.next_key = '';
        this.lastReceivedBlock = 0;
        this.streamClient = new HyperionStreamClient({
            endpoint: hyperion,
            debug: true,
            libStream: false
        });
        const signatureProvider = new JsSignatureProvider([caller.private_key]);
        this.api = new Api({
            rpc,
            signatureProvider,
            textDecoder: new util.TextDecoder(),
            textEncoder: new util.TextEncoder()
        });
        this.abi = false;
    }

    // RPC ANTELOPE TABLE CHECK
    async doTableCheck(name, account, scope, table, reverse, callback) {
        if(this.checking_table) return;
        this.log(`${name}: Doing table check...`);
        this.checking_table = true;
        let count = 0;
        let more = true;
        while(more){
            try {
                const results = await this.rpc.get_table_rows({
                    code: account,
                    scope: scope,
                    table: table,
                    limit: this.trx_batch_size,
                    lower_bound: this.next_key
                });
                this.log(`${name}: Table check has retreived ${results.rows.length} request rows`);
                if(results.rows.length){
                    await PromisePool.for(results.rows).withConcurrency(results.rows.length).process(async data => {
                        await callback(data);
                    })
                }
                this.log(`${name}: Table check has processed ${results.rows.length} request rows`);
                this.next_key = results.next_key;
                if (results.more) {
                    more = true;
                } else {
                    more = false;
                }
            } catch (e) {
                more = false;
                this.log(`${name}: Table check failed: ${e}`);
            }
        }
        this.checking_table = false;
        this.log(`${name}: Done doing table check !`);
    }

    // HYPERION STREAM
    async startStream(name, account, table, scope, callback){
        let getInfo = await this.rpc.get_info();
        let headBlock = getInfo.head_block_num;
        this.lastReceivedBlock = headBlock - 1;
        this.log(`${name}: Starting Hyperion Stream ...`);

        this.streamClient.on(StreamClientEvents.LIBUPDATE, (data) => {
            // What is that ???
            this.log(data);
        });

        this.streamClient.on('connect', () => {
            this.log(`${name}: Connected to Hyperion Stream ...`);
            this.streamClient.streamDeltas({
                code: account,
                table: table,
                scope: scope,
                payer: "",
                start_from: -1,
                read_until: 0,
            });
        });

        this.streamClient.setAsyncDataHandler(async (data) => {
            this.lastReceivedBlock = data.block_num;
            if (data.content.present && scope === nameToInt(data.content.scope) || data.content.present && scope === data.content.scope.toString()) {
                this.log(`${name}: Data received from Hyperion Stream...`);
                await callback(data.content.data);
            }
        });

        await this.streamClient.connect();

        let interval = setInterval(async () => {
            if(this.lastReceivedBlock !== 0){
                let getInfo = await this.rpc.get_info();
                if(this.max_block_diff < ( getInfo.head_block_num - this.lastReceivedBlock)){
                    clearInterval(interval);
                    this.log(`${name}: Restarting Hyperion Stream...`);
                    await this.streamClient.disconnect();
                    await this.startStream(name, account, table, scope, callback);
                }
            }
        }, this.check_interval_ms);

        return;
    }

    // LOG UTIL
    log(message){
        if(this.console_log) console.log(message);
    }
}

module.exports = Listener;
