require('dotenv').config()
const RNGBridgeListener = require('./src/RNGBridgeListener')
const RNGRequestListener = require('./src/RNGRequestListener')
const DelphiBridgeListener = require('./src/DelphiBridgeListener')
const GasBridgeListener = require('./src/GasBridgeListener')
const eosjs = require('eosjs')
const JsSignatureProvider = require('eosjs/dist/eosjs-jssig').JsSignatureProvider
const JsonRpc = eosjs.JsonRpc
const Api = eosjs.Api
const fetch = require('node-fetch')
const util = require('util')
const ethers = require("ethers");
const  { TelosEvmApi } = require("@telosnetwork/telosevm-js");

const signatureProvider = new JsSignatureProvider([process.env.ORACLE_KEY]);
const rpc = new JsonRpc(process.env.RPC_ENDPOINT, { fetch })

const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new util.TextDecoder(),
    textEncoder: new util.TextEncoder()
});

const caller = {"name": process.env.ORACLE_NAME, "permission": process.env.ORACLE_PERMISSION, "key":  process.env.ORACLE_SIGNER_KEY};
const listeners = {"delphi": parseInt(process.env.DELPHI_LISTENER), "rng": parseInt(process.env.RNG_LISTENER), "gas":  parseInt(process.env.GAS_LISTENER)};

if(listeners.delphi){
    const delphiBridgeListener = new DelphiBridgeListener(caller, rpc, api, {"antelope_account": process.env.DELPHI_CONTRACT, "eosio_evm_scope" : process.env.DELPHI_EOSIO_EVM_SCOPE })
    delphiBridgeListener.start();
}
if(listeners.rng){
    const rngBridgeListener = new RNGBridgeListener(caller, rpc, api, {"antelope_account": process.env.RNG_CONTRACT, "eosio_evm_scope" : process.env.RNG_EOSIO_EVM_SCOPE })
    rngBridgeListener.start();
    const rngRequestListener = new RNGRequestListener(caller, rpc, api, {"antelope_account": process.env.RNG_CONTRACT, "eosio_evm_scope" : process.env.RNG_EOSIO_EVM_SCOPE })
    rngRequestListener.start();
}
if(listeners.gas){
    const evm_api = new TelosEvmApi({
        endpoint: process.env.EVM_API_ENDPOINT,
        chainId: process.env.CHAIN_ID,
        ethPrivateKeys: [],
        fetch: fetch,
        telosContract: "eosio.evm",
        telosPrivateKeys: []
    });
    const evm_provider = new ethers.providers.JsonRpcProvider(process.env.EVM_RPC_ENDPOINT);
    const gasBridgeListener = new GasBridgeListener(caller, rpc, api, {"antelope_account": process.env.GAS_CONTRACT, "eth_account": process.env.GAS_EVM_CONTRACT }, evm_provider, evm_api, process.env.GAS_CHECK_INTERVAL_MS)
    gasBridgeListener.start();
}
