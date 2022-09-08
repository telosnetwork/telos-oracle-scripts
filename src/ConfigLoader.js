const yaml = require('js-yaml');
const fs   = require('fs');

class ConfigLoader {
    constructor(){
        this.errors = [];
    }
    load(){
        try {
            let config = yaml.load(fs.readFileSync(__dirname + '/../config.yml', 'utf8'))
            if(this.check(config)){
                return config;
            }
        } catch (e) {
            console.log(e);
            return false;
        }
    }
    check(config){
        if(!config.antelope){
            this.errors.push('Missing antelope configuration');
        }
        if(!config.evm){
            this.errors.push('Missing EVM configuration');
        }
        if(!config.scripts || !config.scripts.listeners || !config.scripts.updaters){
            this.errors.push('Missing scripts configuration');
        }
        if(this.errors.length > 0){
            console.log(this.errors);
            return false;
        }
        return true;
    }
}

module.exports = ConfigLoader;