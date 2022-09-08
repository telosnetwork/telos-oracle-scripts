class Listener {
    constructor(
        caller,
        rpc,
        api,
        bridge,
        hyperion,
        config
    ) {
        this.bridge = bridge;
        this.hyperion = hyperion;
        this.caller = caller;
        this.check_interval_ms = config.check_interval_ms;
        this.max_block_diff = config.max_block_diff;
        this.rpc = rpc;
        this.console_log = (config.console_log) ? true : false;
        this.api = api;
        this.counter = 0;
    }

    log(message){
        if(this.console_log) console.log(message);
    }
}

module.exports = Listener;
