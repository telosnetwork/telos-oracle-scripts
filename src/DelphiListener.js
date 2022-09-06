const ecc = require("eosjs-ecc");
const HyperionStreamClient = require("@eosrio/hyperion-stream-client").default;
const fetch = require("node-fetch");
const Listener = require("./Listener");

class DelphiListener extends Listener {

  async start() {
    await this.startStream();
    await this.doTableCheck();
    // TODO: maybe a 15 second setInterval against doTableCheck?  In case stream takes a crap?
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
        code: 'eosio.evm',
        table: "accountstate",
        scope: this.scope,
        payer: "",
        start_from: headBlock,
        read_until: 0,
      });
    };

    this.streamClient.onData = async (data, ack) => {
      if (data.content.present) await this.signRow(data.content.data);

      if(this.counter == 0){
        this.api.transact({
          actions: [{
            account: this.bridgeNativeContract,
            name: 'reqnotify',
            authorization: [{ actor: this.bridgeNativeContract, permission: 'active' }],
            data: {},
          }]
        }, {
          blocksBehind: 3,
          expireSeconds: 90,
        }).then(result => {
          console.log('\nCalled reqnotify()');
        }).catch(e => {
          console.log('\nCaught exception: ' + e);
        });
      }

      this.counter++;
      if(this.counter == 11){
        this.counter = 0;
      }

      ack();
    };

    this.streamClient.connect(() => {
      console.log("Connected to Hyperion Stream for Delphi Oracle Bridge");
    });
  }

  async doTableCheck() {
    console.log(`Doing table check...`);
    const results = await this.rpc.get_table_rows({
      code: 'eosio.evm',
      scope: this.scope,
      table: "accountstate",
      limit: 1000,
    });

    results.rows.forEach((row) => {

    });
    console.log(`Done doing table check!`);
  }

}

module.exports = DelphiListener;
