const Eos = require('eosjs');
const fetch = require('node-fetch');
const fs = require('fs');

class DelphiOracleUpdater {
    constructor(oracle, config){
        this.update_interval_ms = config.scripts.updaters.delphi.update_interval_ms;
        this.caller = {"name": config.antelope.oracle.name, "permission": config.antelope.oracle.permission, "private_key":  config.antelope.oracle.private_key, "signing_key":  config.antelope.oracle.signing_key};
        this.oracle = oracle;
        this.services = config.scripts.updaters.delphi.services;
        this.quotes = [];
    }
    resetQuotes() {
        this.quotes = [];
    }
    addQuote(quote) {
        this.quotes.push(quote);
    }
    start(callbackSucess, callbackError){
        if(this.services.length === 0){
            return;
        }
        let interval = setInterval(() => {
            for(var i = 0; i < this.services.length; i++){
                fetch(this.services[i].url).then((response) => {
                    callbackSuccess(this, this.services[i].id, response);
                }).catch((e) => {
                    callbackError(e);
                });
            }
        }, this.update_interval_ms);
    }
    send(callbackSucess, callbackError){
        if(this.quotes.length === 0 || !this.caller.name){
            return;
        }
        eos.contract(this.oracle).then((contract) => {
            contract.write({
                owner: this.caller.name,
                quotes: this.quotes
            },
            {
                scope: this.oracle,
                authorization: [`${this.caller.name}@${this.caller.permission || 'active'}`]
            })
            .then(results=>{
                this.quotes = [];
                callbackSucess(results);
            })
            .catch(error=>{
                callbackError(error);
            });
        }).catch(error=>{
            callbackError(error);
        });
    }
}

module.exports = DelphiOracleUpdater;