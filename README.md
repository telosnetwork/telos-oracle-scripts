# Telos Oracle Scripts

This repository contains various scripts for BPs and other Telos actors to help run the Telos Oracles and their respective bridges.

You can find our oracle repositories here: [Delphi Oracle](https://github.com/telosnetwork/delphioracle), [RNG Oracle](https://github.com/telosnetwork/telos-oracle-rng)

And their bridge repositories here: [RNG Oracle Bridge](https://github.com/telosnetwork/rng-oracle-bridge), [Delphi Oracle Bridge](https://github.com/telosnetwork/delphi-oracle-bridge), [Gas Bridge](https://github.com/telosnetwork/gas-oracle-bridge)

## Requirement

This repository requires NodeJS 14+, NPM and PM2

## Install

```
git clone https://github.com/telosnetwork/oracle-listeners
cd oracle-listeners
npm install
sudo npm install pm2 -g
```

## Configure

The values configured in the sample are for testnet, change to mainnet where appropriate

```
cp config.yml.sample config.yml
vi config.yml 
```

### > Antelope

### > EVM

### > Listeners

####   Delphi Bridge Listener

####   RNG Bridge Listener

####   RNG Oracle Request Listener

####   Gas Bridge Listener

### > Updaters

####   Delphi Updater

This updater supports 2 methods: `http` and `file`. Follow the steps below to configure them

##### http

```
cp config.yml.sample config.yml
vi config.yml 
```

##### file
```
cp config.yml.sample config.yml
vi config.yml 
```

## Run

```
pm2 start index.js --name oracle-listeners
```
