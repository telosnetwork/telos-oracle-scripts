const { RNGRequestListener, RNGBridgeListener, DelphiBridgeListener, GasBridgeListener }  = require('./src/listeners');
const { DelphiOracleUpdater }  = require('./src/updaters');
const ConfigLoader = require('./src/ConfigLoader');
const eosjs = require('eosjs');
const JsSignatureProvider = require('eosjs/dist/eosjs-jssig').JsSignatureProvider;
const JsonRpc = eosjs.JsonRpc;
const Api = eosjs.Api;
const fetch = require('node-fetch');
const util = require('util');
const ethers = require("ethers");
const  { TelosEvmApi } = require("@telosnetwork/telosevm-js");

// Read config
const configLoader = new ConfigLoader("config.yml");
const config = configLoader.load();
if(!config){
    throw('Stopping. Failed to load config. See above');
}

// Instantiate services & variables
const listeners = config.scripts.listeners;
const updaters = config.scripts.updaters;
const caller = {"name": config.antelope.oracle.name, "permission": config.antelope.oracle.permission, "key":  config.antelope.oracle.key};
const signatureProvider = new JsSignatureProvider([config.antelope.oracle.key]);
const rpc = new JsonRpc(config.antelope.rpc, { fetch });
const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new util.TextDecoder(),
    textEncoder: new util.TextEncoder()
});


// Delphi Bridge
if(listeners.delphi.bridge.active){
    const delphiBridgeListener = new DelphiBridgeListener(listeners.delphi.account, caller, rpc, api, {"antelope_account": listeners.delphi.bridge.account, "eosio_evm_scope" : listeners.delphi.bridge.eosio_evm_scope }, config.antelope.hyperion, listeners)
    delphiBridgeListener.start();
}
// Delphi Updater
if(updaters.delphi.active){
    const delphiOracleUpdater = new DelphiOracleUpdater(updaters.delphi.account, caller, updaters.delphi.check_interval_ms, updaters.delphi.methods)
}
// RNG Bridge
if(listeners.rng.bridge.active){
    const rngBridgeListener = new RNGBridgeListener(listeners.rng.account, caller, rpc, api, {"antelope_account": listeners.rng.bridge.account, "eosio_evm_scope" : listeners.rng.bridge.eosio_evm_scope }, config.antelope.hyperion, listeners)
    rngBridgeListener.start();
}
// RNG Requests
if(listeners.rng.request.active){
    const rngRequestListener = new RNGRequestListener(listeners.rng.account, caller, rpc, api, {"antelope_account": listeners.rng.bridge.account, "eosio_evm_scope" : listeners.rng.bridge.eosio_evm_scope }, config.antelope.hyperion, listeners)
    rngRequestListener.start();
}
// Gas Bridge
if(listeners.gas.bridge.active){
    const evm_api = new TelosEvmApi({
        endpoint: config.evm.api,
        chainId: config.evm.network,
        ethPrivateKeys: [],
        fetch: fetch,
        telosContract: listeners.gas.account,
        telosPrivateKeys: []
    });
    const evm_provider = new ethers.providers.JsonRpcProvider(config.evm.rpc);
    const gasBridgeListener = new GasBridgeListener(listeners.gas.account, caller, rpc, api, {"antelope_account": listeners.gas.bridge.account, "eth_account": listeners.gas.bridge.evm_contract }, config.antelope.hyperion, listeners, evm_provider, evm_api, listeners.gas.bridge.check_interval_ms)
    gasBridgeListener.start();
}
