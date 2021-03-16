const MarketingVesting = artifacts.require('MarketingVesting');
const tokenContract = require('../data/token-contract');
const grants = require('../data/grants').marketing;
const owner = require('../data/owner');

module.exports = async function (deployer, network) {
  const start = Math.floor(Date.now() / 1000);

  await deployer.deploy(MarketingVesting, tokenContract[network].address, start);

  const marketingVesting = await MarketingVesting.deployed();

  await marketingVesting.grantTokens(grants.map(e => e.address), grants.map(e => e.amount));
  await marketingVesting.transferOwnership(owner[network].address);
};
