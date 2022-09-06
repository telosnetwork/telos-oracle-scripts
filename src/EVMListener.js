const Listener = require("./Listener");

class EVMListener extends Listener {

    constructor(
        contract_account,
        bridgeName,
        oracleName,
        oraclePermission,
        rpc,
        api,
        evm_contract_address,
        evm_provider,
        evm_api
    ) {
        super(contract_account, bridgeName, oracleName, oraclePermission, rpc, api, evm_provider, evm_api);
        this.evm_api = evm_api;
        this.evm_provider = evm_provider;
        this.evm_contract_address = evm_contract_address;
    }
}

module.exports = EVMListener;
