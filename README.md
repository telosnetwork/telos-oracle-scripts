# Telos Oracle Scripts

This repository contains various scripts for BPs and other Telos actors to help run the Telos Oracles and their respective bridges trustlessly.

You can find our oracle repositories here: [Delphi Oracle](https://github.com/telosnetwork/delphioracle), [RNG Oracle](https://github.com/telosnetwork/telos-oracle-rng)

And their bridge repositories here: [RNG Oracle Bridge](https://github.com/telosnetwork/rng-oracle-bridge), [Delphi Oracle Bridge](https://github.com/telosnetwork/delphi-oracle-bridge), [Gas Bridge](https://github.com/telosnetwork/gas-oracle-bridge)

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

### > Antelope

#### Oracle

This part of the configuration pertains to your own creditenials, it is required for listeners & updaters that need to perform actions on chain like the `RNGRequestListener`.

```
    name: "oracletest" # Your antelope account name
    permission: "active" 
    private_key: "5J2..."
    signing_key: "5J2..."
```

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

####   Delphi Bridge Listener

This listeners listens to requests made to the DelphiOracleBridge contract on EVM and calls `reqnotify()` of the `delphibridge` antelope contract.

####   RNG Bridge Listener

This listeners listens to requests made to the RNGOracleBridge contract on EVM and calls `reqnotify()` of the `rngorcbrdg` antelope contract.

####   RNG Oracle Request Listener

This listeners listens to requests made to the RNG Oracle and signs them if needed.

####   Gas Bridge Listener

This listeners compares the gas price from eosio.evm to the one stored in the EVM GasOracleBridge contract. If it is different it calls the `gasbridge` antelope contract's `verify()` action that also compares the prices & updates the price of the GasOracleBridge on EVM if needed.

### > Updaters

####   Delphi Updater

This updater has methods to help retreive pair prices and send them to the Delphi Oracle. You need to implement your own callbacks to parse the received data and use the updater to send them to the oracle, follow the steps below to do so:


## Run

```
pm2 start index.js --name oracle-listeners
```
