class Listener {
    constructor(
        bridgeContract,
        oracleName,
        oraclePermission,
        oracleKey,
        rpc,
        api,
    ) {
        this.bridgeContract = bridgeContract;
        this.oracleName = oracleName;
        this.oraclePermission = oraclePermission;
        this.rpc = rpc;
        this.api = api;
        this.oracleKey = oracleKey;
        this.counter = 0;
    }
}

module.exports = Listener;
