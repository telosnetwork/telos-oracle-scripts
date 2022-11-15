const ecc = require("eosjs-ecc");
const Listener = require("../Listener");

const REQUESTS_TABLE = "rngrequests";

class RNGRequestListener extends Listener {

    constructor(
        oracle,
        rpc,
        config,
        hyperion
    ){
        const conf = config.rng.request;
        super(oracle, rpc, config, hyperion, {"name": config.rng.caller.name, "permission": config.rng.caller.permission, "private_key":  config.rng.caller.private_key, "signing_key":  config.rng.caller.signing_key});
        if(conf.check_interval_ms){
            this.check_interval_ms = conf.check_interval_ms; // Override base interval
        }
        this.processing = [];
    }

    async start() {
        if (typeof this.caller.signing_key === "undefined" ){
            this.log('/!\\ RNG Oracle Request: Signing key is undefined. RNG Oracle Request script will not try to sign requests.')
        }
        await this.doTableCheck();

        // HYPERION STREAM
        await super.startStream("RNG Oracle Request", this.oracle, REQUESTS_TABLE, this.oracle, async (data) => {
            await this.signRow(data);
        });
        // RPC TABLE CHECK
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
        if(!this.abi){
            await this.api.getAbi(this.oracle);
            this.abi = true;
        }
        this.processing.push(row.request_id);
        this.log(`RNG Oracle Request: Signing request_id: ${row.request_id}...`);
        let ctx = this;
        try {
            await this.api.buildTransaction(async (tx) => {
                tx.with(this.oracle).as([{ actor: this.caller.name, permission: this.caller.permission}]).submitrand(row.request_id, this.caller.name, ecc.signHash(row.digest, this.caller.signing_key))
                await tx.send({ blocksBehind: 3, expireSeconds: 90 });
            });

            this.log(`RNG Oracle Request: Signed request ${row.request_id}`);

            setTimeout(function () {
                ctx.removeProcessingRequest(row.request_id);
            }, this.check_interval_ms) // Timeout the size of check interval

            return true;

        } catch (e) {
            this.log(`RNG Oracle Request: Submitting signature for request ${row.request_id} failed: ${e}`);

            try {
                this.log(`RNG Oracle Request: Calling notifyfail()`);
                await this.api.buildTransaction(async (tx) => {
                    tx.with(this.oracle).as([{ actor: this.caller.name, permission: this.caller.permission}]).notifyfail(row.request_id, this.caller.name)
                    await tx.send({ blocksBehind: 3, expireSeconds: 90 });
                });

                setTimeout(function () {
                    ctx.removeProcessingRequest(row.request_id);
                }, 600000);

                return false;

            } catch (e) {
                this.log(`RNG Oracle Request: Calling notifyfail() failed: ${e}`);
                setTimeout(function () {
                    ctx.removeProcessingRequest(row.request_id);
                }, 600000);
                return false;
            }
        }
    }
}

module.exports = RNGRequestListener;
