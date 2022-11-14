const yaml = require('js-yaml');
const fs   = require('fs');

class ConfigLoader {
    constructor(){
        this.errors = [];
        this.listeners = [
            {
                name: 'caller',
                children: [
                    { name: 'name' },
                    { name: 'permission' },
                    { name: 'private_key' },
                    { name: 'signing_key' }
                ]
            },
            {
                name: 'delphi',
                children: [
                    {
                        name: 'account'
                    },
                    {
                        name: 'bridge',
                        children: ["eosio_evm_scope", "account", "evm_contract"]
                    }
                ]
            },
            {
                name: 'rng',
                children: [
                    {name: 'account'},
                    {name: 'bridge', children: ["eosio_evm_scope", "account", "linked_evm_address", "evm_contract"]},
                    {name: 'request', children: []}
                ]
            },
            {
                name: 'gas',
                children: [
                    {name: 'account' },
                    {name: 'bridge', children: ["account", "evm_contract"] }
                ]
            }
        ];
        this.updaters = [
            {
                name: 'caller',
                children: [
                    { name: 'name' },
                    { name: 'permission' },
                    {  name: 'private_key' }
                ]
            },
            {
                name: 'delphi',
                children: [
                    {name: 'services'},
                    {name: 'account'},
                    {name: 'update_interval_ms'}
                ]
            }
        ];
    }
    load(){
        try {
            let config = yaml.load(fs.readFileSync(__dirname + '/../config.yml', 'utf8'))
            if(this.check(config)){
                return config;
            }
        } catch (e) {
            this.errors.push('Could not load config: ' + e.message);
            this.print();
        }
        return false;
    }
    print(){
        console.log("-------------------------------------------------");
        console.log("\nErrors encountered when loading configuration:\n");
        for(var i = 0; i < this.errors.length; i++){
            console.log("o " + this.errors[i]);
        }
        console.log("\nPlease refer to the config.yml.sample for proper configuration\n");
        console.log("-------------------------------------------------");
    }
    check(config){
        if(!config.antelope){
            this.errors.push('Missing antelope configuration.');
        }
        if(!config.evm){
            this.errors.push('Missing EVM configuration.');
        }
        if(!config.scripts || !config.scripts.listeners || !config.scripts.updaters){
            this.errors.push('Missing scripts configuration.');
        } else {
            for(var i = 0; i < this.listeners.length; i++){
                if(!config.scripts.listeners[this.listeners[i].name]){
                    this.errors.push('Missing '+ this.listeners[i].name +' listener configuration.');
                } else if(this.listeners[i].children) {
                    for(var k = 0; k < this.listeners[i].children.length; k++) {
                        var config_element = config.scripts.listeners[this.listeners[i].name][this.listeners[i].children[k].name];
                        var element = this.listeners[i].children[k];
                        if (!config_element)
                        {
                            this.errors.push('Missing '+ element.name +' in '+ this.listeners[i].name +' listener configuration.');
                        } else if(element.children) {
                            for(var c = 0; c < element.children.length; c++) {
                                if (!config_element[element.children[c]])
                                {
                                    this.errors.push('Missing '+ element.children[c] +' in '+ this.listeners[i].name +' > '+ element.name +' listener configuration.');
                                }
                            }
                        }
                    }
                }
            }
            for(var i = 0; i < this.updaters.length; i++){
                if(!config.scripts.updaters[this.updaters[i].name]){
                    this.errors.push('Missing '+ this.updaters[i].name +' updater configuration.');
                } else
                {
                    for(var k = 0; k < this.updaters[i].children.length; k++) {
                        if (!config.scripts.updaters[this.updaters[i].name][this.updaters[i].children[k].name]){
                            this.errors.push('Missing '+ this.updaters[i].children[k].name +' in '+ this.updaters[i].name +' updater configuration.');
                        }
                    }
                }
            }
        }
        if(this.errors.length > 0){
            this.print();
            return false;
        }
        return true;
    }
}

module.exports = ConfigLoader;
