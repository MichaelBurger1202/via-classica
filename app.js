const STORAGE='viaClassicaV2';
let state;
try { state=JSON.parse(localStorage.getItem(STORAGE)||'{}'); } catch(e) { state={}; localStorage.removeItem(STORAGE); }
state.checks=state.checks||{}; state.tasks=state.tasks||[]; state.links=state.links||[];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const titles={home:'Сегодня и этот месяц',olympiads:'Олимпиады',ielts:'IELTS',fullplan:'Полный план до поступления',grade11:'План до конца 11 класса',links:'Архив ссылок',english:'Английский'};
function save(){const cur=JSON.parse(localStorage.getItem(STORAGE)||'{}');cur.checks=state.checks;cur.links=state.links;cur.tasks=cur.tasks||state.tasks;localStorage.setItem(STORAGE,JSON.stringify(cur));updateProgress()}
function bindChecks(){
  $$('input[data-id]').forEach(x=>{x.checked=!!state.checks[x.dataset.id];x.addEventListener('change',()=>{state.checks[x.dataset.id]=x.checked;save()})})
}
function updateProgress(){const all=$$('input[data-id]');const done=all.filter(x=>x.checked).length;const p=all.length?Math.round(done/all.length*100):0;$('#pct').textContent=p+'%';$('#bar').style.width=p+'%'}
function show(page){$$('.main-nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===page));$$('.page').forEach(x=>x.classList.toggle('active',x.id===page));$('#title').textContent=titles[page];closeDrawer();window.scrollTo({top:0,behavior:'smooth'}); if(page==='english' && typeof window.initEnglish==='function') window.initEnglish();}
window.showViaPage=show;
$$('[data-page]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();show(b.dataset.page)}));
function openDrawer(){ $('#drawer').classList.add('open'); $('#overlay').classList.add('show') }
function closeDrawer(){ $('#drawer').classList.remove('open'); $('#overlay').classList.remove('show') }
$('#menuBtn').addEventListener('click',openDrawer);$('#closeMenu').addEventListener('click',closeDrawer);$('#overlay').addEventListener('click',closeDrawer);
function renderTasks(){const box=$('#todayTasks');box.innerHTML='';if(!state.tasks.length){box.innerHTML='<div class="empty">Пока пусто. Добавь первую задачу на сегодня.</div>';return}state.tasks.forEach((t,i)=>{const row=document.createElement('div');row.className='task-item '+(t.done?'done':'');row.innerHTML=`<input type="checkbox" ${t.done?'checked':''}><span></span><button aria-label="Удалить">×</button>`;row.querySelector('span').textContent=t.text;row.querySelector('input').addEventListener('change',e=>{t.done=e.target.checked;save();renderTasks()});row.querySelector('button').addEventListener('click',()=>{state.tasks.splice(i,1);save();renderTasks()});box.appendChild(row)})}
// Task form is handled by planner.js
function seedLinks(){if(state.links.length)return;state.links=[
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
function renderLinks(){const grid=$('#linksGrid'),filter=$('#linkFilter').value;grid.innerHTML='';const list=state.links.filter(l=>filter==='all'||(filter==='favorite'?l.fav:l.cat===filter));if(!list.length){grid.innerHTML='<div class="empty">В этой категории пока нет ссылок.</div>';return}list.forEach(l=>{const card=document.createElement('article');card.innerHTML=`<span class="link-cat">${l.cat}</span><div class="link-title">${escapeHtml(l.name)}</div><div class="link-url">${escapeHtml(l.url)}</div><div class="link-bottom"><a href="${escapeAttr(l.url)}" target="_blank" rel="noopener">Открыть ↗</a><div><button class="fav" title="Избранное">${l.fav?'★':'☆'}</button><button class="link-edit" title="Редактировать">✎</button><button class="link-delete" title="Удалить">×</button></div></div>`;card.querySelector('.fav').addEventListener('click',()=>{l.fav=!l.fav;save();renderLinks()});card.querySelector('.link-delete').addEventListener('click',()=>{if(confirm('Удалить ссылку?')){state.links=state.links.filter(x=>x.id!==l.id);save();renderLinks()}});card.querySelector('.link-edit').addEventListener('click',()=>openLinkEdit(l));grid.appendChild(card)})}
function escapeHtml(s){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}function escapeAttr(s){return escapeHtml(s)}
$('#linkFilter').addEventListener('change',renderLinks);const modal=$('#linkModal');
function openModal(link=null){modal.classList.add('open');modal.setAttribute('aria-hidden','false');modal.dataset.edit=link?link.id:'';$('#linkName').value=link?link.name:'';$('#linkUrl').value=link?link.url:'';$('#linkCategory').value=link?link.cat:'Вузы';$('#linkFav').checked=!!(link&&link.fav);$('#linkName').focus()}function openLinkEdit(link){openModal(link)}function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');$('#linkForm').reset();delete modal.dataset.edit}
$('#addLinkBtn').addEventListener('click',openModal);$('#closeModal').addEventListener('click',closeModal);$('#cancelLink').addEventListener('click',closeModal);modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
$('#linkForm').addEventListener('submit',e=>{e.preventDefault();const id=modal.dataset.edit;if(id){const l=state.links.find(x=>x.id===id);if(l){l.name=$('#linkName').value.trim();l.url=$('#linkUrl').value.trim();l.cat=$('#linkCategory').value;l.fav=$('#linkFav').checked}}else state.links.push({id:Date.now().toString(),name:$('#linkName').value.trim(),url:$('#linkUrl').value.trim(),cat:$('#linkCategory').value,fav:$('#linkFav').checked});save();renderLinks();closeModal()});
seedLinks();renderTasks();renderLinks();bindChecks();updateProgress();

// v9 startup: every fresh page load starts on Home. Other modules must not navigate during boot.
show('home');

// PWA installation support. The button appears only when the browser offers installation.
let deferredInstallPrompt = null;
const installBtn = $('#installAppBtn');
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
    navigator.serviceWorker.register('./sw.js?v=13.1').catch(() => {});
  });
}
