const PrivateSale1Vesting = artifacts.require('PrivateSale1Vesting');
const tokenContract = require('../data/token-contract');
const tge = require('../data/tge');
const allocations = require('../data/allocations').privateSale1;

module.exports = async function (deployer, network) {
  const start = tge.timestamp;
  const beneficiaries = allocations.map(e => e.address);
  const amounts = allocations.map(e => e.amount);

  await deployer.deploy(PrivateSale1Vesting, tokenContract[network].address, start, beneficiaries, amounts);
};
