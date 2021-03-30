const PrivateSale1Vesting = artifacts.require('PrivateSale1Vesting');
const tokenContract = require('../data/token-contract');
const grants = require('../data/grants').privateSale1;
const owner = require('../data/owner');

module.exports = async function (deployer, network) {
  const start = Math.floor(Date.now() / 1000);

  await deployer.deploy(PrivateSale1Vesting, tokenContract[network].address, start);

  const privateSale1Vesting = await PrivateSale1Vesting.deployed();

  await privateSale1Vesting.allocateTokens(grants.map(e => e.address), grants.map(e => e.amount));
  await privateSale1Vesting.transferOwnership(owner[network].address);
};
