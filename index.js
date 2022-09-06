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

const signatureProvider = new JsSignatureProvider([process.env.ORACLE_KEY]);
const rpc = new JsonRpc(process.env.RPC_ENDPOINT, { fetch })

const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new util.TextDecoder(),
    textEncoder: new util.TextEncoder()
});

if(parseInt(process.env.DELPHI_LISTENER) == 1){
    const delphiRequestListener = new DelphiListener(process.env.ORACLE_CONTRACT, process.env.ORACLE_NAME, process.env.ORACLE_PERMISSION, rpc, api, process.env.ORACLE_SIGNER_KEY)
    delphiRequestListener.start();
}
if(parseInt(process.env.RNG_LISTENER) == 1){
    const rngRequestListener = new RNGListener(process.env.ORACLE_CONTRACT, process.env.ORACLE_NAME, process.env.ORACLE_PERMISSION, rpc, api, process.env.ORACLE_SIGNER_KEY)
    rngRequestListener.start();
}
if(parseInt(process.env.GAS_LISTENER) == 1){
    const gasListener = new GasListener(process.env.ORACLE_CONTRACT, process.env.ORACLE_NAME, process.env.ORACLE_PERMISSION, rpc, api, process.env.ORACLE_SIGNER_KEY)
    gasListener.start();
}
