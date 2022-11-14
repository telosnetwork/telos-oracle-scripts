const Listener = require("./Listener");

class EVMListener extends Listener {

    constructor(
        oracle,
        rpc,
        api,
        evm_provider,
        evm_api,
        config,
        bridge,
        hyperion,
        caller
    ) {
        super(oracle, rpc, api, config, hyperion, caller);
        this.evm_api = evm_api;
        this.bridge = bridge;
        this.evm_provider = evm_provider;
    }
}

module.exports = EVMListener;
