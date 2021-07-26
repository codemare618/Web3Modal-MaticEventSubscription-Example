const Config = {
  options: {
    walletconnect: {
      infuraId: "5f9fddeec0e24834903952964417b602"
      /*
      rpc: {
        1: "https://cloudflare-eth.com"
      }*/
    }
  },
  maticProvider: {
    http: 'https://rpc-mumbai.maticvigil.com/v1/a4239c6b78a420cf81bd3c23e9ddc5f682be6970',
    wss: 'wss://rpc-mumbai.maticvigil.com/ws/v1/a4239c6b78a420cf81bd3c23e9ddc5f682be6970',

    // When testing contract is hosted on rinkeby, so provide that here.
    /*
    http: 'https://eth-rinkeby.alchemyapi.io/v2/gya-fwTOC4ajKW76Uj7otzzwgeIQFtNP',
    wss: 'wss://eth-rinkeby.alchemyapi.io/v2/gya-fwTOC4ajKW76Uj7otzzwgeIQFtNP',
     */
  },

  // These options are for matic.
  contractAddress: '0x7Acfeac1114283C1a0b5765c626Fc46a8ED91FAD',  // This is not rinkeby address and should be replaced with matic contract address
  ethRecipient: '0xFda97A173ae15750bEd99991CCf63c6221390Ca5',    // The MATIC contract owner (The recipient who receives ether)
  tokenABI,
  apiEndPoint: 'http://us-central1-gems-802cb.cloudfunctions.net/',
}
