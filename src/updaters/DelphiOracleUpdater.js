const Updater = require('../Updater.js');
const Eos = require('eosjs');
const fetch = require('node-fetch');
const fs = require('fs');

class DelphiOracleUpdater extends Updater {
    constructor(oracle, config, updater_config, api){
        super(oracle, config, updater_config, api)
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
                await fetch(service.url).then(async (response) => {
                    let data;
                    if(service.response_type === "json"){
                        data = await response.json();
                    } else {
                        data = await response.text();
                    }
                    this.log('Request to '+ service.id + ' succeeded');
                    callbackSuccess(this, service.id, data);
                }).catch((e) => {
                    this.log('Request to ' + service.id + ' failed');
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
                expireSeconds: 60,
            });
        } catch (e) {
           this.log(e.message);
           return false;
        }
    }
}

module.exports = DelphiOracleUpdater;