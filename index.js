const { RNGRequestListener, RNGBridgeListener, DelphiBridgeListener, GasBridgeListener }  = require('./src/listeners');
const { DelphiOracleUpdater }  = require('./src/updaters');
const DelphiOracleCallbacks  = require('./src/callbacks/DelphiOracleCallbacks');
const ConfigLoader = require('./src/ConfigLoader');
const Eos = require('eosjs');
const JsonRpc = Eos.JsonRpc;
const { TelosEvmApi } = require("@telosnetwork/telosevm-js");
const fetch = require('node-fetch');
const ethers = require("ethers");

// Read config
const configLoader = new ConfigLoader("config.yml");
const config = configLoader.load();
if(!config){
    throw('/!\\ Stopping. Failed to load config. See errors above ^');
}

// Instantiate services & variables
const rpc = new JsonRpc(config.antelope.rpc, { fetch });
const evm_provider = new ethers.providers.JsonRpcProvider(config.evm.rpc);

const evm_api = new TelosEvmApi({
    endpoint: config.evm.api,
    chainId: config.evm.network,
    ethPrivateKeys: [],
    fetch: fetch,
    telosContract: "eosio.evm",
    telosPrivateKeys: []
});
const listeners = config.scripts.listeners;
const updaters = config.scripts.updaters;


// Delphi Bridge Listener
if(listeners.delphi.bridge.active){
    const delphiBridgeListener = new DelphiBridgeListener(listeners.delphi.account, rpc, evm_provider, evm_api, config.scripts.listeners, config.antelope.hyperion)
    delphiBridgeListener.start();
}
// Delphi Updater
if(updaters.delphi.active){
    const delphiOracleUpdater = new DelphiOracleUpdater(updaters.delphi.account, updaters, rpc)
    const callbacks = new DelphiOracleCallbacks();
    delphiOracleUpdater.start(callbacks.onRequestSuccess, callbacks.onRequestFailure);
}
// RNG Bridge Listener
if(listeners.rng.bridge.active){
    const rngBridgeListener = new RNGBridgeListener(listeners.rng.account, rpc, evm_provider, evm_api, config.scripts.listeners, config.antelope.hyperion)
    rngBridgeListener.start();
}
// RNG Requests Listener
if(listeners.rng.request.active){
    const rngRequestListener = new RNGRequestListener(listeners.rng.account, rpc, config.scripts.listeners, config.antelope.hyperion)
    rngRequestListener.start();
}
// Gas Bridge Listener
if(listeners.gas.bridge.active){
    const gasBridgeListener = new GasBridgeListener(listeners.gas.account, rpc, evm_provider, evm_api, config.scripts.listeners, config.antelope.hyperion)
    gasBridgeListener.start();
}
