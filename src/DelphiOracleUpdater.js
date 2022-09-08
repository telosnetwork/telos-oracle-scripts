const Eos = require('eosjs');
const fetch = require('node-fetch');
const fs = require('fs');

const tlosUrl = "https://min-api.cryptocompare.com/data/price?fsym=TLOS&tsyms=USD";
const eosUrl = "https://min-api.cryptocompare.com/data/price?fsym=EOS&tsyms=BTC,USD";
const btcUrl = "https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD,CAD";
const btccnyUrl = "https://blockchain.info/ticker";

class DelphiOracleUpdater {
    constructor(oracle, caller, interval, methods){
        this.interval = interval;
        this.caller = caller;
        this.oracle = oracle;
        this.methods = methods;
        this.quotes = [];
    }
    start(){
        this.quotes = [];
        for(var i = 0; i < this.methods.http.length; i++){
            getURL(this.methods.http[i])
        }
        this.update(quotes);
    }
    readFile(){
        if(this.params.remove){
            fs.unlink(this.params.filepath, () => {});
        }
    }
    getURL(services){
        for(var i = 0; i < services.length; i++){
            fetch(services[i].url).then((response) => {
                if(services[i].response.format == "json"){
                    let data = JSON.parse(response);
                } else {
                    console.log("Response format not set")
                }
                if(services[i].response.multiple == false){
                    data = [data];
                }
                for(var i = 0; i < data.length;i++){
                    const value = data[i][services[i].response.property];
                    this.quotes.push({"value": parseInt(Math.round(value * 10000)), "pair": services[i].pair});
                }
            });
        }
    }
    update(){
        if(this.quotes.length === 0){
            return false;
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
                console.log("results:", results);
            })
            .catch(error=>{
                console.log("error:", error);
            });
        }).catch(error=>{
           console.log("error:", error);
        });
    }
}

module.exports = DelphiOracleUpdater;