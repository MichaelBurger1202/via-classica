/* Via Classica P2: read-only, provenance-aware official-events calendar.
 * The checked-in JSON is curated; no dates are generated from guesses.
 * A separate optional local cache preserves provenance and changes in source data.
 * Never writes planner, tasks, dictionary, or links. */
(function(){
'use strict';
const FILE='./via-classica-events-current.json?v=14.8-p2';
const KEY='viaClassicaEventsV1';
const SCHEMA='via-classica-events-v1';
const STATUS=['published','not_published','changed','cancelled','unknown'];
const VERIFICATION=['verified','draft','unverified'];
const SOURCE=['official_site','official_document','social_hint'];
const SNAP=['date','time','endDate','endTime','status','verification','sourceUrl','sourceType','comment'];
let record=null, lastDate=null;
const el=id=>document.getElementById(id);
function validDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const [y,m,d]=s.split('-').map(Number);const dt=new Date(Date.UTC(y,m-1,d));return dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d}
function safeUrl(raw){try{const u=new URL(raw);return u.protocol==='https:'?u.href:null}catch(_){return null}}
function normalizeEvent(x){
 if(!x||typeof x!=='object'||typeof x.id!=='string'||!/^[-a-z0-9_]{4,120}$/i.test(x.id))return null;
 const date=validDate(x.date)?x.date:null;
 const o={id:x.id,olympiad:String(x.olympiad||'').slice(0,160),phase:String(x.phase||'').slice(0,160),type:String(x.type||'').slice(0,40),date,time:/^([01]\d|2[0-3]):[0-5]\d$/.test(x.time)?x.time:null,timezone:x.timezone==='Europe/Moscow'?'Europe/Moscow':'',status:STATUS.includes(x.status)?x.status:'unknown',verification:VERIFICATION.includes(x.verification)?x.verification:'unverified',sourceUrl:safeUrl(x.sourceUrl),sourceType:SOURCE.includes(x.sourceType)?x.sourceType:'social_hint',checkedAt:validDate(x.checkedAt)?x.checkedAt:null,comment:String(x.comment||'').slice(0,500),history:Array.isArray(x.history)?x.history.filter(h=>h&&typeof h==='object').slice(-60):[],removedFromSource:x.removedFromSource===true};
 // An official-looking label alone does not make a date confirmed.
 if(!o.olympiad||!o.phase||!o.checkedAt||!o.sourceUrl)o.verification='unverified';
 return o;
}
function normalize(raw){
 if(!raw||raw.schema!==SCHEMA||!validDate(raw.checkedAt)||!Array.isArray(raw.events))throw new Error('Неверная схема календарного источника');
 const used=new Set(),events=[];
 for(const candidate of raw.events){const e=normalizeEvent(candidate);if(!e)continue;if(used.has(e.id))throw new Error('Повторяющийся ID события: '+e.id);used.add(e.id);events.push(e)}
 return {schema:SCHEMA,sourceVersion:Number.isInteger(raw.sourceVersion)?raw.sourceVersion:1,checkedAt:raw.checkedAt,events};
}
function confirmed(e){return e&&e.verification==='verified'&&['published','changed'].includes(e.status)&&['official_site','official_document'].includes(e.sourceType)&&!!e.sourceUrl&&!!e.checkedAt&&validDate(e.date)}
function snapshot(e){const o={};SNAP.forEach(k=>{o[k]=e[k]??null});return o}
function same(a,b){return JSON.stringify(snapshot(a))===JSON.stringify(snapshot(b))}
function reconcile(previous,incoming){
 if(!previous)return incoming;
 const existing=new Map(previous.events.map(e=>[e.id,e]));
 const updated=incoming.events.map(e=>{
  const old=existing.get(e.id);
  if(!old)return e;
  const history=[...(old.history||[]),...(e.history||[]).filter(h=>!(old.history||[]).some(y=>JSON.stringify(y)===JSON.stringify(h)))];
  if(!same(old,e))history.push({observedAt:new Date().toISOString(),sourceCheckedAt:incoming.checkedAt,from:snapshot(old),to:snapshot(e)});
  return {...e,history:history.slice(-100)};
 });
 // Remember removals but do not show deleted source entries as confirmed.
 incoming.events.forEach(e=>existing.delete(e.id));
 for(const removed of existing.values()){
  const already=removed.removedFromSource===true;
  updated.push({...removed,verification:'unverified',status:'unknown',removedFromSource:true,history:[...(removed.history||[]),...(already?[]:[{observedAt:new Date().toISOString(),sourceCheckedAt:incoming.checkedAt,action:'removed-from-source',from:snapshot(removed)}])].slice(-100)});
 }
 return {...incoming,events:updated};
}
function readCache(){try{const raw=localStorage.getItem(KEY);return raw?normalize(JSON.parse(raw)):null}catch(e){console.warn('Via Classica: calendar cache not readable',e);return null}}
function persistCache(value){try{localStorage.setItem(KEY,JSON.stringify(value));return true}catch(e){console.warn('Via Classica: calendar cache not writable',e);return false}}
function formatDay(s){const [y,m,d]=s.split('-').map(Number);return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long'}).format(new Date(y,m-1,d,12))}
function formatMonth(day){const [y,m]=day.split('-').map(Number);const month=new Intl.DateTimeFormat('ru-RU',{month:'long'}).format(new Date(y,m-1,1,12));return month.charAt(0).toUpperCase()+month.slice(1)+' '+y}
function note(text){const x=el('calendarStatus');if(x)x.textContent=text}
function clear(target){while(target.firstChild)target.removeChild(target.firstChild)}
function addTag(parent,name,text,cls){const n=document.createElement(name);if(cls)n.className=cls;n.textContent=text;parent.appendChild(n);return n}
function renderForDate(day=new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0')+'-'+String(new Date().getDate()).padStart(2,'0'),extra=''){
 if(!validDate(day))throw new Error('Некорректный день календаря');lastDate=day;
 const container=el('monthEvents');if(!container)return;
 const title=el('monthTitle'),num=el('monthNumber');
 if(title)title.textContent='Ближайшее событие';
 clear(container);
 const eligible=record?record.events.filter(e=>confirmed(e)&&e.date>=day).sort((a,b)=>(a.date+' '+(a.time||'')).localeCompare(b.date+' '+(b.time||''))).slice(0,1):[];
 if(num)num.textContent='';
 if(!eligible.length){addTag(container,'p',record?'Нет ближайших событий с подтверждённой датой. Новые даты могут быть опубликованы позже.':'Не удалось получить проверенные даты. Проверьте подключение и обновите страницу.','month-empty')}
 for(const e of eligible){
  const row=document.createElement('article');row.className='calendar-event';
  addTag(row,'strong',formatDay(e.date)+(e.time?' · '+e.time+(e.timezone==='Europe/Moscow'?' МСК':' (уточните часовой пояс)'):''),'calendar-date');
  addTag(row,'span',e.olympiad+' · '+e.phase,'calendar-name');
  const a=document.createElement('a');a.href=e.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Официальный источник ↗';row.appendChild(a);
  addTag(row,'small','Проверено '+e.checkedAt+(e.history&&e.history.length?' · история изменений: '+e.history.length:''),'calendar-provenance');
  if(e.comment)addTag(row,'small',e.comment,'calendar-comment');
  container.appendChild(row);
 }
 if(record){
   const age=Math.floor((new Date(day+'T12:00:00')-new Date(record.checkedAt+'T12:00:00'))/86400000);
   note((age>30?'Проверено '+record.checkedAt+'; перепроверьте дату на сайте организатора.':'Сверено '+record.checkedAt+'.')+(extra?' '+extra:''));
 }else note(extra||'Проверенные даты не загружены; непроверенные события скрыты.');
}
async function refresh(){
 let cached=readCache();record=cached;
 renderForDate(lastDate||undefined,cached?'Показана последняя сохранённая версия; идёт проверка обновлений.':'');
 try{
  const response=await fetch(FILE,{cache:'no-store'});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const incoming=normalize(await response.json());
  if(cached&&(cached.checkedAt>incoming.checkedAt||(cached.checkedAt===incoming.checkedAt&&cached.sourceVersion>incoming.sourceVersion))){record=cached;renderForDate(lastDate||undefined,'Сетевая версия источника старее сохранённой. Сохранена более свежая версия.');return}
  const merged=reconcile(cached,incoming);
  record=merged;const saved=persistCache(merged);
  renderForDate(lastDate||undefined,saved?'':'Не удалось записать локальную копию календаря. Офлайн-доступ к этому обновлению не гарантирован.');
 }catch(e){
  record=cached;
  renderForDate(lastDate||undefined,cached?'Обновление не удалось: используется ранее сохранённая версия. Проверьте сроки на сайте организатора.':'Календарь не загружен. Подключите интернет; неподтверждённые даты не показываются.');
 }
}
window.ViaClassicaCalendar={refresh,renderForDate,normalize,confirmed,reconcile};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
})();
