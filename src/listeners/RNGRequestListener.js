const ecc = require("eosjs-ecc");
const Listener = require("../Listener");

const REQUESTS_TABLE = "rngrequests";

class RNGRequestListener extends Listener {

    constructor(
        oracle,
        rpc,
        api,
        config,
        bridge
    ){
        super(oracle, rpc, api, config, bridge);
        const conf = config.scripts.listeners.rng.request;
        if(conf.check_interval_ms){
            this.check_interval_ms = conf.check_interval_ms; // Override base interval
        }
        this.processing = [];
    }

    async start() {
        if (typeof this.caller.signing_key === "undefined" ){
            this.log('/!\\ RNG Oracle Request: Signing key is undefined. RNG Oracle Request script will not try to sign.')
        }
        // HYPERION STREAM
        await super.startStream("RNG Oracle Request", this.oracle, REQUESTS_TABLE, this.oracle, async (data) => {
            await this.signRow(data.content.data);
        })
        // RPC TABLE CHECK
        await this.doTableCheck();
        setInterval(async () => {
            await this.doTableCheck();
        }, this.check_interval_ms)
    }

    async doTableCheck(){
        await super.doTableCheck("RNG Oracle Request", this.oracle, this.oracle, REQUESTS_TABLE, false, async(row) => {
            await this.signRow(row);
        });
    }

    removeProcessingRequest(request_id){
        const index = this.processing.indexOf(request_id);
        if (index > -1) { this.processing.splice(index, 1);  }
    }

    async signRow(row) {
        if (this.processing.includes(row.request_id) || typeof this.caller.signing_key === "undefined" || row.oracle1 === this.caller.name || row.oracle2 === this.caller.name){
            return false;
        }
        this.processing.push(row.request_id);
        this.log(`RNG Oracle Request: Signing request_id: ${row.request_id}...`);
        let ctx = this;
        try {
            const result = await this.api.transact(
                {
                    actions: [
                        {
                            account: this.oracle,
                            name: "submitrand",
                            authorization: [
                                {
                                    actor: this.caller.name,
                                    permission: this.caller.permission,
                                },
                            ],
                            data: {
                                request_id: row.request_id,
                                oracle_name: this.caller.name,
                                sig: ecc.signHash(row.digest, this.caller.signing_key),
                            },
                        },
                    ],
                },
                { blocksBehind: 100, expireSeconds: 600 }
            );
            this.log(`RNG Oracle Request: Signed request ${row.request_id}`);
            setTimeout(function () {
                ctx.removeProcessingRequest(row.request_id);
            }, this.check_interval_ms) // Timeout the size of check interval
            return result;
        } catch (e) {
            console.error(`RNG Oracle Request: Submitting signature for request ${row.request_id} failed: ${e}`);
            setTimeout(function () {
                ctx.removeProcessingRequest(row.request_id);
            }, 1200000) // Big timeout so we don't retry endlessly if there is a request stuck
            return false;
        }
    }
}

module.exports = RNGRequestListener;
