const HyperionStreamClient = require("@eosrio/hyperion-stream-client").default;
const fetch = require("node-fetch");

class Listener {
    constructor(
        oracle,
        rpc,
        api,
        config,
        bridge
    ) {
        this.caller = {"name": config.antelope.oracle.name, "permission": config.antelope.oracle.permission, "private_key":  config.antelope.oracle.private_key, "signing_key":  config.antelope.oracle.signing_key};
        this.oracle = oracle;
        this.bridge = bridge;
        this.check_interval_ms = config.scripts.listeners.check_interval_ms;
        this.max_block_diff = config.scripts.listeners.max_block_diff;
        this.hyperion = config.antelope.hyperion;
        this.rpc = rpc;
        this.console_log = (config.scripts.listeners.console_log) ? true : false;
        this.api = api;
        this.counter = 0;
    }
    async startStream(name, account, table, scope, callback){
        let getInfo = await this.rpc.get_info();
        let headBlock = getInfo.head_block_num;
        this.streamClient = new HyperionStreamClient(
            this.hyperion,
            {
                async: true,
                fetch: fetch,
            }
        );
        this.streamClient.lastReceivedBlock = headBlock;
        this.streamClient.onConnect = () => {
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
            this.streamClient.lastReceivedBlock = data.block_num;
            if (data.content.present) {
                await callback(data);
            }
            ack();
        };
        this.streamClient.connect(() => {
            this.log("Connected to Hyperion Stream for " + name + "...");
        });

        let interval = setInterval(async () => {
            if(typeof this.streamClient.lastReceivedBlock !== "undefined" && this.streamClient.lastReceivedBlock !== 0){
                let getInfo = await this.rpc.get_info();
                if(this.max_block_diff < ( getInfo.head_block_num - this.streamClient.lastReceivedBlock)){
                    clearInterval(interval);
                    this.log("Restarting stream for " + name + "...");
                    this.streamClient.disconnect();
                    await this.startStream(account, table, scope, callback);
                }
            }
        }, this.check_interval_ms)
    }
    log(message){
        if(this.console_log) console.log(message);
    }
}

module.exports = Listener;
