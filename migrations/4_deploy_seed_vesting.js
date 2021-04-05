const SeedVesting = artifacts.require('SeedVesting');
const tokenContract = require('../data/token-contract');
const tge = require('../data/tge');
const allocations = require('../data/allocations').seed;

module.exports = async function (deployer, network) {
  const start = tge.timestamp;
  const beneficiaries = allocations.map(e => e.address);
  const amounts = allocations.map(e => e.amount);

  await deployer.deploy(SeedVesting, tokenContract[network].address, start, beneficiaries, amounts);
};
