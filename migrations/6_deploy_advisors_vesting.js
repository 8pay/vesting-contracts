const AdvisorsVesting = artifacts.require('AdvisorsVesting');
const { time } = require('@openzeppelin/test-helpers');
const tokenContract = require('../data/token-contract');
const tge = require('../data/tge');
const allocations = require('../data/allocations').advisors;

module.exports = async function (deployer, network) {
  const start = tge.timestamp + time.duration.days(120).toNumber();
  const beneficiaries = allocations.map(e => e.address);
  const amounts = allocations.map(e => e.amount);

  await deployer.deploy(AdvisorsVesting, tokenContract[network].address, start, beneficiaries, amounts);
};
