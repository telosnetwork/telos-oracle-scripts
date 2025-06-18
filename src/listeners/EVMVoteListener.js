const EVMListener = require("../EVMListener");
const { BigNumber, ethers, utils } = require("ethers");
const Listener = require("../Listener");
const eosjs = require("eosjs");
const {JsSignatureProvider} = require("eosjs/dist/eosjs-jssig");
const util = require("util");
const MANAGER_ABI = [
    "function activeBpCount() view returns (uint256)",
    "function activeBpsArray(uint256) view returns (uint64)",
    "function activeBpsMapping(uint64) view returns (bool)",
    "function getBPs(uint256 start, uint256 count) external view returns (uint64[] memory)"
];
const ACCOUNT_STATE_TABLE = "accountstate";
const EOSIO_EVM = "eosio.evm";
const { Api } = eosjs;

class EVMVoteListener {
    constructor(
        rpc,
        evm_provider,
        config,
    ){
        this.config = config;
        this.rpc = rpc;
        this.evmProvider = evm_provider;
        this.voteManagerContract = config.vote_manager_contract;
        this.checkIntervalMs = config.check_interval_ms || 10000; // default to 10 seconds
        this.notifying = false;
        const signatureProvider = new JsSignatureProvider([config.caller.private_key]);
        this.api = new Api({
            rpc,
            signatureProvider,
            textDecoder: new util.TextDecoder(),
            textEncoder: new util.TextEncoder()
        });
    }

    async start() {
        // RPC TABLE CHECK
        await this.doCheck();
        setInterval(async () => {
            await this.doCheck();
        }, this.checkIntervalMs)
    }

    log(message) {
        if (this.config.console_log) {
            console.log(`[EVMVoteListener] ${message}`);
        }
    }

    async doCheck(){
        this.log("Doing EVM voting check...");
        try {
            const evmContract = new ethers.Contract(this.voteManagerContract, MANAGER_ABI, this.evmProvider);
            this.checkActiveBPs(evmContract);
            this.checkVotes(evmContract);
            return true;
        } catch (e) {
            this.log("Error doing EVM voting check: " + e.message);
            return false;
        }
    }

    async checkActiveBPs(evmContract) {
        this.log("Checking active BPs...");
        try {
            const activeBpCount = await evmContract.activeBpCount();
            const evmActiveBPs = await evmContract.getBPs(0, activeBpCount.toNumber());
            this.log("Active BPs: " + evmActiveBPs.join(", "));

            const activeProducers = await this.getActiveProducers();
            this.log("Active Producers: " + activeProducers.join(", "));

            for (const bp of evmActiveBPs) {
                if (!activeProducers.includes(bp.toString())) {
                    this.syncBP(bp);
                }
            }

            for (const bp of activeProducers) {
                const bpId = this.encodeName(bp.toString());
                if (!evmActiveBPs.includes(BigNumber.from(bp).toString())) {
                    this.log(`Producer ${bp} is not in EVM active BPs, syncing...`);
                    this.syncBP(BigNumber.from(bp).toString());
                }
            }

        } catch (e) {
            this.log("Error checking active BPs: " + e.message);
            return [];
        }
    }

    encodeName(name, littleEndian = true) {
        const charidx = '.12345abcdefghijklmnopqrstuvwxyz'
        if(typeof name !== 'string')
            throw new TypeError('name parameter is a required string')

        if(name.length > 12)
            throw new TypeError('A name can be up to 12 characters long')

        let bitstr = ''
        for(let i = 0; i <= 12; i++) { // process all 64 bits (even if name is short)
            const c = i < name.length ? charidx[name[i]] : 0
            const bitlen = i < 12 ? 5 : 4
            let bits = Number(c).toString(2)
            if(bits.length > bitlen) {
                throw new TypeError('Invalid name ' + name)
            }
            bits = '0'.repeat(bitlen - bits.length) + bits
            bitstr += bits
        }

        const value = Long.fromString(bitstr, true, 2)

        // convert to LITTLE_ENDIAN
        let leHex = ''
        const bytes = littleEndian ? value.toBytesLE() : value.toBytesBE()
        for(const b of bytes) {
            const n = Number(b).toString(16)
            leHex += (n.length === 1 ? '0' : '') + n
        }

        const ulName = Long.fromString(leHex, true, 16).toString()

        // console.log('encodeName', name, value.toString(), ulName.toString(), JSON.stringify(bitstr.split(/(.....)/).slice(1)))

        return ulName.toString()
    }

    async syncBP(bp) {
        this.log(`Syncing BP ${bp}...`);
        try {
            const result = this.api.transact({
                actions: [{
                    account: 'eosio',
                    name: 'setbpevmstat',
                    authorization: [{
                        actor: this.config.caller.name,
                        permission: this.config.caller.permission || 'active',
                    }],
                    data: {
                        'bp': bp
                    },
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 60,
            })
        } catch (e) {
            this.log("Error syncing BP: " + e.message);
        }
    }

    async getActiveProducers() {
        this.log("Getting active producers...");
        let more = true;
        let nextKey;
        let query = {
            code: "eosio",
            scope: "eosio",
            table: "producers",
            limit: 1000,
        }
        let producers = [];
        while (more) {
            try {
                if (nextKey) {
                    query.lower_bound = nextKey;
                }
                const results = await this.rpc.get_table_rows(query);
                this.log(`Retrieved ${results.rows.length} active producers`);
                more = results.more;
                nextKey = results.next_key;
                for (const row of results.rows) {
                    if (row.is_active) {
                        producers.push(row.owner);
                    }
                }
            } catch (error) {
                this.log("Error retrieving active producers: " + error.message);
                return [];
            }
        }
        return producers;
    }

    async checkVotes(evmContract) {
        this.log("Checking votes...");
        try {
            const activeBpCount = await evmContract.activeBpCount();
            this.log("Active BP Count: " + activeBpCount.toString());
            for (let i = 0; i < activeBpCount; i++) {
                const bpId = await evmContract.activeBpsArray(i);
                const isActive = await evmContract.activeBpsMapping(bpId);
                this.log(`BP ID: ${bpId}, Active: ${isActive}`);
            }
            return true;
        } catch (e) {
            this.log("Error checking votes: " + e.message);
            return false;
        }
    }

}

module.exports = EVMVoteListener;
