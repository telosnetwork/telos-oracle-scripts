const EVMListener = require("../EVMListener");
const { BigNumber, ethers, utils } = require("ethers");
const ABI = [{"inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "requests", "outputs": [{ "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "address", "name": "caller_address", "type": "address"}, { "internalType": "uint256", "name": "caller_id",  "type": "uint256" }, { "internalType": "uint256", "name": "requested_at", "type": "uint256" }, { "internalType": "uint64", "name": "seed", "type": "uint64" }, { "internalType": "uint256", "name": "min", "type": "uint256" }, { "internalType": "uint256", "name": "max", "type": "uint256" }, { "internalType": "uint256", "name": "callback_gas", "type": "uint256" }, { "internalType": "address",  "name": "callback_address", "type": "address" }], "stateMutability": "view", "type": "function"}];
const ACCOUNT_STATE_TABLE = "accountstate";
const EOSIO_EVM = "eosio.evm";

class DelphiBridgeListener extends EVMListener {
  constructor(
      oracle,
      rpc,
      api,
      evm_provider,
      evm_api,
      config,
      bridge
  ){
    super(oracle, rpc, api, evm_provider, evm_api, config, bridge);
    const conf = config.scripts.listeners.delphi.bridge;
    if(conf.check_interval_ms){
      this.check_interval_ms = conf.check_interval_ms; // Override base interval
    }
  }

  async start() {
    await super.startStream("Delphi Oracle Bridge", EOSIO_EVM, ACCOUNT_STATE_TABLE, this.bridge.eosio_evm_scope, async(data) => {
      // We use a counter because that table contains ALL EVM contract variables, not just the requests and requests also have several rows
      if (this.counter == 11) {
        await this.notify();
        this.counter = -1;
      }
      this.counter++;
    });

    // RPC TABLE CHECK
    await this.doCheck();
    setInterval(async () => {
      await this.doCheck();
    }, this.check_interval_ms)
  }

  async doCheck(){
    this.log("Delphi Oracle Bridge: Doing table check...");
    try {
      const evm_contract = new ethers.Contract(this.bridge.eth_account, ABI, this.evm_provider);
      const request = await evm_contract.requests(0);
      await this.notify();
      this.log("Delphi Oracle Bridge: Done doing table check");
      return true;
    } catch (e) {
      this.log("Delphi Oracle Bridge: Table check reverted, no requests found");
      return false;
    }
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
        this.log('Delphi Oracle Bridge: Request(s) found. Called reqnotify()');
      }).catch(e => {
        this.log('Delphi Oracle Bridge:  Request(s) found but call to reqnotify() failed. Caught exception: ' + e);
      });
  }
}

module.exports = DelphiBridgeListener;
