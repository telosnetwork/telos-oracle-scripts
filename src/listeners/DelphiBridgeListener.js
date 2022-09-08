const ecc = require("eosjs-ecc");
const HyperionStreamClient = require("@eosrio/hyperion-stream-client").default;
const fetch = require("node-fetch");
const Listener = require("../Listener");
require('dotenv').config();

const MAX_BLOCK_DIFF = parseInt(process.env.MAX_BLOCK_DIFF);
const INTERVAL_MS = parseInt(process.env.TABLE_CHECK_INTERVAL_MS);

class DelphiBridgeListener extends Listener {

  async start() {
    await this.startStream();
    await this.doTableCheck();
    setInterval(async () => {
      await this.doTableCheck();
    }, this.check_interval_ms)
  }

  async startStream() {
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
        code: 'eosio.evm',
        table: "accountstate",
        scope: this.bridge.eosio_evm_scope,
        payer: "",
        start_from: headBlock,
        read_until: 0,
      });
    };

    this.streamClient.onData = async (data, ack) => {
      this.streamClient.lastReceivedBlock = data.block_num;
      if (data.content.present) {
        if (this.counter == 0) { // Counter to get only one call per new request (as listener gets called foreach row)
          await this.notify(data);
        }
        this.counter++;
        this.counter = (this.counter == 11) ? 0 : this.counter;
      }
      ack();
    };

    this.streamClient.connect(() => {
      this.log("Connected to Hyperion Stream for Delphi Oracle Bridge");
    });

    let interval = setInterval(async () => {
      if(typeof this.streamClient.lastReceivedBlock !== "undefined" && this.streamClient.lastReceivedBlock !== 0){
        let getInfo = await this.rpc.get_info();
        if(this.max_block_diff < ( getInfo.head_block_num - this.streamClient.lastReceivedBlock)){
          clearInterval(interval);
          this.log("Restarting stream for Delphi Oracle Bridge...");
          this.streamClient.disconnect();
          await this.startStream();
        }
      }
    }, this.check_interval_ms)
  }
  async notify(){
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

  async doTableCheck() {
    this.log(`Doing table check for Delphi Oracle Bridge...`);
    const results = await this.rpc.get_table_rows({
      code: "eosio.evm",
      scope: this.bridge.eosio_evm_scope,
      table: "accountstate",
      limit: 1000,
    });
    this.counter = 0;
    results.rows.forEach(async(row) => {
      if(this.counter == 0) { // Counter to get only one call per new request (as listener gets called foreach row)
        await this.notify(data);
      }
      this.counter++;
      this.counter = (this.counter == 11) ? 0 : this.counter;
    });
    this.log(`Done doing table check!`);
  }

}

module.exports = DelphiBridgeListener;
