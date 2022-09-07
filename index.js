require('dotenv').config()
const RNGListener = require('./src/RNGListener')
const DelphiListener = require('./src/DelphiListener')
const GasListener = require('./src/GasListener')
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

const oracle = {"name": process.env.ORACLE_NAME, "permission": process.env.ORACLE_PERMISSION, "key":  process.env.ORACLE_SIGNER_KEY};

if(parseInt(process.env.DELPHI_LISTENER) == 1){
    const delphiRequestListener = new DelphiListener(oracle, rpc, api, {"antelope_account": process.env.DELPHI_CONTRACT, "eth_account": process.env.GAS_EVM_CONTRACT })
    delphiRequestListener.start();
}
if(parseInt(process.env.RNG_LISTENER) == 1){
    const rngRequestListener = new RNGListener(oracle, rpc, api, {"antelope_account": process.env.RNG_CONTRACT })
    rngRequestListener.start();
}
if(parseInt(process.env.GAS_LISTENER) == 1){
    const evm_api = new TelosEvmApi({
        endpoint: process.env.EVM_API_ENDPOINT,
        chainId: process.env.CHAIN_ID,
        ethPrivateKeys: [],
        fetch: fetch,
        telosContract: "eosio.evm",
        telosPrivateKeys: []
    });
    const evm_provider = new ethers.providers.JsonRpcProvider(process.env.EVM_RPC_ENDPOINT);
    const gasListener = new GasListener(oracle, rpc, api, {"antelope_account": process.env.GAS_CONTRACT, "eth_account": process.env.GAS_EVM_CONTRACT }, evm_provider, evm_api, process.env.GAS_CHECK_INTERVAL_MS)
    gasListener.start();
}
