const Eos = require('eosjs');
const fetch = require('node-fetch');
const fs = require('fs');

class Updater {
    constructor(oracle, config, updater_config, api){
        this.update_interval_ms = updater_config.update_interval_ms;
        this.caller = {"name": config.antelope.caller.name, "permission": config.antelope.caller.permission, "private_key":  config.antelope.caller.private_key, "signing_key":  config.antelope.caller.signing_key};
        this.oracle = oracle;
        this.api = api;
        this.console_log = config.scripts.updaters.console_log ? true : false;
    }
    log(message){
        if(this.console_log) console.log(message);
    }
}

module.exports = Updater;