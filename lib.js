'use strict';

const contractLib = (function () {
  let web3Modal;
  let provider;
  let selectedAccount;
  let handlersIndex = 0;
  const handlers = {};

  const WalletLink = require('walletlink');
  const Web3Modal = window.Web3Modal.default;
  const WalletConnectProvider = window.WalletConnectProvider.default;
  const Fortmatic = window.Fortmatic;


  async function initialize() {
    console.log('Initializing example');
    console.log('WalletConnectProvider is', WalletConnectProvider);
    console.log('window.web3 is', window.web3, 'window.ethereum is', window.ethereum);

    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: Config.options.walletconnect
      },
      fortmatic: {
        package: Fortmatic,
        options: Config.options.fortmatic
      },
      portis: {
        package: Portis,
        options: {
          id: 'eea77458-bf39-4dbd-a35c-0b5088212bab',
        }
      },
      /*
      'custom-walletlink': {
        display: {
          logo: 'https://github.com/walletlink/walletlink/blob/master/web/src/images/wallets/coinbase-wallet.svg',
          name: 'WalletLink',
          description: 'Scan with WalletLink to connect',
        },
        options: {
          appName: Config.options.walletlink.appName, // Your app name
          networkUrl: Config.options.walletlink.networkUrl,
          chainId: Config.options.walletlink.chainId,
        },
        package: WalletLink,
        connector: async (_, options) => {
          const { appName, networkUrl, chainId } = options
          const walletLink = new WalletLink({
            appName
          });
          const provider = walletLink.makeWeb3Provider(networkUrl, chainId);
          await provider.enable();
          return provider;
        },
      }
       */
    };

    web3Modal = new Web3Modal({
      cacheProvider: true,
      providerOptions
    });

    if (web3Modal.cachedProvider) {
      _connectInternal();
    }
    notifyStatusUpdates();
  }

  async function _connectInternal() {
    provider = await web3Modal.connect();

    provider.on('accountsChanged', (accounts) => {
      updateSelectedAccount().then();
    });

    provider.on('chainChanged', (chainId) => {
      // Refresh window when chain is changed
      window.location.reload();
    });

    provider.on('networkChanged', (networkId) => {
      // Refresh window when chain is changed
      window.location.reload();
    });
    updateSelectedAccount().then();
  }

  async function updateSelectedAccount() {
    const web3 = new Web3(provider);

    const accounts = await web3.eth.getAccounts();
    selectedAccount = accounts[0];

    notifyStatusUpdates();
  }

  async function connectToWallet() {
    if (provider) {
      console.log('Already Connected');
    }
    try {
      await _connectInternal();
    }catch(ex){
      console.log(ex);
    }
  }

  async function disconnectWallet() {
    if (!provider) {
      console.log('Not connected yet');
    }

    if (provider.close) {
      await provider.close();
    }

    try {
      // If the cached provider is not cleared,
      // WalletConnect will default to the existing session
      // and does not allow to re-scan the QR code with a new wallet.
      // Depending on your use case you may want or want not his behavir.
      await web3Modal.clearCachedProvider();
    } catch (ex) {

    }
    provider = null;

    selectedAccount = null;
    notifyStatusUpdates();
  }

  function notifyStatusUpdates() {
    for (const key in handlers) {
      console.log(key);
      if (handlers.hasOwnProperty(key)) {
        try {
          handlers[key]();
        } catch (ex) {
        }
      }
    }
  }

  window.addEventListener('load', async () => {
    await initialize();
  });

  function isConnected() {
    return provider && selectedAccount;
  }

  async function mintTokens(count, tokenIds) {
    if (!isConnected()) {
      throw new Error('Not Connected to wallet');
    }

    if (isNaN(count) || count < 1 || !Number.isInteger(count)) {
      throw new Error('Invalid mint count');
    }

    if (!Array.isArray(tokenIds)) {
      throw new Error('Invalid B token ids');
    }

    // Get the token price and send ether to contract owner
    const web3 = new Web3(provider);
    const contract = new web3.eth.Contract(Config.tokenABI_A, Config.contractAddress_A);

    const {maxMint, maxSupply, canMint, price, sessionId, signature} = await API.getMintParams(selectedAccount, tokenIds);

    Log.addLog(`Parameters response: price=${price}ETH, maxSupply=${maxSupply}, maxMint=${maxMint}, price=${price}, sessionId=${sessionId}, signature=${signature}`);

    if (!canMint) {
      throw new Error(`Can mint api returned false`);
    }

    if (count > maxMint) {
      throw new Error(`Mint count exceeds maximum mintable count ${maxMint}`);
    }

    // Calling smart contracts
    const ethAmount = price * count;
    // Send eth to contract owner
    const value = web3.utils.toWei(`${ethAmount}`, 'ether');
    const priceInWei = web3.utils.toWei(`${price}`, 'ether');
    Log.addLog(`Should send ${ethAmount} ETH to contract`);

    const gasPrice = await web3.eth.getGasPrice();

    // before calling, setApprove for the contractA to process the token.
    const contractB = new web3.eth.Contract(Config.tokenABI_B, Config.contractAddress_B);
    const routerContract = new web3.eth.Contract(Config.tokenABI_Router, Config.contractAddress_Router);


    const mintMethod = routerContract.methods.mintTokens(count, maxSupply, maxMint, priceInWei, canMint, sessionId, tokenIds, signature);
    //const mintMethod = contract.methods.mintTokens(count, maxSupply, maxMint, priceInWei, canMint, sessionId, tokenIds, signature);
    const verified = await contract.methods.verify('0xFda97A173ae15750bEd99991CCf63c6221390Ca5', selectedAccount, maxSupply, maxMint, priceInWei, canMint, sessionId, [], signature).call();
    console.log('verified---', verified);

    if (!await contractB.methods.isApprovedForAll(selectedAccount, Config.contractAddress_Router).call()) {
      const approveMethod = contractB.methods.setApprovalForAll(Config.contractAddress_Router, true);
      const gasEstimate = await approveMethod.estimateGas({
        from: selectedAccount,
        gasPrice
      });
      await approveMethod.send({
        from: selectedAccount,
        gasPrice,
        gas: gasEstimate
      }).on('transactionHash', function(hash) {
        Log.addLog(`Approve transaction hash : ${hash}`);
      })
        .on('receipt', async function(receipt){
          console.log(receipt);
          Log.addLog(`Approve Transaction completed : blockNumber: [${receipt.blockNumber}], gasUsed:[${receipt.gasUsed}], status: [${receipt.status}], txHash:[${receipt.transactionHash}]`);
          if (receipt.status === true) {
            await _mintTokensInternal(mintMethod, gasPrice, value);
          } else {
            Log.addLog(`Approve Transaction status is not success`);
          }
        })
        .on('error', function(err){
          console.log(err);
          Log.addLog(`Approve transaction Error : ${err}`);
        });

      // // Call method
      // mintMethod.send({
      //   from: selectedAccount,
      //   gasPrice,
      //   gas: gasEstimate,
      //   value,
      // })
    } else {
      await _mintTokensInternal(mintMethod, gasPrice, value);
    }
  }

  async function _mintTokensInternal(mintMethod, gasPrice, value){
    const gasEstimate = await mintMethod.estimateGas({
      from: selectedAccount,
      gasPrice,
      value
    });
    mintMethod.send({
      from: selectedAccount,
      gasPrice,
      gas: gasEstimate,
      value
    }).on('transactionHash', function(hash) {
      Log.addLog(`MintToken transaction hash : ${hash}`);
    })
      .on('receipt', function(receipt){
        console.log(receipt);
        Log.addLog(`Mint Transaction completed : blockNumber: [${receipt.blockNumber}], gasUsed:[${receipt.gasUsed}], status: [${receipt.status}], txHash:[${receipt.transactionHash}]`);

        if (receipt.status === true) {
          Log.addLog(`Mint transaction success txHash : ${receipt.transactionHash}`);
        } else {
          Log.addLog(`Transaction status is not success`);
        }
      })
      .on('error', function(err){
        console.log(err);
        Log.addLog(`Mint transaction Error : ${err}`);
      });
  }

  async function getOwnerOfToken(tokenId) {
    const web3 = new Web3(provider);
    const contract = new web3.eth.Contract(tokenABI_A, Config.contractAddress_A);
    return await contract.methods.ownerOf(tokenId).call();
  }

  async function getOwnerOfContract() {
    const web3 = new Web3(provider);
    const contract = new web3.eth.Contract(tokenABI_A, Config.contractAddress_A);
    return await contract.methods.owner().call();
  }

  function getSelectedAccount() {
    return selectedAccount;
  }

  async function withdrawAll(){
    if (!isConnected()) {
      throw new Error('Not Connected to wallet');
    }
    const ownerOfContract = await getOwnerOfContract();
    if (ownerOfContract !== selectedAccount) {
      throw new Error('You are not owner of the contract');
    }
    const web3 = new Web3(provider);
    const contract = new web3.eth.Contract(tokenABI_A, Config.contractAddress_A);
    contract.methods.withdrawAll().send({
      from: selectedAccount
    }).on('transactionHash', (hash) => {
      Log.addLog(`Withdrawal request submitted : Transaction Hash: ${hash}`);
    }).on('receipt', function(receipt) {
      console.log(receipt);
      Log.addLog(`Withdrawal transaction completed : blockNumber: [${receipt.blockNumber}], gasUsed:[${receipt.gasUsed}], status: [${receipt.status}], txHash:[${receipt.transactionHash}]`);
      if (receipt.status === true) {
        Log.addLog(`Mint transaction success txHash : ${receipt.transactionHash}`);
      } else {
        Log.addLog(`Transaction status is not success`);
      }
    }).on('error', (err) => {
      Log.addLog(`Withdrawal failed with error :${err}`)
    });
  }

  // Account status, ...
  function addChangeListener(handler) {
    const key = 'listener_' + handlersIndex;
    handlers[key] = handler;
    handlersIndex++;
    return key;
  }

  function removeChangeListener(key) {
    if (handlers[key]) {
      delete handlers[key];
    }
  }

  function getETHBalance(address) {
    const web3 = new Web3(provider);
    return web3.eth.getBalance(address).then(balance => {
      const ethString = web3.utils.fromWei(balance, 'ether');
      return parseFloat(ethString).toFixed(4) + ' ETH';
    });
  }

  async function checkBTokens(tokenIds){
    if (!tokenIds || !Array.isArray(tokenIds)){
      return;
    }
    const web3 = new Web3(provider);
    const contract = new web3.eth.Contract(tokenABI_B, Config.contractAddress_B);
    const result = [];
    for (let i = 0; i < tokenIds.length; i++) {
      try {
        const owner = await contract.methods.ownerOf(tokenIds[i]).call();
        result.push(owner);
      }catch(ex){
        console.log(ex);
        result.push('Not Minted');
      }
    }
    return result;
  }

  return {
    connectToWallet,
    disconnectWallet,
    isConnected,
    getSelectedAccount,
    addChangeListener,
    removeChangeListener,
    mintTokens,
    getOwnerOfToken,
    getOwnerOfContract,
    withdrawAll,
    getETHBalance,
    checkBTokens,
  };
})();


