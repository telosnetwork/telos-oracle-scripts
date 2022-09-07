const ecc = require("eosjs-ecc");
const HyperionStreamClient = require("@eosrio/hyperion-stream-client").default;
const fetch = require("node-fetch");
const Listener = require("./Listener");
require('dotenv').config();

const REQUESTS_TABLE = "rngrequests";
const MAX_BLOCK_DIFF = parseInt(process.env.MAX_BLOCK_DIFF);
const INTERVAL_MS = parseInt(process.env.TABLE_CHECK_INTERVAL_MS);

class RNGRequestListener extends Listener {

    async start() {
        await this.startStream();
        await this.doTableCheck();
        setInterval(async () => {
            await this.doTableCheck();
        }, INTERVAL_MS)
    }

    async startStream() {
        this.streamClient = new HyperionStreamClient(
            process.env.HYPERION_ENDPOINT,
            {
                async: true,
                fetch: fetch,
            }
        );
        let getInfo = await this.rpc.get_info();
        let headBlock = getInfo.head_block_num;
        this.streamClient.onConnect = () => {
            this.streamClient.streamDeltas({
                code: "rng.oracle",
                table: REQUESTS_TABLE,
                scope: "rng.oracle",
                payer: "",
                start_from: headBlock,
                read_until: 0,
            });
        };

        this.streamClient.onData = async (data, ack) => {
            if (data.content.present) await this.signRow(data.content.data);

            ack();
        };

        this.streamClient.connect(() => {
            this.log("Connected to Hyperion Stream for RNG Oracle!");
        });

        // check lastReceivedBlock isn't too far from HEAD, else stop stream & start again
        let interval = setInterval(async () => {
            if(typeof this.streamClient.lastReceivedBlock !== "undefined" && this.streamClient.lastReceivedBlock !== 0){
                let getInfo = await this.rpc.get_info();
                if(MAX_BLOCK_DIFF < ( getInfo.head_block_num - this.streamClient.lastReceivedBlock)){
                    clearInterval(interval);
                    this.streamClient.disconnect();
                    await this.startStream();
                }
            }
        }, INTERVAL_MS)
    }

    async doTableCheck() {
        this.log(`Doing table check...`);
        const results = await this.rpc.get_table_rows({
            code: "rng.oracle",
            scope: "rng.oracle",
            table: REQUESTS_TABLE,
            limit: 1000,
        });

        let signed = 0;

        results.rows.forEach(async (row) => {
            if(!row.sig2 || row.sig2 === ''){
                signed = (await this.signRow(row)) ? signed + 1 : signed;
            }
        });

        this.log(`Done doing table check ! Signed ${signed} rows`);
    }

    async signRow(row) {
        this.log(`Signing request_id: ${row.request_id}...`)
        if (row.oracle1 == this.caller.name || row.oracle2 == this.caller.name)
            return;

        try {
            const result = await this.api.transact(
                {
                    actions: [
                        {
                            account: "rng.oracle",
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
                                sig: ecc.signHash(row.digest, this.caller.key),
                            },
                        },
                    ],
                },
                { blocksBehind: 10, expireSeconds: 60 }
            );
            this.log(`Signed request ${row.request_id}`);
            return true;
        } catch (e) {
            console.error(`Submitting signature failed: ${e}`);
            return false;
        }
        return true;
    }
}

module.exports = RNGRequestListener;
