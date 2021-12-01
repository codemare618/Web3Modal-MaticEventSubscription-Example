'use strict';

const contractLib = (function () {
  let web3Modal;
  let provider;
  let selectedAccount;
  let handlersIndex = 0;
  const handlers = {};

  const Web3Modal = window.Web3Modal.default;
  const WalletConnectProvider = window.WalletConnectProvider.default;

  async function initialize() {
    console.log('Initializing example');
    console.log('WalletConnectProvider is', WalletConnectProvider);
    console.log('window.web3 is', window.web3, 'window.ethereum is', window.ethereum);

    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: Config.options.walletconnect
      }
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
      window.location.refresh();
    });

    provider.on('networkChanged', (networkId) => {
      // Refresh window when chain is changed
      window.location.refresh();
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
    await _connectInternal();
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

  async function mintTokens(count) {
    if (!isConnected()) {
      throw new Error('Not Connected to wallet');
    }

    if (isNaN(count) || count < 1 || !Number.isInteger(count)) {
      throw new Error('Invalid mint count');
    }

    // Get the token price and send ether to contract owner
    const web3 = new Web3(provider);
    const contract = new web3.eth.Contract(tokenABI, Config.contractAddress);

    const {maxMint, maxSupply, canMint, price, expirationTime, signature} = await API.getMintParams(selectedAccount);

    Log.addLog(`Parameters response: price=${price}ETH, maxSupply=${maxSupply}, maxMint=${maxMint}, price=${price}, expirationTime=${expirationTime} signature=${signature}`);

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
    const mintMethod = contract.methods.mintTokens(selectedAccount, count, maxSupply, maxMint, priceInWei, canMint, expirationTime, signature);
    const gasEstimate = await mintMethod.estimateGas({
      from: selectedAccount,
      gasPrice,
      value
    });

    // Call method
    mintMethod.send({
      from: selectedAccount,
      gasPrice,
      gas: gasEstimate,
      value,
    })
      .on('transactionHash', function(hash) {
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
    const contract = new web3.eth.Contract(tokenABI, Config.contractAddress);
    return await contract.methods.ownerOf(tokenId).call();
  }

  async function getOwnerOfContract() {
    const web3 = new Web3(provider);
    const contract = new web3.eth.Contract(tokenABI, Config.contractAddress);
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
    const contract = new web3.eth.Contract(tokenABI, Config.contractAddress);
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
  };
})();


