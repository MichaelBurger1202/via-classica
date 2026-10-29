/* v15.0-p4 presentation only. Does not access or write user data. */
(function(){
  'use strict';
  const rest=document.getElementById('restStatusValue');
  const badge=document.querySelector('.today-badge');
  function updateRest(){
    if(!rest)return;
    const label=(badge?.textContent||'').trim().toLowerCase();
    const mode=document.getElementById('dayMode')?.value;
    if(label==='отдых'||mode==='rest'){
      rest.textContent='День отдыха: дополнительная нагрузка не требуется';
    }else{
      rest.textContent='Отдых учитывается в плане · '+(label||'режим дня');
    }
  }
  if(badge)new MutationObserver(updateRest).observe(badge,{childList:true,subtree:true,characterData:true});
  document.getElementById('dayMode')?.addEventListener('change',()=>queueMicrotask(updateRest));
  document.getElementById('restSettings')?.addEventListener('click',()=>{
    const workspace=document.getElementById('plannerWorkspace');
    if(workspace)workspace.open=true;
    document.getElementById('dayMode')?.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    document.getElementById('dayMode')?.focus({preventScroll:true});
  });
  updateRest();
})();
