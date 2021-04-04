const PrivateSale2Vesting = artifacts.require('PrivateSale2Vesting');
const tokenContract = require('../data/token-contract');
const allocations = require('../data/allocations').privateSale2;

module.exports = async function (deployer, network) {
  const start = 1617638400;
  const beneficiaries = allocations.map(e => e.address);
  const amounts = allocations.map(e => e.amount);

  await deployer.deploy(PrivateSale2Vesting, tokenContract[network].address, start, beneficiaries, amounts);
};
