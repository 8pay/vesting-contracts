const web3 = require('web3');

const tokens = amount => web3.utils.toWei(amount, 'ether');

module.exports = {
  privateSale1: [
    {
      address: '0x701D79554766eAfd90E575A1eab6b78ff8868317',
      amount: tokens('8000000.00'),
    },
    {
      address: '0x1c4379601a7853f36a45EE53438b99216847f923',
      amount: tokens('500000.00'),
    },
    {
      address: '0x4ca1697f1CD790Eb998a74f4fd05F0689bfbD505',
      amount: tokens('800000.00'),
    },
    {
      address: '0x6f06eb15598dfba3c965df8fcb907ed0e45996bb',
      amount: tokens('200000.00'),
    },
    {
      address: '0xb14025f7eB7717cFF43e7a33b66d86eaBd6bC7d7',
      amount: tokens('150000.00'),
    },
    {
      address: '0x66616e4bED3F8fE7B2b9739DE22300D2dad0D851',
      amount: tokens('500000.00'),
    },
    {
      address: '0x3c04b094c9f430cffb7bae9c3dffee9b7b954260',
      amount: tokens('673333.20'),
    },
    {
      address: '0xd342AEBE6c7D1e6A1CcC4940f06307c2DB35DdaE',
      amount: tokens('400000.00'),
    },
    {
      address: '0x3EbD647A174394E866583658138DcE0040b95fe4',
      amount: tokens('1000000.00'),
    },
    {
      address: '0x078cfD085962f8dB8B3eaD10Ce9009f366CF51d8',
      amount: tokens('460000.00'),
    },
    {
      address: '0xdb01F2e7d8F0d84771c187C85569363EDb704668',
      amount: tokens('400000.00'),
    },
    {
      address: '0x0C837db502a8636bEF3D1F4Fd5bC8E4529f77747',
      amount: tokens('250000.00'),
    },
  ],
  privateSale2: [
    {
      address: '0x701D79554766eAfd90E575A1eab6b78ff8868317',
      amount: tokens('10000000.00'),
    },
    {
      address: '0x1c4379601a7853f36a45EE53438b99216847f923',
      amount: tokens('416666.67'),
    },
    {
      address: '0x4ca1697f1CD790Eb998a74f4fd05F0689bfbD505',
      amount: tokens('666666.67'),
    },
    {
      address: '0x6f06eb15598dfba3c965df8fcb907ed0e45996bb',
      amount: tokens('166666.67'),
    },
    {
      address: '0xb14025f7eB7717cFF43e7a33b66d86eaBd6bC7d7',
      amount: tokens('125000.00'),
    },
    {
      address: '0x788ae5004eaE3998857087f7E5EDa72566F21648',
      amount: tokens('150000.00'),
    },
    {
      address: '0x7CC5D9c87579fc7EFaD32BfefeaCef9E5A6878C0',
      amount: tokens('333333.33'),
    },
    {
      address: '0xdec10d38f6a5cca2a16ce5714e372d14adf67742',
      amount: tokens('150000.00'),
    },
    {
      address: '0x66616e4bED3F8fE7B2b9739DE22300D2dad0D851',
      amount: tokens('416666.67'),
    },
    {
      address: '0xd342AEBE6c7D1e6A1CcC4940f06307c2DB35DdaE',
      amount: tokens('166666.67'),
    },
    {
      address: '0x3EbD647A174394E866583658138DcE0040b95fe4',
      amount: tokens('250000.00'),
    },
    {
      address: '0x078cfD085962f8dB8B3eaD10Ce9009f366CF51d8',
      amount: tokens('116666.67'),
    },
    {
      address: '0xdb01F2e7d8F0d84771c187C85569363EDb704668',
      amount: tokens('83333.33'),
    },
    {
      address: '0x0C837db502a8636bEF3D1F4Fd5bC8E4529f77747',
      amount: tokens('125000.00'),
    },
  ],
  seed: [
    {
      address: '0x9e70086f32a0a45470486a56efdcb8173746cf92',
      amount: tokens('8888888.8'),
    },
  ],
  founders: [
    {
      address: '0x52be9a7d24Ef3bf175E9888089ec64031803B639',
      amount: tokens('15111110.96'),
    },
  ],
  advisors: [
    {
      address: '0x95c22F7B7B66865fBcf0FD03f557e742dddE5B7F',
      amount: tokens('6222222.16'),
    },
  ],
  marketing: [
    {
      address: '0xe4EF192Ab928991E4B61F14827B7cBC55Cd0CBb4',
      amount: tokens('4444444.4'),
    },
  ],
  staking: [
    {
      address: '0xd00E4f42432990d67823Be2e2E1F1CCFEaD58366',
      amount: tokens('7111111.04'),
    },
  ],
  strategicReserve: [
    {
      address: '0x5c8b37767f4D1359fb9785611F0FF8a79D5FfB8E',
      amount: tokens('7111111.04'),
    },
  ],
};
