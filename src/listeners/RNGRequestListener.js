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
            this.log('/!\\ Signing key is undefined. Script will not try to sign.')
        }
        await super.startStream("RNG Oracle Request", this.oracle, REQUESTS_TABLE, this.oracle, async (data) => {
            await this.signRow(data.content.data);
        })
        await this.doTableCheck();
        setInterval(async () => {
            await this.doTableCheck();
        }, this.check_interval_ms)
    }

    async doTableCheck() {
        this.log(`Doing table check for RNG Oracle Requests...`);
        const results = await this.rpc.get_table_rows({
            code: this.oracle,
            scope: this.oracle,
            table: REQUESTS_TABLE,
            limit: 1000,
            reverse: true
        });

        await results.rows.forEach(async (row) => {
            if(!row.sig2 || row.sig2 === '' ||  row.oracle2 === "eosio.null"){
                await this.signRow(row);
            }
        });
        this.log(`Done doing table check for RNG Oracle Requests ! `);
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
        this.log(`Signing request_id: ${row.request_id}...`)
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
                { blocksBehind: 10, expireSeconds: 60 }
            );
            this.log(`Signed request ${row.request_id}`);
            this.removeProcessingRequest(row.request_id);
            return result;
        } catch (e) {
            console.error(`Submitting signature failed: ${e}`);
            this.removeProcessingRequest(row.request_id);
            return false;
        }
    }
}

module.exports = RNGRequestListener;
