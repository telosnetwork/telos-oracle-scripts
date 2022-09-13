
class DelphiOracleCallbacks {
   async onRequestSuccess(updater, id, response){
        switch (id) {
            case ('coingecko'):
                updater.addQuote({"pair": "tlosusd", "value": parseInt(Math.round(response.telos.usd * 10000))});
                updater.addQuote({"pair": "tloseos", "value":  parseInt(Math.round(response.telos.eos * 10000))});
                updater.addQuote({"pair": "tloseth", "value":  parseInt(Math.round(response.telos.eth * 10000))});
        }
       const result = await updater.send();
       if(result === false){
           // Handle failure
        } else {
           // Success
       }
    }
    onRequestFailure(updater, id, error){
        updater.log('Request to', id, 'failed :', error.message);
    }
}
module.exports = DelphiOracleCallbacks;