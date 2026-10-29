/* Via Classica P1 — guarded persistent writes, compatible with existing keys. */
(function(){
  const expected=new Map();
  const stale=new Set();
  const labels={viaClassicaV2:'задач, планов и ссылок',viaClassicaPlannerV3:'расписания',viaClassicaEnglishV1:'английского'};
  function notice(message,conflict=false){
    let box=document.getElementById('vcStorageNotice');
    if(!box){box=document.createElement('div');box.id='vcStorageNotice';box.setAttribute('role','alert');box.setAttribute('aria-live','assertive');
      box.style.cssText='position:fixed;z-index:2147483000;top:12px;left:12px;right:12px;max-width:740px;margin:auto;padding:14px 16px;background:#fff4e8;color:#542f25;border:2px solid #954e3d;border-radius:12px;box-shadow:0 4px 24px #0002;font:600 15px/1.5 system-ui,sans-serif';
      document.body.appendChild(box);
    }
    box.textContent=message+' ';
    if(conflict){const reload=document.createElement('button');reload.textContent='Обновить страницу';reload.style.cssText='margin-left:12px;padding:8px;border:1px solid currentColor;border-radius:6px;background:white;color:inherit;cursor:pointer';reload.onclick=()=>location.reload();box.appendChild(reload);}
    else{const close=document.createElement('button');close.textContent='Закрыть';close.style.cssText='margin-left:12px;padding:8px;border:1px solid currentColor;border-radius:6px;background:white;color:inherit;cursor:pointer';close.onclick=()=>box.remove();box.appendChild(close);}
  }
  function track(key){if(expected.has(key))return expected.get(key);let raw=null;try{raw=localStorage.getItem(key)}catch(e){notice('Хранилище браузера недоступно. Изменения не подтверждены.');}expected.set(key,raw);return raw;}
  function commit(key,value){
    const serialized=typeof value==='string'?value:JSON.stringify(value);
    const base=track(key);
    try{
      const latest=localStorage.getItem(key);
      if(stale.has(key)||latest!==base){stale.add(key);notice('Данные '+(labels[key]||key)+' изменились в другом окне. Ничего не перезаписано. Сначала обновите страницу.',true);return {ok:false,conflict:true};}
      localStorage.setItem(key,serialized);
      if(localStorage.getItem(key)!==serialized)throw new Error('Сохранённое значение не совпадает с проверяемым');
      expected.set(key,serialized);return {ok:true};
    }catch(e){notice('Не удалось сохранить изменение '+(labels[key]||key)+'. Изменение отменено. Проверьте доступность хранилища.');console.warn('Via Classica guarded write failed',key,e);return {ok:false,error:String(e)};}
  }
  function isStale(key){return stale.has(key)}
  window.addEventListener('storage',e=>{
    if(e.key===null){['viaClassicaV2','viaClassicaPlannerV3','viaClassicaEnglishV1'].forEach(k=>stale.add(k));notice('Хранилище Via Classica изменено в другом окне. Сохранение из этого окна приостановлено до обновления страницы.',true);return;}
    if(expected.has(e.key) && e.newValue!==expected.get(e.key)){stale.add(e.key);notice('Данные Via Classica изменены в другом окне. Это окно не будет перезаписывать новые данные.',true);}
  });
  window.VCGuard={track,commit,notice,isStale};
})();
