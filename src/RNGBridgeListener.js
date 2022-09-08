const ecc = require("eosjs-ecc");
const HyperionStreamClient = require("@eosrio/hyperion-stream-client").default;
const fetch = require("node-fetch");
const { BigNumber, ethers, utils } = require("ethers");
const Listener = require("./Listener");

const ACCOUNT_STATE_TABLE = "accountstate";

class RNGListener extends Listener {
    async start() {
        try {
            // Get the scope for our EVM contrat in Mandel eosio.evm contract
            await this.startStream();
        } catch (e) {

        }

        // await this.doTableCheck();
        // TODO: maybe a 15 second setInterval against doTableCheck?  In case stream takes a crap?
        // Or: find a way to check stream health at set interval (better), if failed then doTableCheck & launch stream back
        // Or: disconnect and connect back every X minutes
    }

    async doTableCheck() {
        this.log(`Doing table check...`);
        const results = await this.rpc.get_table_rows({
            code:  "rng.oracle",
            table: ACCOUNT_STATE_TABLE,
            scope: this.bridge.eosio_evm_scope,
            limit: 1000,
        });

        results.rows.forEach((row) => this.signRow(row));
        this.log(`Done doing table check!`);
    }
    async startStream() {
        this.streamClient = new HyperionStreamClient(
            this.hyperion,
            {
                async: true,
                fetch: fetch,
            }
        );
        let getInfo = await this.rpc.get_info();
        let headBlock = getInfo.head_block_num;
        this.streamClient.onConnect = () => {
            this.streamClient.streamDeltas({
                code: 'eosio.evm',
                table: ACCOUNT_STATE_TABLE,
                scope: this.bridge.eosio_evm_scope,
                payer: "",
                start_from: headBlock,
                read_until: 0,
            });
        };

        this.streamClient.onData = async (data, ack) => {
            if (data.content.present){
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
                        expireSeconds: 30,
                    }).then(result => {
                        this.log('\nCalled reqnotify()');
                    }).catch(e => {
                        this.log('\nCaught exception: ' + e);
                    });
                }
                this.counter++;
                this.counter = (this.counter == 11) ? 0 : this.counter;
            }
            ack();
        };

        this.streamClient.connect(() => {
            this.log("Connected to Hyperion Stream for RNG Oracle Bridge");
        });

        let interval = setInterval(async () => {
            if(typeof this.streamClient.lastReceivedBlock !== "undefined" && this.streamClient.lastReceivedBlock !== 0){
                let getInfo = await this.rpc.get_info();
                if(this.max_block_diff < ( getInfo.head_block_num - this.streamClient.lastReceivedBlock)){
                    clearInterval(interval);
                    this.streamClient.disconnect();
                    await this.startStream();
                }
            }
        }, this.check_interval_ms)

    }
}

module.exports = RNGListener;