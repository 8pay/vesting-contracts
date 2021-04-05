const FoundersVesting = artifacts.require('FoundersVesting');
const { time } = require('@openzeppelin/test-helpers');
const tokenContract = require('../data/token-contract');
const tge = require('../data/tge');
const allocations = require('../data/allocations').founders;

module.exports = async function (deployer, network) {
  const start = tge.timestamp + time.duration.days(180).toNumber();
  const beneficiaries = allocations.map(e => e.address);
  const amounts = allocations.map(e => e.amount);

  await deployer.deploy(FoundersVesting, tokenContract[network].address, start, beneficiaries, amounts);
};
