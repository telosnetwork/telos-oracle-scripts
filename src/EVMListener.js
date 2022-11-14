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
        hyperion
    ) {
        super(oracle, rpc, api, config, bridge, hyperion);
        this.evm_api = evm_api;
        this.evm_provider = evm_provider;
    }
}

module.exports = EVMListener;
