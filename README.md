# Mint Front End


### Pre-requirement

- Deploy mintTokens Google Cloud Function first.


### Change config

- Replace `token.js` with compiled token json file's abi

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

  contractAddress: '0x677FA9002fF9F0F833F4bC5a4F6D1a9695a9FC89',
  tokenABI,
  apiEndPoint: 'http://us-central1-gems-802cb.cloudfunctions.net/',
}
```
