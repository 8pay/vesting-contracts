/* eslint-disable camelcase */

const fs = require('fs');
const HDWalletProvider = require('@truffle/hdwallet-provider');

const mnemonic = fs.readFileSync('.secret').toString().trim();

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
    },
    testnet: {
      provider: () => new HDWalletProvider(mnemonic, 'wss://data-seed-prebsc-2-s3.binance.org:8545'),
      network_id: 97,
      confirmations: 5,
      networkCheckTimeout: 1000000,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
    bsc: {
      provider: () => new HDWalletProvider(mnemonic, 'wss://bsc-dataseed1.binance.org'),
      network_id: 56,
      confirmations: 10,
      networkCheckTimeout: 1000000,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
  },
  plugins: ['solidity-coverage'],
  compilers: {
    solc: {
      version: '0.8.3',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};
