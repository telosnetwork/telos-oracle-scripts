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
    // HYPERION STREAM
    await super.startStream("Delphi Oracle Bridge", EOSIO_EVM, ACCOUNT_STATE_TABLE, this.bridge.eosio_evm_scope, async(data) => {
      if (this.counter == 0) { // Counter to get only one call per new request (as listener gets called foreach row)
        await this.notify(data);
      }
      this.counter++;
      this.counter = (this.counter == 11) ? 0 : this.counter;
    });

    // RPC TABLE CHECK
    await this.doTableCheck();
    setInterval(async () => {
      await this.doTableCheck();
    }, this.check_interval_ms)
  }

  async doTableCheck(){
    await super.doTableCheck("Delphi Oracle Bridge", EOSIO_EVM, this.bridge.eosio_evm_scope, ACCOUNT_STATE_TABLE, async() => {
      if(this.counter == 11) { // Counter to get only new requests (we only need to call reqnotify once, it will check the table for all requests, but table already has base rows (other contract variable))
        await this.notify();
      } else {
        this.counter++;
      }
    });
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
}

module.exports = DelphiBridgeListener;
