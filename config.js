const Config = {
  options: {
    walletconnect: {
      infuraId: "5f9fddeec0e24834903952964417b602"

      // for main eth net
      /*
      rpc: {
        1: "https://cloudflare-eth.com"
      }*/
    },
    fortmatic: {
      key: 'pk_test_BE428915DABBCEA5'
    },

    walletlink: {
      chainId: 4,
      networkUrl: 'https://rinkeby.infura.io/v3/5f9fddeec0e24834903952964417b602',
      appName: 'ERC721 Mint Rinkeby',

      // For main eth net
      /*
      chainId: 1,
      networkUrl: 'https://cloudflare-eth.com',
      appName: 'ERC721 Mint',
      */
    }
  },

  contractAddress_A: '0x478655345FA6b6Dc4199D0399350d128e0eA9d8b',
  tokenABI_A,

  contractAddress_B: '0xaD501c2d8Eb101137e07AAe6F73985ec20208535',
  tokenABI_B,

  contractAddress_Router: '0x34Fb9Bf441A936F2cC6CDC2F42433F253ECfB632',
  tokenABI_Router,

  apiEndPoint: 'http://us-central1-gems-802cb.cloudfunctions.net/',
}
