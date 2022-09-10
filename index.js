const { RNGRequestListener, RNGBridgeListener, DelphiBridgeListener, GasBridgeListener }  = require('./src/listeners');
const { DelphiOracleUpdater }  = require('./src/updaters');
const ConfigLoader = require('./src/ConfigLoader');
const eosjs = require('eosjs');
const JsSignatureProvider = require('eosjs/dist/eosjs-jssig').JsSignatureProvider;
const JsonRpc = eosjs.JsonRpc;
const Api = eosjs.Api;
const { TelosEvmApi } = require("@telosnetwork/telosevm-js");
const fetch = require('node-fetch');
const util = require('util');
const ethers = require("ethers");

// Read config
const configLoader = new ConfigLoader("config.yml");
const config = configLoader.load();
if(!config){
    throw('/!\\ Stopping. Failed to load config. See errors above ^');
}

// Instantiate services & variables
const signatureProvider = new JsSignatureProvider([config.antelope.oracle.private_key]);
const rpc = new JsonRpc(config.antelope.rpc, { fetch });
const evm_provider = new ethers.providers.JsonRpcProvider(config.evm.rpc);
const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new util.TextDecoder(),
    textEncoder: new util.TextEncoder()
});
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
    const delphiBridgeListener = new DelphiBridgeListener(listeners.delphi.account, rpc, api, config, {"antelope_account": listeners.delphi.bridge.account, "eosio_evm_scope" : listeners.delphi.bridge.eosio_evm_scope })
    delphiBridgeListener.start();
}
// Delphi Updater
if(updaters.delphi.active){
    const delphiOracleUpdater = new DelphiOracleUpdater(updaters.delphi.account, config)
}
// RNG Bridge Listener
if(listeners.rng.bridge.active){
    const rngBridgeListener = new RNGBridgeListener(listeners.rng.account, rpc, api, config, {"antelope_account": listeners.rng.bridge.account, "eosio_evm_scope" : listeners.rng.bridge.eosio_evm_scope })
    rngBridgeListener.start();
}
// RNG Requests Listener
if(listeners.rng.request.active){
    const rngRequestListener = new RNGRequestListener(listeners.rng.account, rpc, api, config)
    rngRequestListener.start();
}
// Gas Bridge Listener
if(listeners.gas.bridge.active){
    const gasBridgeListener = new GasBridgeListener(listeners.gas.account, rpc, api, evm_provider, evm_api, config, {"antelope_account": listeners.gas.bridge.account, "eth_account": listeners.gas.bridge.evm_contract })
    gasBridgeListener.start();
}
