
class DelphiOracleCallbacks {
   async onRequestSuccess(updater, id, response){
        console.log('Request to', id, 'succeeded, sending quote...');
        const data = await response.json();
        switch (id) {
            case ('coingecko'):
                updater.addQuote({"pair": "tlosusd", "value": parseInt(Math.round(data.telos.usd * 10000))});
                updater.addQuote({"pair": "tloseos", "value":  parseInt(Math.round(data.telos.eos * 10000))});
        }
       const result = await updater.send();
    }
    onRequestFailure(id, error){
        console.log('Request to', id, 'failed :', error.message);
    }
}
module.exports = DelphiOracleCallbacks;