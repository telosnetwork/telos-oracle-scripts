# Telos Oracle Scripts

This repository contains various scripts for BPs and other Telos actors to help run the Telos Oracles and their respective bridges trustlessly.

You can find our oracle repositories here: [Delphi Oracle](https://github.com/telosnetwork/delphioracle), [RNG Oracle](https://github.com/telosnetwork/telos-oracle-rng)

And their respective bridge repositories here: [RNG Oracle Bridge](https://github.com/telosnetwork/rng-oracle-bridge), [Delphi Oracle Bridge](https://github.com/telosnetwork/delphi-oracle-bridge), [Gas Bridge](https://github.com/telosnetwork/gas-oracle-bridge)

## Overview

### > Listeners

####   Delphi Bridge Listener

This listeners listens to requests made to the DelphiOracleBridge contract on EVM and calls `reqnotify()` of the `delphibridge` antelope contract.

####   RNG Bridge Listener

This listeners listens to requests made to the RNGOracleBridge contract on EVM and calls `reqnotify()` of the `rngorcbrdg` antelope contract.

####   RNG Oracle Request Listener

This listeners listens to requests made to the RNG Oracle and signs them if needed.

####   Gas Bridge Listener

This listeners compares the gas price from `eosio.evm` to the one stored in the EVM `GasOracleBridge` contract. If it is different it calls the `gasbridge` antelope contract's `verify()` action that also compares the prices & updates the price of the `GasOracleBridge` contract on EVM if they are different.

### > Updaters

####   Delphi Updater

This updater has methods to help retreive pair prices and send them to the Delphi Oracle. You need to implement your own callbacks to parse the received data and use the updater to send them to the oracle, follow the steps in **[Customize the Delphi Updater](https://github.com/telosnetwork/telos-oracle-scripts#customize-the-delphi-updater)** below to do so.

## Requirement

This repository requires NodeJS 14+ and NPM

## Install

```
git clone https://github.com/telosnetwork/oracle-listeners
cd oracle-listeners
npm install
sudo npm install pm2 -g
```

## Configure

The values configured in the sample below are for testnet, change to `config.yml.sample.mainnet` if appropriate

```
cp config.yml.sample.testnet config.yml
vi config.yml 
```
You will find a description of each configuration item below.

### > Antelope

#### RPC / Hyperion

Endpoint configuration for Antelope.

```
  rpc: "https://testnet.telos.caleos.io"
  hyperion: "https://testnet.telos.caleos.io"
```

### > EVM

Endpoint configuration for EVM.

```
  api: "https://testnet.telos.net"
  rpc: "https://testnet.telos.net/evm"
  network: 41
```

### > Listeners

```
    console_log: true # print listeners errors in console or not
    max_block_diff: 1200 # Restart stream if it hasn't received data since X blocks... (1200 / 2 = 600s = 10mn)
    check_interval_ms: 30000 # Check table every X to make sure stream didn't miss anything
```

#### Delphi Oracle

```
      account: "delphioracle"
      caller:
        name: "oracletest" # Your antelope account name
        permission: "active" # Your antelope permission
        private_key: "5J2..." # Your antelope private key
        signing_key: "5J2..." # Your antelope signing key
      bridge:
        account: "delphibridge"
        active: true
        evm_contract: "0x0Af690bb090080fe7DC2E5864c6271402d534fDD"
        eosio_evm_scope: 36263 # Scope for eosio.evm accountstate table (index of EVM contract in eosio.evm account table)
        check_interval_ms: 30000 # This will override the general listeners one defined previously
```

#### RNG Oracle


```
      account: "rng.oracle"
      caller:
        name: "oracletest" # Your antelope account name
        permission: "active" # Your antelope permission
        private_key: "5J2..." # Your antelope private key
        signing_key: "5J2..." # Your antelope signing key
      request:
        active: true
        check_interval_ms: 30000 # This will override the general listeners one defined previously
      bridge:
        active: true
        account: "rng.bridge"
        linked_evm_address: "0x63c910d38a4717abe48f923d873314b9260e6dab"
        eosio_evm_scope: 36255 # Scope for eosio.evm accountstate table (index of EVM contract in eosio.evm account table)
        evm_contract: "0xcbB8a0e3Ec07A8baB91CCAA6E1F368AB919acd30"
        check_interval_ms: 30000 # This will override the general listeners one defined previously

```

#### Gas Oracle

```
      account: "eosio.evm"
      caller:
        name: "oracletest" # Your antelope account name
        permission: "active" # Your antelope permission
        private_key: "5J2..." # Your antelope private key
        signing_key: "5J2..." # Your antelope signing key
      bridge:
        active: true
        check_interval_ms: 3000 # This will override the general listeners one defined previously
        evm_contract: "0x648ac5a8c4E1ae5A93cd5BeDF143B095B8c49a2a"
        account: "gasbridge"
        
```

### > Updaters

```
    console_log: true
```

#### Delphi Oracle

```
      active: true
      update_interval_ms: 3000 
      account: "delphioracle"
      services:
        - id: 'coingecko'
          url: 'https://api.coingecko.com/api/v3/simple/price?ids=telos&vs_currencies=usd%2Ceos'
          response_type: "json"
```

You can add any number of services to query, like so:

```
      services:
        - id: 'coingecko'
          url: 'https://api.coingecko.com/api/v3/simple/price?ids=telos&vs_currencies=usd%2Ceos'
          response_type: "json"
        - id: 'myapi'
          url: 'https://myapi.com/price?ids=telos&v=usd'
          response_type: "json"
```

The `response_type` can be `json` or `text` (leaving it empty will make it `text`)

_After adding services you will need to customize the Delphi Updater to handle the response, see below_


## Customize the Delphi Updater

The Delphi Oracle Updater contains a minimal implementation to get TLOS's USD & EOS prices from coingecko. 
You can replace it and implement your own logic inside the [callbacks/DelphiUpdaterCallbacks.js](https://github.com/telosnetwork/telos-oracle-scripts/blob/master/src/callbacks/DelphiOracleCallbacks.js) file

### onRequestSuccess

The `onRequestSuccess(updater, id, response)` callback will be called after a sucessfull HTTP request to services defined in the configuration (see updaters > delphi > services above).
You should implement your own code here to parse the response and then use the `updater` object passed to the function to add quotes and send them to the Delphi Oracle easily. 

```
    onRequestSuccess(updater, id, response){
        // Your code here
    }
```

To send quotes use `updater.send([{'value': 'VALUE HERE', 'pair': 'PAIR HERE'}])`

You can add as many quotes as you want to that array.

Refer to the default logic inside [callbacks/DelphiUpdaterCallbacks.js](https://github.com/telosnetwork/telos-oracle-scripts/blob/master/src/callbacks/DelphiOracleCallbacks.js) for an example.

### onRequestFailure

The `onRequestFailure(error)` callback will be called after a failed HTTP request to services defined in the configuration (see updaters > delphi > services above).

```
    onRequestFailure(updater, id, response){
        // Your code here
    }
```

Refer to the default logic inside [callbacks/DelphiUpdaterCallbacks.js](https://github.com/telosnetwork/telos-oracle-scripts/blob/master/src/callbacks/DelphiOracleCallbacks.js) for an example.

## Run

```
pm2 start index.js --name telos-oracle-scripts
```
