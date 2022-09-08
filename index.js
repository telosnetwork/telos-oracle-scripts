const RNGBridgeListener = require('./src/RNGBridgeListener');
const RNGRequestListener = require('./src/RNGRequestListener');
const DelphiBridgeListener = require('./src/DelphiBridgeListener');
const GasBridgeListener = require('./src/GasBridgeListener');
const eosjs = require('eosjs');
const JsSignatureProvider = require('eosjs/dist/eosjs-jssig').JsSignatureProvider;
const JsonRpc = eosjs.JsonRpc;
const Api = eosjs.Api;
const fetch = require('node-fetch');
const fs   = require('fs');
const util = require('util');
const ethers = require("ethers");
const  { TelosEvmApi } = require("@telosnetwork/telosevm-js");
const yaml = require('js-yaml');

// Read config
const config = yaml.load(fs.readFileSync(__dirname + '/config.yml', 'utf8'));
const listeners = config.scripts.listeners;

// Instantiate services
const signatureProvider = new JsSignatureProvider([config.antelope.oracle.key]);
const rpc = new JsonRpc(config.antelope.rpc, { fetch });
const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new util.TextDecoder(),
    textEncoder: new util.TextEncoder()
});

const caller = {"name": config.antelope.oracle.name, "permission": config.antelope.oracle.permission, "key":  config.antelope.oracle.key};

// Delphi Bridge
if(listeners.delphi.bridge.active){
    const delphiBridgeListener = new DelphiBridgeListener(caller, rpc, api, {"antelope_account": listeners.delphi.account, "eosio_evm_scope" : listeners.delphi.bridge.eosio_evm_scope }, config.antelope.hyperion, listeners)
    delphiBridgeListener.start();
}
// RNG Bridge
if(listeners.rng.bridge.active){
    const rngBridgeListener = new RNGBridgeListener(caller, rpc, api, {"antelope_account": listeners.rng.account, "eosio_evm_scope" : listeners.rng.bridge.eosio_evm_scope }, config.antelope.hyperion, listeners)
    rngBridgeListener.start();
}
// RNG Requests
if(listeners.rng.request.active){
    const rngRequestListener = new RNGRequestListener(caller, rpc, api, {"antelope_account": listeners.rng.account, "eosio_evm_scope" : listeners.rng.bridge.eosio_evm_scope }, config.antelope.hyperion, listeners)
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
    const gasBridgeListener = new GasBridgeListener(caller, rpc, api, {"antelope_account": listeners.gas.bridge.account, "eth_account": listeners.gas.bridge.evm_contract }, config.antelope.hyperion, listeners, evm_provider, evm_api)
    gasBridgeListener.start();
}
