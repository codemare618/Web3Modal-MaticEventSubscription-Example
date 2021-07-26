'use strict';

const contractLib = (function () {
  let web3Modal;
  let provider;
  let selectedAccount;
  let handlersIndex = 0;
  let maticMintSubscription;
  const handlers = {};

  const Web3Modal = window.Web3Modal.default;
  const WalletConnectProvider = window.WalletConnectProvider.default;


  // Function to subscribe matic mint event
  function subscribeContractEvent(eventName, eventCallback) {
    // Create MATIC Web3
    const web3 = new Web3(Config.maticProvider.wss);
    const contract = new web3.eth.Contract(tokenABI.abi, Config.contractAddress);


    const eventJsonInterface = web3.utils._.find(
      contract._jsonInterface,
      o => o.name === eventName && o.type === 'event',
    );

    console.log(`Subscribing to ${eventName} event`);

    const subscription = web3.eth.subscribe('logs', {
      address: contract.options.address,
      topics: [eventJsonInterface.signature]
    }, function (error, result) {
      if (error){
        console.log(`Subscribe event error : ${error}`);
        eventCallback(error);
        return;
      }
      const eventObj = web3.eth.abi.decodeLog(
        eventJsonInterface.inputs,
        result.data,
        result.topics.slice(1)
      )
      console.log(`Subscribe event New ${eventName}!`, eventObj);
      eventCallback(undefined, eventObj);
    });

    return subscription;
  }


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


    if (maticMintSubscription) {
      maticMintSubscription.unsubscribe(function(error, success) {
          console.log(`Unsubscribe to matic mint event : Error : ${error}, Success: ${success}`);
      });
    }

    maticMintSubscription = subscribeContractEvent('Mint', function(error, result){
      // When it is minted to selected account
      if (result.to === selectedAccount) {
        Log.addLog(`Token ${result.tokenId} is minted to ${result.to}, sessionId = ${result.sessionId}`);
      }
    });

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

  async function mintTokens(sessionId, count) {
    if (!isConnected()) {
      throw new Error('Not Connected to wallet');
    }

    if (isNaN(count) || count < 1 || !Number.isInteger(count)) {
      throw new Error('Invalid mint count');
    }

    if (!sessionId) {
      throw new Error('Invalid session id');
    }

    // Get the token price and send ether to contract owner
    const web3 = new Web3(provider);

    // Calculate the price
    const tokenPrice = await API.getTokenPrice(selectedAccount, sessionId);
    const maxMintQty = await API.getMaxQty();
    const canMint = await API.canMint(selectedAccount, sessionId, count);

    Log.addLog(`Token Price: ${tokenPrice}ETH, Maximum mintable quantity: ${maxMintQty}, canMint call for ${count}: ${canMint}`);

    if (!canMint) {
      throw new Error(`Can mint api returned false`);
    }

    if (count > maxMintQty) {
      throw new Error(`Mint count exceeds maximum mintable count ${maxMintQty}`);
    }

    const ethAmount = tokenPrice * count;
    const ethRecipient = Config.ethRecipient;
    Log.addLog(`Should send ${ethAmount} ETH to contract owner ${ethRecipient}`);

    // Send eth to contract owner
    const amountToSend = web3.utils.toWei(`${ethAmount}`, 'ether');
    web3.eth.sendTransaction({from: selectedAccount, to: ethRecipient, value:amountToSend})
      .on('transactionHash', function(hash) {
        Log.addLog(`ETH transaction hash : ${hash}`);
      })
      .on('receipt', function(receipt){
        console.log(receipt);
        Log.addLog(`Transaction completed : blockNumber: [${receipt.blockNumber}], gasUsed:[${receipt.gasUsed}], status: [${receipt.status}], txHash:[${receipt.transactionHash}]`);

        if (receipt.status === true) {
          Log.addLog(`Sending mint request to server with txHash : ${receipt.transactionHash}`);

        } else {
          Log.addLog(`Transaction status is not success`);
        }
      })
      .on('error', function(err){
        console.log('send ether err', err);
        Log.addLog(`Error occurred while sending ${ethAmount}ETH, Error : ${err}`);
      });
  }

  async function getOwnerOfToken(tokenId) {
    const web3 = new Web3(provider);
    const contract = new web3.eth.Contract(Config.tokenABI.abi, Config.contractAddress);
    return await contract.methods.ownerOf(tokenId).call();
  }

  function getSelectedAccount() {
    return selectedAccount;
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
  };
})();


