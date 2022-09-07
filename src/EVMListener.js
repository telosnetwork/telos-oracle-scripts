const Listener = require("./Listener");

class EVMListener extends Listener {

    constructor(
        caller,
        rpc,
        api,
        bridge,
        evm_provider,
        evm_api
    ) {
        super(caller, rpc, api, bridge);
        this.evm_api = evm_api;
        this.evm_provider = evm_provider;
    }
}

module.exports = EVMListener;
