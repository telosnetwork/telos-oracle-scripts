class Listener {
    constructor(
        caller,
        rpc,
        api,
        bridge
    ) {
        this.bridge = bridge;
        this.caller = caller;
        this.rpc = rpc;
        this.console_log = (parseInt(process.env.CONSOLE_LOG) === 1);
        this.api = api;
        this.counter = 0;
    }

    log(message){
        if(this.console_log) console.log(message);
    }
}

module.exports = Listener;
