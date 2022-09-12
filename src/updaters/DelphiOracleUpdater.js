const Eos = require('eosjs');
const fetch = require('node-fetch');
const fs = require('fs');

class DelphiOracleUpdater {
    constructor(oracle, config, api){
        this.update_interval_ms = config.scripts.updaters.delphi.update_interval_ms;
        this.caller = {"name": config.antelope.caller.name, "permission": config.antelope.caller.permission, "private_key":  config.antelope.caller.private_key, "signing_key":  config.antelope.caller.signing_key};
        this.oracle = oracle;
        this.api = api;
        this.services = config.scripts.updaters.delphi.services;
        this.quotes = [];
    }
    resetQuotes() {
        this.quotes = [];
    }
    addQuote(quote) {
        this.quotes.push(quote);
    }
    start(callbackSuccess, callbackError){
        if(this.services.length === 0){
            return;
        }
        let interval = setInterval(async () => {
            for(var i = 0; i < this.services.length; i++){
                var service = this.services[i];
                await fetch(service.url).then((response) => {
                    callbackSuccess(this, service.id, response);
                }).catch((e) => {
                    callbackError(service.id, e);
                });
            }
        }, this.update_interval_ms);
    }
    async send(){
        if(this.quotes.length === 0 || !this.caller.name){
            return;
        }
        try {
            return await this.api.transact({
                actions: [{
                    account: 'delphioracle',
                    name: 'write',
                    authorization: [{
                        actor: this.caller.name,
                        permission: this.caller.permission || 'active',
                    }],
                    data: {
                        owner: this.caller.name,
                        quotes: this.quotes
                    },
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 30,
            });
        } catch (e) {
           console.log(e.message);
           return false;
        }
    }
}

module.exports = DelphiOracleUpdater;