var API = (function(){
  const instance = axios.create({
    baseURL: Config.apiEndPoint
  });

  //TODO - Comment out catch when api works correctly
  function getTokenPrice(userId, sessionId) {
    return instance.get('tokenPrice', {
      params: {
        userId, sessionId
      }
    })
      .then(r => r.data)
      .catch((err) => {
        return {
          price: 0.04
        }
      })
      .then(r => r.price);
  }

  function canMint(userId, sessionId, mintQty){
    return instance.get('tokenPrice', {
      params: {
        userId, sessionId, mintQty
      }
    }).then(r => r.data)
      .catch(err => {
        return {
          canMint: true
        }
      })
      .then(r => r.canMint)
      ;
  }

  function getMaxQty(){
    return instance.get('maxQty')
      .then(r => r.data)
      .catch(err => {
        return {
          maxQty: 500
        }
      })
      .then(r => r.maxQty);
  }

  function mintTokens(to, txHash, count, sessionId){
    return instance.get('mintTokens')
      .then(r => r.data, {
        params: {
          to,
          txHash,
          count,
          sessionId,
        }
      })
      .catch(err => {

      })
  }

  return {
    getTokenPrice,
    canMint,
    getMaxQty,
    mintTokens
  }
})();

