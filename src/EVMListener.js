const Listener = require("./Listener");

class EVMListener extends Listener {

    constructor(
        oracle,
        rpc,
        api,
        bridge,
        evm_provider,
        evm_api
    ) {
        super(oracle, rpc, api, bridge);
        this.evm_api = evm_api;
        this.evm_provider = evm_provider;
    }
}

module.exports = EVMListener;
