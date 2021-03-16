const FoundersVesting = artifacts.require('FoundersVesting');
const tokenContract = require('../data/token-contract');
const grants = require('../data/grants').founders;
const owner = require('../data/owner');

module.exports = async function (deployer, network) {
  const start = Math.floor(Date.now() / 1000);

  await deployer.deploy(FoundersVesting, tokenContract[network].address, start);

  const foundersVesting = await FoundersVesting.deployed();

  await foundersVesting.grantTokens(grants.map(e => e.address), grants.map(e => e.amount));
  await foundersVesting.transferOwnership(owner[network].address);
};
