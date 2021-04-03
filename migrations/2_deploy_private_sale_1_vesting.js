const PrivateSale1Vesting = artifacts.require('PrivateSale1Vesting');
const tokenContract = require('../data/token-contract');
const allocations = require('../data/allocations').privateSale1;
const owner = require('../data/owner');

module.exports = async function (deployer, network) {
  const start = 1617638400;

  await deployer.deploy(PrivateSale1Vesting, tokenContract[network].address, start);

  const privateSale1Vesting = await PrivateSale1Vesting.deployed();

  await privateSale1Vesting.allocateTokens(allocations.map(e => e.address), allocations.map(e => e.amount));
  await privateSale1Vesting.transferOwnership(owner[network].address);
};
