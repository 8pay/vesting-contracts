const PublicSaleVesting = artifacts.require('PublicSaleVesting');
const tokenContract = require('../data/token-contract');
const grants = require('../data/grants').publicSale;
const owner = require('../data/owner');

module.exports = async function (deployer, network) {
  const start = Math.floor(Date.now() / 1000);

  await deployer.deploy(PublicSaleVesting, tokenContract[network].address, start);

  const publicSaleVesting = await PublicSaleVesting.deployed();

  await publicSaleVesting.allocateTokens(grants.map(e => e.address), grants.map(e => e.amount));
  await publicSaleVesting.transferOwnership(owner[network].address);
};
