const HyperionStreamClient = require("@eosrio/hyperion-stream-client").default;
const fetch = require("node-fetch");
const nameToInt = require('./utils/anteloppeName');

class Listener {
    constructor(
        oracle,
        rpc,
        api,
        config,
        bridge
    ) {
        this.caller = {"name": config.antelope.caller.name, "permission": config.antelope.caller.permission, "private_key":  config.antelope.caller.private_key, "signing_key":  config.antelope.caller.signing_key};
        this.oracle = oracle;
        this.bridge = bridge;
        this.check_interval_ms = config.scripts.listeners.check_interval_ms;
        this.max_block_diff = config.scripts.listeners.max_block_diff;
        this.hyperion = config.antelope.hyperion;
        this.rpc = rpc;
        this.console_log = (config.scripts.listeners.console_log) ? true : false;
        this.api = api;
        this.counter = 0;
        this.checking_table = false;
        this.next_key = '';
        this.lastReceivedBlock = 0;
        this.streamClient = null;
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
                        limit: 500,
                        lower_bound: this.next_key
                    });
                    count += results.rows.length;
                    console.log(`Table check has processed ${count} request rows`);
                    results.rows.forEach(async(row) => {
                        await callback(row);
                    });
                    if (results.more) {
                        more = true;
                        this.next_key = results.next_key;
                    } else {
                        more = false;
                    }
                } catch (e) {
                    more = false;
                    this.log(`${name}: ${e}`);
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
