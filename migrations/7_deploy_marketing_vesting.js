const MarketingVesting = artifacts.require('MarketingVesting');
const { time } = require('@openzeppelin/test-helpers');
const tokenContract = require('../data/token-contract');
const tge = require('../data/tge');
const allocations = require('../data/allocations').marketing;

module.exports = async function (deployer, network) {
  const start = tge.timestamp + time.duration.days(60).toNumber();
  const beneficiaries = allocations.map(e => e.address);
  const amounts = allocations.map(e => e.amount);

  await deployer.deploy(MarketingVesting, tokenContract[network].address, start, beneficiaries, amounts);
};
