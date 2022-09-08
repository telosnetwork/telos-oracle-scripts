const yaml = require('js-yaml');
const fs   = require('fs');

class ConfigLoader {
    constructor(){
        this.errors = [];
        this.listeners = [{ name: 'delphi', required: []}, { name: 'rng', required: []}, { name: 'gas', required: []}];
        this.updaters = [ { name: 'delphi', required: []}];
    }
    load(){
        try {
            let config = yaml.load(fs.readFileSync(__dirname + '/../config.yml', 'utf8'))
            if(this.check(config)){
                return config;
            }
        } catch (e) {
            this.errors.push('Could not load config: ' + e.message);
            return false;
        }
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
                }
            }
            for(var i = 0; i < this.updaters.length; i++){
                if(!config.scripts.updaters[this.updaters[i].name]){
                    this.errors.push('Missing '+ this.updaters[i].name +' updater configuration.');
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