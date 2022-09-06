# Telos Oracles Listeners

## Requirement

This repository requires NodeJS 14+, NPM and PM2

## Setup instructions

This is for testnet, change to mainnet where appropriate

```
git clone https://github.com/telosnetwork/oracle-listeners
cd oracle-listeners
npm install
sudo npm install pm2 -g
cp .env.example .env
vi .env 
#change values as needed
pm2 start index.js --name oracle-listeners
```
