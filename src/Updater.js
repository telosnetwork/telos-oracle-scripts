const Eos = require('eosjs');
const fetch = require('node-fetch');
const fs = require('fs');
const util = require('util');
const JsSignatureProvider = require('eosjs/dist/eosjs-jssig').JsSignatureProvider;
const Api = Eos.Api;

class Updater {
    constructor(oracle, config, rpc){
        this.update_interval_ms = updater_config.update_interval_ms;
        this.caller = {"name": config.caller.name, "permission": config.caller.permission, "private_key":  config.caller.private_key};
        this.oracle = oracle;
        this.console_log = config.console_log ? true : false;
        const signatureProvider = new JsSignatureProvider([config.caller.private_key]);
        this.api = new Api({
            rpc,
            signatureProvider,
            textDecoder: new util.TextDecoder(),
            textEncoder: new util.TextEncoder()
        });
    }
    log(message, error){
        if(this.console_log) console.log(message);
    }
}

module.exports = Updater;