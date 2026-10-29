(function(){
const STORAGE='viaClassicaV2';
const readStorage=(key,fallback=null)=>{try{return localStorage.getItem(key)??fallback}catch(_){return fallback}};
let state;
try { state=JSON.parse(readStorage(STORAGE,'{}')||'{}')||{}; } catch(e) { const raw=readStorage(STORAGE,null); try { if(raw) localStorage.setItem(STORAGE+'_corrupt_backup',raw); } catch(_) {} state={}; }
if(!state || typeof state!=='object' || Array.isArray(state)){const raw=readStorage(STORAGE,null);try{if(raw&&!localStorage.getItem(STORAGE+'_corrupt_backup'))localStorage.setItem(STORAGE+'_corrupt_backup',raw)}catch(_){}state={};}
const initialLinksPresent=Object.prototype.hasOwnProperty.call(state,'links')&&Array.isArray(state.links);
window.VCGuard.track(STORAGE);
state.checks=(state.checks && typeof state.checks==='object' && !Array.isArray(state.checks))?state.checks:{};
state.tasks=Array.isArray(state.tasks)?state.tasks.filter(t=>t&&typeof t==='object').map(t=>{const o=Object.assign({},t);o.id=String(t.id||('legacy-'+Math.random().toString(36).slice(2)));o.text=String(t.text||'').trim();o.date=String(t.date||'');o.type=['move','soft','hard'].includes(t.type)?t.type:'move';const n=Number(t.minutes);o.minutes=Number.isFinite(n)?Math.max(5,Math.min(600,n)):45;o.done=!!t.done;return o}).filter(t=>t.text):[];
state.links=Array.isArray(state.links)?state.links.filter(l=>l&&typeof l==='object').map(l=>({id:String(l.id||('link-'+Math.random().toString(36).slice(2))),name:String(l.name||'').trim(),url:String(l.url||''),cat:String(l.cat||'Вузы'),fav:!!l.fav})).filter(l=>l.name||l.url):[];
// De-duplicate legacy IDs so delete/edit operations cannot target multiple records.
{const seen=new Set();state.tasks.forEach(t=>{if(seen.has(t.id))t.id=t.id+'-'+Math.random().toString(36).slice(2,7);seen.add(t.id)});const seenLinks=new Set();state.links.forEach(l=>{if(seenLinks.has(l.id))l.id=l.id+'-'+Math.random().toString(36).slice(2,7);seenLinks.add(l.id)})}
const vcQuery=s=>document.querySelector(s), vcQueryAll=s=>[...document.querySelectorAll(s)];
const titles={home:'Сегодня',olympiads:'Олимпиады',ielts:'IELTS',fullplan:'Путь',grade11:'Путь · Учебные годы',links:'Архив',english:'Английский',data:'Настройки и данные'};
let lastAppCommitted={checks:JSON.parse(JSON.stringify(state.checks)),links:JSON.parse(JSON.stringify(state.links))};
function revertApp(){state.checks=JSON.parse(JSON.stringify(lastAppCommitted.checks));state.links=JSON.parse(JSON.stringify(lastAppCommitted.links));vcQueryAll('input[data-id]').forEach(x=>{x.checked=!!state.checks[x.dataset.id]});renderLinks();updateProgress()}
function save(){let cur={};try{cur=JSON.parse(readStorage(STORAGE,'{}')||'{}')||{}}catch(_){cur={}}if(!cur||typeof cur!=='object'||Array.isArray(cur))cur={};
 // Only app-owned fields change; planner tasks are always taken from the latest stored document.
 if(JSON.stringify(cur.checks||{})!==JSON.stringify(lastAppCommitted.checks)||JSON.stringify(cur.links||[])!==JSON.stringify(lastAppCommitted.links)){
   window.VCGuard.notice('Архив ссылок или отметки изменены в другом окне. Изменение не сохранено; обновите страницу.',true);revertApp();return false;
 }
 cur.checks=state.checks;cur.links=state.links;
 const result=window.VCGuard.commit(STORAGE,cur);
 if(!result.ok){revertApp();return false;}
 lastAppCommitted={checks:JSON.parse(JSON.stringify(state.checks)),links:JSON.parse(JSON.stringify(state.links))};updateProgress();return true;
}
function bindChecks(){
  vcQueryAll('input[data-id]').forEach(x=>{x.checked=!!state.checks[x.dataset.id];x.addEventListener('change',()=>{state.checks[x.dataset.id]=x.checked;save()})})
}
function updateProgress(){const all=vcQueryAll('input[data-id]');const done=all.filter(x=>x.checked).length;const p=all.length?Math.round(done/all.length*100):0;const pct=vcQuery('#pct'),bar=vcQuery('#bar');if(pct)pct.textContent=p+'%';if(bar)bar.style.width=p+'%'}
function show(page){const wasActive=vcQuery('#'+page)?.classList.contains('active');document.body.classList.toggle('data-page-active',page==='data');vcQueryAll('.main-nav button, .quick-nav button').forEach(x=>{x.classList.toggle('active',x.dataset.page===page);x.classList.toggle('quick-active',x.dataset.page===page)});vcQueryAll('.page').forEach(x=>x.classList.toggle('active',x.id===page));vcQuery('#title').textContent=titles[page];const fromDrawer=vcQuery('#drawer')?.contains(document.activeElement);closeDrawer();if(fromDrawer){const heading=vcQuery('#title');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true})}if(!wasActive){try{window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}catch(_){}} if(page==='english' && typeof window.initEnglish==='function') window.initEnglish();}
window.showViaPage=show;
vcQueryAll('[data-page]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();show(b.dataset.page)}));
vcQueryAll('[data-add-task]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();show('home');const form=vcQuery('#taskForm'),input=vcQuery('#taskInput');if(form){const editor=vcQuery('#taskEditor');if(editor)editor.open=true;form.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});setTimeout(()=>input?.focus(),100)}}));
function openDrawer(){ vcQuery('#drawer').inert=false; vcQuery('#drawer').classList.add('open'); vcQuery('#overlay').classList.add('show'); vcQuery('#menuBtn')?.setAttribute('aria-expanded','true'); vcQuery('#drawer')?.setAttribute('aria-hidden','false');vcQuery('#closeMenu')?.focus() }
function closeDrawer(){ vcQuery('#drawer').classList.remove('open'); vcQuery('#overlay').classList.remove('show'); vcQuery('#menuBtn')?.setAttribute('aria-expanded','false'); vcQuery('#drawer')?.setAttribute('aria-hidden','true');vcQuery('#drawer').inert=true }
vcQuery('#menuBtn')?.addEventListener('click',openDrawer);vcQuery('#closeMenu')?.addEventListener('click',closeDrawer);vcQuery('#overlay')?.addEventListener('click',closeDrawer);document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(vcQuery('#drawer')?.classList.contains('open')){closeDrawer();vcQuery('#menuBtn')?.focus()}else if(vcQuery('#linkModal')?.classList.contains('open'))closeModal()}if(e.key==='Tab'&&vcQuery('#linkModal')?.classList.contains('open')){const nodes=[...vcQuery('#linkModal').querySelectorAll('button:not([hidden]):not([disabled]),input:not([hidden]),select:not([hidden])')];const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}if(e.key==='Tab'&&vcQuery('#drawer')?.classList.contains('open')){const nodes=[...vcQuery('#drawer').querySelectorAll('button:not([hidden]):not([disabled])')];const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
function renderTasks(){const box=vcQuery('#todayTasks');if(!box)return;box.innerHTML='';if(!Array.isArray(state.tasks)||!state.tasks.length){box.innerHTML='<div class="empty">Пока пусто. Добавь первую задачу на сегодня.</div>';return}state.tasks.forEach((t,i)=>{const row=document.createElement('div');row.className='task-item '+(t.done?'done':'');row.innerHTML=`<input type="checkbox" ${t.done?'checked':''}><span></span><button aria-label="Удалить">×</button>`;row.querySelector('span').textContent=t.text;row.querySelector('input').addEventListener('change',e=>{t.done=e.target.checked;save();renderTasks()});row.querySelector('button').addEventListener('click',()=>{state.tasks.splice(i,1);save();renderTasks()});box.appendChild(row)})}
// Task form is handled by planner.js
function seedLinks(){if(initialLinksPresent)return;state.links=[
 {id:'sapienza',name:'Sapienza — официальный сайт',url:'https://www.uniroma1.it/',cat:'Вузы',fav:true},
 {id:'sapienza-classics',name:'Sapienza — BA Classics',url:'https://corsidilaurea.uniroma1.it/en/corso/2026/33528/home',cat:'Вузы',fav:true},
 {id:'spbu',name:'СПбГУ — официальный сайт',url:'https://spbu.ru/',cat:'Вузы',fav:true},
 {id:'spbu-olymp',name:'СПбГУ — олимпиады',url:'https://olymp.spbu.ru/',cat:'Олимпиады',fav:true},
 {id:'hse-olymp',name:'«Высшая проба»',url:'https://olymp.hse.ru/',cat:'Олимпиады',fav:true},
 {id:'lomonosov',name:'Олимпиада «Ломоносов»',url:'https://olymp.msu.ru/',cat:'Олимпиады',fav:false},
 {id:'vseros',name:'ВСОШ',url:'https://vserosolimp.edsoo.ru/',cat:'Олимпиады',fav:false},
 {id:'ielts',name:'IELTS — официальный сайт',url:'https://ielts.org/',cat:'IELTS',fav:true},
 {id:'disco',name:'DiSCo Lazio',url:'https://www.laziodisco.it/',cat:'Италия',fav:true},
 {id:'universitaly',name:'Universitaly',url:'https://www.universitaly.it/',cat:'Документы',fav:true},
 {id:'studyinitaly',name:'Study in Italy',url:'https://studyinitaly.esteri.it/',cat:'Италия',fav:false}
 ];save()}
function safeHttpUrl(raw){try{const u=new URL(String(raw||''),location.href);return (u.protocol==='http:'||u.protocol==='https:')?u.href:''}catch(e){return ''}}
function renderLinks(){const grid=vcQuery('#linksGrid');if(!grid)return;const filter=vcQuery('#linkFilter')?.value||'all';grid.innerHTML='';const list=state.links.filter(l=>{if(!l||typeof l!=='object'||!safeHttpUrl(l.url))return false;return filter==='all'||(filter==='favorite'?!!l.fav:l.cat===filter)});if(!list.length){grid.innerHTML='<div class="empty">В этой категории пока нет ссылок.</div>';return}list.forEach(l=>{const card=document.createElement('article');const url=safeHttpUrl(l.url);card.innerHTML=`<span class="link-cat">${escapeHtml(l.cat||'')}</span><div class="link-title">${escapeHtml(l.name||'Без названия')}</div><div class="link-url">${escapeHtml(url)}</div><div class="link-bottom"><a href="${escapeAttr(url)}" target="_blank" rel="noopener">Открыть ↗</a><div><button class="fav" title="Избранное">${l.fav?'★':'☆'}</button><button class="link-edit" title="Редактировать">✎</button><button class="link-delete" title="Удалить">×</button></div></div>`;card.querySelector('.fav').addEventListener('click',()=>{l.fav=!l.fav;save();renderLinks()});card.querySelector('.link-delete').addEventListener('click',()=>{if(confirm('Удалить ссылку?')){state.links=state.links.filter(x=>x.id!==l.id);save();renderLinks()}});card.querySelector('.link-edit').addEventListener('click',()=>openLinkEdit(l));grid.appendChild(card)})}
function escapeHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}function escapeAttr(s){return escapeHtml(s)}
vcQuery('#linkFilter')?.addEventListener('change',renderLinks);const modal=vcQuery('#linkModal');
let lastModalTrigger=null;function openModal(link=null){lastModalTrigger=document.activeElement;modal.classList.add('open');modal.setAttribute('aria-hidden','false');modal.dataset.edit=link?link.id:'';vcQuery('#linkName').value=link?link.name:'';vcQuery('#linkUrl').value=link?link.url:'';vcQuery('#linkCategory').value=link?link.cat:'Вузы';vcQuery('#linkFav').checked=!!(link&&link.fav);vcQuery('#linkName').focus()}function openLinkEdit(link){openModal(link)}function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');vcQuery('#linkForm').reset();delete modal.dataset.edit;if(lastModalTrigger?.isConnected)lastModalTrigger.focus();else vcQuery('#addLinkBtn')?.focus()}
vcQuery('#addLinkBtn')?.addEventListener('click',()=>openModal());vcQuery('#closeModal')?.addEventListener('click',closeModal);vcQuery('#cancelLink')?.addEventListener('click',closeModal);modal?.addEventListener('click',e=>{if(e.target===modal)closeModal()});
vcQuery('#linkForm')?.addEventListener('submit',e=>{e.preventDefault();const id=modal.dataset.edit;if(id){const l=state.links.find(x=>x.id===id);if(l){l.name=vcQuery('#linkName').value.trim();const url=safeHttpUrl(vcQuery('#linkUrl').value.trim());if(!url){alert('Нужна корректная ссылка http:// или https://');return}l.url=url;l.cat=vcQuery('#linkCategory').value;l.fav=vcQuery('#linkFav').checked}}else {const url=safeHttpUrl(vcQuery('#linkUrl').value.trim());if(!url){alert('Нужна корректная ссылка http:// или https://');return}state.links.push({id:'link-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),name:vcQuery('#linkName').value.trim(),url,cat:vcQuery('#linkCategory').value,fav:vcQuery('#linkFav').checked});}if(save()){renderLinks();closeModal()}else renderLinks()});
seedLinks();renderTasks();renderLinks();bindChecks();updateProgress();

// v9 startup: every fresh page load starts on Home. Other modules must not navigate during boot.
show('home');

// PWA installation support. The button appears only when the browser offers installation.
let deferredInstallPrompt = null;
const installBtn = vcQuery('#installAppBtn');
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (installBtn) installBtn.hidden = false;
});
if (installBtn) installBtn.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installBtn.hidden = true;
});
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  if (installBtn) installBtn.hidden = true;
});

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js?v=15.2-r2').catch(() => {});
  });
}

})();
