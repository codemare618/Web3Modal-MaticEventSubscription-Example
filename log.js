var Log = (function(){
  function addLog(log){
    const now = new Date();
    log = `[${now.toLocaleDateString()} ${now.toLocaleTimeString()}] : ${log}`;
    let old = document
      .querySelector('#area_log').innerHTML;
    old += (log + '<br>');
    document.querySelector('#area_log').innerHTML = old;
  }

  function clearLog(){
    document.querySelector('#area_log').innerHTML = '';
  }

  return {
    addLog,
    clearLog,
  }
})();
