const ecc = require("eosjs-ecc");
const Listener = require("../Listener");

const ACCOUNT_STATE_TABLE = "accountstate";
const EOSIO_EVM = "eosio.evm";

class DelphiBridgeListener extends Listener {
  constructor(
      oracle,
      rpc,
      api,
      config,
      bridge
  ){
    super(oracle, rpc, api, config, bridge);
    const conf = config.scripts.listeners.delphi.bridge;
    if(conf.check_interval_ms){
      this.check_interval_ms = conf.check_interval_ms; // Override base interval
    }
  }

  async start() {
    await super.startStream("Delphi Oracle Bridge", EOSIO_EVM, ACCOUNT_STATE_TABLE, this.bridge.eosio_evm_scope, async(data) => {
      if (this.counter == 0) { // Counter to get only one call per new request (as listener gets called foreach row)
        await this.notify(data);
      }
      this.counter++;
      this.counter = (this.counter == 11) ? 0 : this.counter;
    });
    await this.doTableCheck();
    setInterval(async () => {
      await this.doTableCheck();
    }, this.check_interval_ms)
  }

  async notify(){
    return await this.api.transact({
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
      if(this.counter == 11) { // Counter to get only new request
        await this.notify();
      }
      this.counter++;
    });
    this.log(`Done doing table check for Delphi Oracle Bridge !`);
  }

}

module.exports = DelphiBridgeListener;
