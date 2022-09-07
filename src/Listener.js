class Listener {
    constructor(
        oracle,
        rpc,
        api,
        bridge
    ) {
        this.bridge = bridge;
        this.oracle = oracle;
        this.rpc = rpc;
        this.api = api;
        this.counter = 0;
    }
}

module.exports = Listener;
