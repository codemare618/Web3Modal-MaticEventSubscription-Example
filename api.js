var API = (function(){
  const instance = axios.create({
    baseURL: Config.apiEndPoint
  });

  function getMintParams(userId){
    return instance.get('signParameters', {
    //return instance.get('http://localhost:8080/', {
      params: {userId}
    }).then(r => r.data);
  }

  return {getMintParams};
})();

