class Listener {
    constructor(
        oracle,
        rpc,
        api,
        config,
        bridge
    ) {
        this.caller = {"name": config.antelope.oracle.name, "permission": config.antelope.oracle.permission, "private_key":  config.antelope.oracle.private_key, "signing_key":  config.antelope.oracle.signing_key};
        this.oracle = oracle;
        this.bridge = bridge;
        this.check_interval_ms = config.scripts.listeners.table_check_interval_ms;
        this.max_block_diff = config.scripts.listeners.max_block_diff;
        this.hyperion = config.antelope.hyperion;
        this.rpc = rpc;
        this.console_log = (config.scripts.listeners.console_log) ? true : false;
        this.api = api;
        this.counter = 0;
    }

    log(message){
        if(this.console_log) console.log(message);
    }
}

module.exports = Listener;
