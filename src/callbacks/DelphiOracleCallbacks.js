
class DelphiOracleCallbacks {
    onRequestSucess(updater, id, response){
        const data = JSON.parse(response);
        console.log('Request to', id, 'succeeded, sending quote...');
        switch (id) {
            case ('coingecko-tlosusd'):
                updater.addQuote({"pair": "tlosusd", "value": data.USD, "median": data.USD});
            case ('coingecko-tloseos'):
                updater.addQuote({"pair": "tloseos", "value": data.EOS, "median": data.EOS});
        }
        updater.send(this.onSendSucess, this.onSendFailure);
    }
    onRequestFailure(id, error){
        console.log('Request to', id, 'failed :', error.message);
    }

    onSendSucess(response){
        console.log("Sent quote");
    }

    onSendFailure(error){
        console.log("Sending quote faile:", error);
    }
}
module.exports = DelphiOracleCallbacks;