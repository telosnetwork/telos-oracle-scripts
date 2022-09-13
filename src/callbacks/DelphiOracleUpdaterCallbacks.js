
class DelphiOracleCallbacks {
        onRequestSucess(updater, id, response){
            const data = JSON.parse(response);
            updater.addQuote({"pair": "tlosusd"});
            updater.send(this.onSendSucess, this.onSendFailure);
            console.log('Hello');
        }
    onRequestFailure(updater, id, error){
        console.log('Hello');

    }

    onSendSucess(updater, id, response){

    }

    onSendFailure(updater, id, error){

    }
}