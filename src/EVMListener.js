const Listener = require("./Listener");

class EVMListener extends Listener {

    constructor(
        oracle,
        caller,
        rpc,
        api,
        bridge,
        hyperion,
        config,
        evm_provider,
        evm_api
    ) {
        super(oracle, caller, rpc, api, bridge, hyperion, config);
        this.evm_api = evm_api;
        this.evm_provider = evm_provider;
    }
}

module.exports = EVMListener;
