const AdvisorsVesting = artifacts.require('AdvisorsVesting');
const tokenContract = require('../data/token-contract');
const grants = require('../data/grants').advisors;
const owner = require('../data/owner');

module.exports = async function (deployer, network) {
  const start = Math.floor(Date.now() / 1000);

  await deployer.deploy(AdvisorsVesting, tokenContract[network].address, start);

  const advisorsVesting = await AdvisorsVesting.deployed();

  await advisorsVesting.grantTokens(grants.map(e => e.address), grants.map(e => e.amount));
  await advisorsVesting.transferOwnership(owner[network].address);
};
