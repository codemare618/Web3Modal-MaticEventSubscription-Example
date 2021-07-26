# Mint Front End


### Pre-requirement

- Deploy mintTokens Google Cloud Function first.


### Change config

- Replace `token.js` with compiled token json file  

- Open `config.js` file and update values

```javascript
const Config = {
  options: {
    walletconnect: {
      infuraId: "5f9fddeec0e24834903952964417b602"

      // for main eth net
      /*
      rpc: {
        1: "https://cloudflare-eth.com"
      }*/
    }
  },
  
  // This is need to subscribe token mint event.
  maticProvider: {
    http: 'https://rpc-mumbai.maticvigil.com/v1/a4239c6b78a420cf81bd3c23e9ddc5f682be6970',
    wss: 'wss://rpc-mumbai.maticvigil.com/ws/v1/a4239c6b78a420cf81bd3c23e9ddc5f682be6970',

    // For the real matic net
    //http: 'https://rpc-mainnet.maticvigil.com/v1/a4239c6b78a420cf81bd3c23e9ddc5f682be6970',
    //wss: 'wss://rpc-mainnet.maticvigil.com/ws/v1/a4239c6b78a420cf81bd3c23e9ddc5f682be6970',
  },

  // These options are for matic.
  contractAddress: '0x7Acfeac1114283C1a0b5765c626Fc46a8ED91FAD',  // Change here: MATIC address
  ethRecipient: '0xFda97A173ae15750bEd99991CCf63c6221390Ca5',    // The MATIC contract owner (The recipient who receives ether)
  tokenABI,
  apiEndPoint: 'http://us-central1-gems-802cb.cloudfunctions.net/',
}
```
