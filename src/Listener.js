const HyperionStreamClient = require("@eosrio/hyperion-stream-client").default;
const fetch = require("node-fetch");
const nameToInt = require('./utils/anteloppeName');
const util = require('util');
const JsSignatureProvider = require('eosjs/dist/eosjs-jssig').JsSignatureProvider;
const Eos = require('eosjs');
const Api = Eos.Api;

class Listener {
    constructor(
        oracle,
        rpc,
        config,
        hyperion,
        bridge
    ) {
        this.caller = {"name": config.caller.name, "permission": config.caller.permission, "private_key":  config.caller.private_key, "signing_key":  config.caller.signing_key};
        this.oracle = oracle;
        this.bridge = bridge;
        this.check_interval_ms = config.check_interval_ms;
        this.max_block_diff = config.max_block_diff;
        this.hyperion = hyperion;
        this.rpc = rpc;
        this.console_log = (config.console_log) ? true : false;
        this.counter = 0;
        this.checking_table = false;
        this.next_key = '';
        this.lastReceivedBlock = 0;
        this.streamClient = null;
        const signatureProvider = new JsSignatureProvider([config.caller.private_key]);
        this.api = new Api({
            rpc,
            signatureProvider,
            textDecoder: new util.TextDecoder(),
            textEncoder: new util.TextEncoder()
        });
    }

    // RPC ANTELOPE TABLE CHECK
    async doTableCheck(name, account, scope, table, reverse, callback) {
        if(this.checking_table === false){
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
                        limit: 100,
                        lower_bound: this.next_key
                    });
                    count += results.rows.length;
                    this.log(`${name}: Table check has processed ${count} request rows`);
                    for(var i = 0; i < results.rows.length; i++) {
                        await callback(results.rows[i]);
                    };
                    if (results.more) {
                        more = true;
                        this.next_key = results.next_key;
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
    }

    // HYPERION STREAM
    async startStream(name, account, table, scope, callback){
        let getInfo = await this.rpc.get_info();
        let headBlock = getInfo.head_block_num;
        this.lastReceivedBlock = headBlock;
        this.log(`${name}: Starting Hyperion Stream ...`);
        this.streamClient = new HyperionStreamClient(
            this.hyperion,
            {
                async: true,
                fetch: fetch,
                debug: true,
                endpoint: this.hyperion,
            }
        );
        this.streamClient.onConnect = () => {
            this.log(`${name}: Connecting to Hyperion Stream ...`);
            this.streamClient.streamDeltas({
                code: account,
                table: table,
                scope: scope,
                payer: "",
                start_from: headBlock,
                read_until: 0,
            });
        };
        this.streamClient.onData = async (data, ack) => {
            this.lastReceivedBlock = data.block_num;
            if (data.content.present && scope === nameToInt(data.content.scope) || data.content.present && scope === data.content.scope.toString()) {
                await callback(data);
            }
            ack();
        };

        let interval = setInterval(async () => {
            if(this.lastReceivedBlock !== 0){
                let getInfo = await this.rpc.get_info();
                if(this.max_block_diff < ( getInfo.head_block_num - this.lastReceivedBlock)){
                    clearInterval(interval);
                    this.log(`${name}: Restarting Hyperion Stream...`);
                    this.streamClient.disconnect();
                    await this.startStream(name, account, table, scope, callback);
                }
            }
        }, this.check_interval_ms);

        await this.streamClient.connect(() => {
            this.log(`${name}: Connected to Hyperion Stream !`);
        });
    }

    // LOG UTIL
    log(message){
        if(this.console_log) console.log(message);
    }
}

module.exports = Listener;
