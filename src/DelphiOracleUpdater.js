const Eos = require('eosjs');
const dotenv = require('dotenv');
const request = require('request');
const fs = require('fs');

const tlosUrl = "https://min-api.cryptocompare.com/data/price?fsym=TLOS&tsyms=USD";
const eosUrl = "https://min-api.cryptocompare.com/data/price?fsym=EOS&tsyms=BTC,USD";
const btcUrl = "https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD,CAD";
const btccnyUrl = "https://blockchain.info/ticker";

class DelphiOracleUpdater {
    __constructor(oracle, caller, interval, method, params){
        this.interval = interval;
        this.caller = caller;
        this.oracle = oracle;
        this.method = method;
        this.params = params;
    }
    readFile(){
        if(this.params.remove){
            fs.unlink(this.params.filepath, () => {});
        }
        this.update(quotes);
    }
    readURLs(){
        var quotes = [];
        for(var i = 0; i < this.params.services; i++){
            request.get(services[i].url, function (err, res, eosRes){
                if(services[i].response_format == "json"){
                    response = JSON.parse(eosRes);
                } else {
                    console.log("Response format not set")
                }
                if(services[i].response_multiple == false){
                    response = [response];
                }
                for(var i = 0; i < response.length;i++){
                    const value = response[i][services[i].property];
                    quotes.push({"value": parseInt(Math.round(value * 10000)), services[i].pair});
                }
            });
        });
        this.update(quotes);
    }
    update(quotes){
        eos.contract(this.oracle).then((contract) => {
            contract.write({
                owner: this.caller.name,
                quotes: quotes
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