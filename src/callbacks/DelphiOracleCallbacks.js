
class DelphiOracleCallbacks {
    constructor(){
        // Bind callbacks so we can access this
        this.onRequestSuccess = this.onRequestSuccess.bind(this);
        this.onRequestFailure = this.onRequestFailure.bind(this);
    }

    // onRequestSuccess
    // Triggered on a succesfull request to the configured services
    // updater => our DelphiOracleUpdater with its send([]) method
    // id => the id of the service as defined in configuration
    // response => the response from the service URL, parsed according to response type defined in config
    async onRequestSuccess(updater, id, response) {
       // Example implementation, implement your own ...

       // Parse response for quotes
        let quotes = [];
        switch (id) {
            case ('coingecko'):
                if(!response.telos) break;
                quotes.push({"pair": "tlosusd", "value": this.formatValue(response.telos.usd)});
                quotes.push({"pair": "tloseos", "value":  this.formatValue(response.telos.eos)});
                if(!response.bitcoin) break;
                quotes.push({"pair": "btcusd", "value": this.formatValue(response.bitcoin.usd)});
                break;
        }

        // Send quotes
       const result = await updater.send(quotes);
       if(result === false){
           // Handle failure
        } else {
           // Success
       }
    }

    // onRequestFailure
    // Triggered on a failed request to the configured services
    // updater => our DelphiOracleUpdater with its send([]) method
    // id => the id of the service as defined in configuration
    // error => the error object
    onRequestFailure(updater, id, error){
        // Example implementation, implement your own ...
        updater.log('Delphi Oracle Updater: Request to', id, 'failed :', error.message); // Log using updater for log control via config
    }

    // Example utils...
    formatValue (value) {
        return parseInt(Math.round(value * 10000));
    }
}
module.exports = DelphiOracleCallbacks;