const PrivateSale2Vesting = artifacts.require('PrivateSale2Vesting');
const tokenContract = require('../data/token-contract');
const allocations = require('../data/allocations').privateSale2;
const owner = require('../data/owner');

module.exports = async function (deployer, network) {
  const start = Math.floor(Date.now() / 1000);

  await deployer.deploy(PrivateSale2Vesting, tokenContract[network].address, start);

  const privateSale2Vesting = await PrivateSale2Vesting.deployed();

  await privateSale2Vesting.allocateTokens(allocations.map(e => e.address), allocations.map(e => e.amount));
  await privateSale2Vesting.transferOwnership(owner[network].address);
};
