(function(){
const PKEY='viaClassicaPlannerV3';
const STATE_KEY='viaClassicaV2';
const SCHEDULE_FORMAT='via-classica-schedule-v2';
const WEEK=[{name:'Понедельник',dayIndex:1},{name:'Вторник',dayIndex:2},{name:'Среда',dayIndex:3},{name:'Четверг',dayIndex:4},{name:'Пятница',dayIndex:5},{name:'Суббота',dayIndex:6},{name:'Воскресенье',dayIndex:0}];
const MODE_CAP={light:75,normal:120,heavy:165,rest:0};
const MODE_NAME={light:'Лёгкий день',normal:'Обычный день',heavy:'Насыщенный день',rest:'Отдых'};
const DAY_NAMES={0:'Воскресенье',1:'Понедельник',2:'Вторник',3:'Среда',4:'Четверг',5:'Пятница',6:'Суббота'};
const DAY_WEEKLY={0:'по воскресеньям',1:'по понедельникам',2:'по вторникам',3:'по средам',4:'по четвергам',5:'по пятницам',6:'по субботам'};
const DAY_TO={0:'воскресенье',1:'понедельник',2:'вторник',3:'среду',4:'четверг',5:'пятницу',6:'субботу'};
const DAY_FROM={0:'воскресенья',1:'понедельника',2:'вторника',3:'среды',4:'четверга',5:'пятницы',6:'субботы'};
const DEFAULT_RECURRING=[
{id:'fixed-mon-litclub',title:'Литературный клуб',activity:'литературный клуб',dayIndex:1,minutes:75,bufferAfter:30,active:true},
{id:'fixed-wed-ielts',title:'IELTS + Speaking',activity:'английский / IELTS / speaking',dayIndex:3,minutes:60,bufferAfter:30,active:true},
{id:'fixed-thu-literature',title:'ЕГЭ литература',activity:'ЕГЭ · литература',dayIndex:4,minutes:90,bufferAfter:30,active:true},
{id:'fixed-sat-readings',title:'Чтения',activity:'чтения',dayIndex:6,minutes:90,bufferAfter:30,active:true},
{id:'fixed-sat-speaking',title:'Speaking Club',activity:'разговорный клуб / английский',dayIndex:6,minutes:90,bufferAfter:30,active:true},
{id:'fixed-sun-ielts',title:'IELTS + Speaking',activity:'английский / IELTS / speaking',dayIndex:0,minutes:60,bufferAfter:30,active:true}
];
const LEGACY_PKEY='viaClassicaPlannerV2';
const MIGRATION_KEY='viaClassicaPlannerV3_migration_v14';
const read=k=>{try{return localStorage.getItem(k)}catch(_){return null}};
const write=(k,v)=>{const serialized=JSON.stringify(v);try{localStorage.setItem(k,serialized);if(localStorage.getItem(k)!==serialized)throw new Error('Storage read-back verification failed');return true}catch(e){console.warn('Via Classica storage write failed',k,e);try{localStorage.setItem(k+'_storage_error_backup',JSON.stringify({at:new Date().toISOString(),value:v,error:String(e&&e.message||e)}))}catch(_){}return false}};
function parseStored(key){const raw=read(key);if(!raw)return {value:null,raw:null,corrupt:false};try{const value=JSON.parse(raw);if(!value||typeof value!=='object'||Array.isArray(value)){try{if(!read(key+'_corrupt_backup'))localStorage.setItem(key+'_corrupt_backup',raw)}catch(_){}return {value:null,raw,corrupt:true}}return {value,raw,corrupt:false}}catch(e){try{if(!read(key+'_corrupt_backup'))localStorage.setItem(key+'_corrupt_backup',raw)}catch(_){}return {value:null,raw,corrupt:true}}}
const activeStored=parseStored(PKEY);
const legacyStored=parseStored(LEGACY_PKEY);
const iso=d=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};
const today=()=>iso(new Date());
const dt=s=>new Date(String(s)+'T12:00:00');
const add=(s,n)=>{const d=dt(s);d.setDate(d.getDate()+n);return iso(d)};
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
let planner=activeStored.value||{};
if(!planner.modes||typeof planner.modes!=='object'||Array.isArray(planner.modes))planner.modes={};
if(!planner.frozen||typeof planner.frozen!=='object')planner.frozen={};
if(!planner.recurring||!Array.isArray(planner.recurring))planner.recurring=[];
if(!planner.actuals||typeof planner.actuals!=='object')planner.actuals={};
if(!planner.chat||!Array.isArray(planner.chat))planner.chat=[];
if(!planner.context||typeof planner.context!=='object')planner.context={};
planner.version=14;
const savePlanner=()=>write(PKEY,planner);
const copyPlanner=()=>JSON.parse(JSON.stringify(planner));
const restorePlanner=snapshot=>{planner=snapshot};
function matchingDefaultItems(item){return DEFAULT_RECURRING.filter(d=>String(item?.id||'')===d.id||(normalizeMatch(item?.title)===normalizeMatch(d.title)&&Number(item?.dayIndex)===Number(d.dayIndex)))}
function clearDefaultRemoval(title,dayIndex){const matches=DEFAULT_RECURRING.filter(d=>normalizeMatch(d.title)===normalizeMatch(title)&&Number(d.dayIndex)===Number(dayIndex));if(!matches.length)return;const removed=Array.isArray(planner.removedRecurringDefaults)?planner.removedRecurringDefaults:[];planner.removedRecurringDefaults=removed.filter(id=>!matches.some(d=>d.id===id))}
function isDefaultRemoved(item){const removed=Array.isArray(planner.removedRecurringDefaults)?planner.removedRecurringDefaults:[];return matchingDefaultItems(item).some(d=>removed.includes(d.id))}
function rememberDefaultRemoval(item){const removed=Array.isArray(planner.removedRecurringDefaults)?planner.removedRecurringDefaults.slice():[];matchingDefaultItems(item).forEach(d=>{if(!removed.includes(d.id))removed.push(d.id)});planner.removedRecurringDefaults=removed}
function deleteRecurringById(id){const item=planner.recurring.find(x=>String(x.id)===String(id));if(!item)return {ok:false,notFound:true};const before=copyPlanner();rememberDefaultRemoval(item);planner.recurring=planner.recurring.filter(x=>String(x.id)!==String(id));if(!savePlanner()){restorePlanner(before);return {ok:false,notFound:false}}return {ok:true,item}}
function persistPlannerOrRollback(before){if(savePlanner())return true;restorePlanner(before);return false}
function recoverRecentChatDeletions(){
 if(!Array.isArray(planner.removedRecurringDefaults))planner.removedRecurringDefaults=[];
 const messages=Array.isArray(planner.chat)?planner.chat:[];
 for(const def of DEFAULT_RECURRING){
  if(planner.removedRecurringDefaults.includes(def.id))continue;
  let latest=null;
  for(let i=messages.length-1;i>=0;i--){const m=messages[i];if(m?.who!=='assistant')continue;const text=String(m.text||'');if(!text.includes('«'+def.title+'»'))continue;
   const deletion=/^Убрал\s+«/iu.test(text);
   const hasDay=text.includes('из расписания на '+DAY_TO[def.dayIndex]);
   const genericDeletion=deletion&&text.includes('из регулярного расписания');
   if(deletion&&(hasDay||genericDeletion)){latest={kind:'delete',text};break}
   if(/^(?:Добавил|Обновил|Изменил|Перенёс|Перенес|«.*» уже есть)/iu.test(text)){latest={kind:'other',text};break}
  }
  if(latest?.kind==='delete'){
   planner.removedRecurringDefaults.push(def.id);
   planner.recurring=planner.recurring.filter(x=>!matchingDefaultItems(x).some(d=>d.id===def.id));
  }
 }
}
function getState(){let s={};try{s=JSON.parse(read(STATE_KEY)||'{}')||{}}catch(_){s={}};s.tasks=Array.isArray(s.tasks)?s.tasks.filter(Boolean):[];return s}
function saveState(s){return write(STATE_KEY,s)}
function isDone(t){return t&& (t.done===true||t.status==='done')}
function isFixed(t){return t&& (t.type==='fixed'||t.fixed===true)}
function validDate(s){return /^\d{4}-\d{2}-\d{2}$/.test(String(s||'')) && iso(dt(s))===s}
function weekdayOf(d){return dt(d).getDay()}
function recurringForDate(d){const wd=weekdayOf(d);return planner.recurring.filter(x=>x.dayIndex===wd&&x.active!==false)}
function actualFor(d,id,scheduled){const x=planner.actuals[d]&&planner.actuals[d][id];return Number.isFinite(Number(x))?Math.max(5,Math.min(600,Number(x))):scheduled}
function fixedSpend(d){return recurringForDate(d).reduce((sum,x)=>sum+actualFor(d,x.id,x.minutes),0)}
function fixedBuffer(d){return recurringForDate(d).reduce((sum,x)=>sum+(Number(x.bufferAfter)||0),0)}
function mode(d){const m=planner.modes[d];return ['light','normal','heavy','rest'].includes(m)?m:'normal'}
function selfCapacity(d){if(planner.frozen[d]||mode(d)==='rest')return 0;return Math.max(0,MODE_CAP[mode(d)]-fixedSpend(d)-fixedBuffer(d))}
function userTasks(){return getState().tasks.filter(t=>!isFixed(t)&&!t.plan&&!isDone(t))}
function spend(d,tasks=getState().tasks){return tasks.filter(t=>!isFixed(t)&&!t.plan&&!isDone(t)&&t.date===d).reduce((a,t)=>a+(Number(t.minutes)||45),0)}
function priority(t){return t&&t.userAdded?100:(t&&t.type==='hard'?95:(t&&t.type==='soft'?20:50))}
function nextOpenDate(from,minutes=45,tasks=getState().tasks){for(let i=1;i<=90;i++){const d=add(from,i);if(planner.frozen[d]||mode(d)==='rest')continue;if(spend(d,tasks)+minutes<=selfCapacity(d))return d}return null}
function moveTask(t,from,tasks=getState().tasks){const d=nextOpenDate(from,Number(t.minutes)||45,tasks);if(!d)return null;t.date=d;t.replanned=true;return d}
function replan(){const s=getState();let moved=0;const d=today();const candidates=s.tasks.filter(t=>!t.plan&&!isDone(t)&&!isFixed(t)&&t.date<d&&t.type!=='hard').sort((a,b)=>a.date.localeCompare(b.date));candidates.forEach(t=>{if(moveTask(t,d,s.tasks))moved++});const blockedCandidates=s.tasks.filter(t=>!t.plan&&!isDone(t)&&!isFixed(t)&&t.type!=='hard'&&t.date>=d&&(planner.frozen[t.date]||mode(t.date)==='rest')).sort((a,b)=>a.date.localeCompare(b.date));blockedCandidates.forEach(t=>{if(moveTask(t,t.date,s.tasks))moved++});for(let i=0;i<45;i++){const day=add(d,i);if(planner.frozen[day]||mode(day)==='rest')continue;let guard=0;while(spend(day,s.tasks)>selfCapacity(day)&&guard++<100){const cs=s.tasks.filter(t=>!t.plan&&t.date===day&&!isDone(t)&&!isFixed(t)&&t.type!=='hard').sort((a,b)=>priority(a)-priority(b)||Number(b.minutes)-Number(a.minutes));const t=cs[0];if(!t)break;if(!moveTask(t,day,s.tasks))break;moved++}}saveState(s);savePlanner();return moved}
function addUserTask(text,minutes,type='move',date=today(),activity=''){const s=getState();const t={id:'u'+Date.now()+Math.random().toString(16).slice(2),text:String(text),activity:String(activity||''),date,minutes:Math.max(5,Math.min(600,Number(minutes)||45)),type:['move','soft','hard'].includes(type)?type:'move',done:false,plan:false,userAdded:true,createdAt:new Date().toISOString()};s.tasks.push(t);saveState(s);replan();return t}
function addRecurring(title,activity,dayIndex,minutes){const before=copyPlanner();clearDefaultRemoval(String(title).trim(),Number(dayIndex));const item={id:'r'+Date.now()+Math.random().toString(16).slice(2),title:String(title).trim(),activity:String(activity||'').trim(),dayIndex:Number(dayIndex),minutes:Math.max(5,Math.min(600,Number(minutes)||45)),bufferAfter:30,active:true,createdAt:new Date().toISOString()};planner.recurring.push(item);if(!persistPlannerOrRollback(before))return null;return item}
function removeRecurring(query){const q=String(query).toLowerCase().trim();const exact=planner.recurring.filter(x=>x.title.toLowerCase()===q);const matches=exact.length?exact:planner.recurring.filter(x=>x.title.toLowerCase().includes(q));if(!matches.length)return null;if(matches.length>1)return {ambiguous:true,matches:matches.map(x=>`${x.title} — ${DAY_NAMES[x.dayIndex]}`)};const result=deleteRecurringById(matches[0].id);return result.ok?result.item:{saveError:true}}
function updateRecurring(query,dayIndex,minutes,title,activity){const q=String(query).toLowerCase().trim();const exact=planner.recurring.filter(x=>x.title.toLowerCase()===q);const matches=exact.length?exact:planner.recurring.filter(x=>x.title.toLowerCase().includes(q));if(!matches.length)return null;if(matches.length>1)return {ambiguous:true,matches:matches.map(x=>`${x.title} — ${DAY_NAMES[x.dayIndex]}`)};const before=copyPlanner(),x=matches[0];if(title)x.title=title;if(activity!==undefined)x.activity=activity;if(Number.isInteger(dayIndex))x.dayIndex=dayIndex;if(minutes)x.minutes=minutes;if(!persistPlannerOrRollback(before))return {saveError:true};return x}
const DAY_TOKEN_SOURCE='воскресень(?:е|я|ю|ем|и|ям|ями|ях)|понедельник(?:а|у|ом|е|и|ам|ами|ах)?|вторник(?:а|у|ом|е|и|ам|ами|ах)?|сред(?:а|у|ы|е|ой|ою|ам|ами|ах)|четверг(?:а|у|ом|е|и|ам|ами|ах)?|пятниц(?:а|у|ы|е|ей|ею|ам|ами|ах)|суббот(?:а|у|ы|е|ой|ою|ам|ами|ах)|вс|пн|вт|ср|чт|пт|сб';
function normRu(s){return String(s||'').toLocaleLowerCase('ru-RU').replace(/ё/g,'е').replace(/\s+/g,' ').trim()}
function stemMatchWord(word){const w=normRu(word);if(w.length<5)return w;return w.replace(/(?:иями|ями|ами|ями|ого|его|ому|ему|ыми|ими|ую|юю|ая|яя|ое|ее|ые|ие|ый|ий|ой|ого|его|ому|ему|ым|им|ом|ем|ых|их|ами|ями|ать|ять|ить|ыть|ться|ется|утся|ится|ятся|ная|ное|ные|ного|ному|ными|ных|ный|ной|ную|ное|ные|ов|ев|ей|ам|ям|ах|ях|ия|ие|ии|ию|а|я|ы|и|у|ю|е|о)$/u,'')}
function normalizeMatch(s){return normRu(s).replace(/[^\p{L}\p{N}]+/gu,' ').trim().split(/\s+/u).filter(Boolean).map(stemMatchWord).join(' ')}
function findDayMentions(text){
 const re=new RegExp('(^|[^а-яё])('+DAY_TOKEN_SOURCE+')(?=$|[^а-яё])','giu');
 const out=[];let m;
 while((m=re.exec(String(text||'')))){
  const token=normRu(m[2]);let index=null;
  if(/^(?:воскресень|вс)/u.test(token))index=0;
  else if(/^(?:понедельник|пн)/u.test(token))index=1;
  else if(/^(?:вторник|вт)/u.test(token))index=2;
  else if(/^(?:сред|ср)/u.test(token))index=3;
  else if(/^(?:четверг|чт)/u.test(token))index=4;
  else if(/^(?:пятниц|пт)/u.test(token))index=5;
  else if(/^(?:суббот|сб)/u.test(token))index=6;
  if(index!==null){const start=m.index+m[1].length;out.push({index,start,end:start+m[2].length,token:m[2]})}
 }
 return out;
}
function dayIndex(s){const q=normRu(s);const found=findDayMentions(q);return found.length?found[0].index:null}
function parseDurationInfo(text){
 let total=0,found=false;let rest=String(text||'');
 const special=/(полтора\s+час(?:а|ов)?|полторы\s+час(?:а|ов)?|полчаса|час\s+с\s+половиной|час\s+с\s+четвертью)/giu;
 rest=rest.replace(special,(m)=>{found=true;const n=normRu(m);total+=/половиной/u.test(n)?90:/четвертью/u.test(n)?75:/полчаса/u.test(n)?30:90;return ' '.repeat(m.length)});
 const units=/(\d+(?:[.,]\d+)?)\s*(час(?:а|ов)?|ч\.?|мин(?:ут(?:а|ы)?)?\.?)/giu;
 rest=rest.replace(units,(m,num,unit)=>{const n=Number(String(num).replace(',','.'));if(Number.isFinite(n)){found=true;total+=/^ч|^час/u.test(normRu(unit))?n*60:n}return ' '.repeat(m.length)});
 // Bare “час/часа/часов/по часу” is accepted only as a duration phrase, not in a title such as “Час истории”.
 const bare=/(?:^|[^а-яё])(?:на\s+|по\s+|целый\s+)?час(?:а|ов|у)?(?=$|[,!.?])/iu;
 const bm=rest.match(bare);
 if(bm){found=true;total+=60;rest=rest.replace(bare,m=>' '.repeat(m.length))}
 if(!found)return null;
 return {minutes:Math.max(5,Math.min(600,Math.round(total))),explicit:true};
}
function parseDateInfo(text){
 const raw=String(text||'');const low=normRu(raw);const base=today();
 if(/(^|[^а-яё])послезавтра(?=$|[^а-яё])/u.test(low))return {date:add(base,2),kind:'relative'};
 if(/(^|[^а-яё])завтра(?=$|[^а-яё])/u.test(low))return {date:add(base,1),kind:'relative'};
 if(/(^|[^а-яё])сегодня(?=$|[^а-яё])/u.test(low))return {date:base,kind:'relative'};
 let m=raw.match(/(^|[^\d])(20\d{2}-\d{2}-\d{2})(?!\d)/);
 if(m&&validDate(m[2]))return {date:m[2],kind:'absolute'};
 m=raw.match(/(^|[^\d])(\d{1,2})[./](\d{1,2})(?:[./](20\d{2}))?(?!\d)/);
 if(m){const d=String(m[2]).padStart(2,'0'),mo=String(m[3]).padStart(2,'0');let y=m[4]||base.slice(0,4),date=`${y}-${mo}-${d}`;if(!m[4]&&date<base)date=`${Number(y)+1}-${mo}-${d}`;if(validDate(date))return {date,kind:'absolute'};}
 return null;
}
function stripDayText(text){
 const re=new RegExp('(^|[^а-яё])(?:(?:кажд\\w*|по|в|во|на|с|со|из|и)\\s+)?('+DAY_TOKEN_SOURCE+')(?=$|[^а-яё])','giu');
 return String(text||'').replace(re,'$1');
}
function cleanNaturalTitle(text){
 let s=String(text||'');
 s=stripDayText(s);
 s=s.replace(/(^|[^а-яё])(?:20\d{2}-\d{2}-\d{2}|\d{1,2}[./]\d{1,2}(?:[./]20\d{2})?|послезавтра|завтра|сегодня)(?=$|[^а-яё])/giu,'$1');
 s=s.replace(/\d+(?:[.,]\d+)?\s*(?:час(?:а|ов)?|ч\.?|мин(?:ут(?:а|ы)?)?\.?)/giu,' ');
 s=s.replace(/полтора\s+час(?:а|ов)?|полторы\s+час(?:а|ов)?|полчаса|час\s+с\s+половиной|час\s+с\s+четвертью/giu,' ');
 s=s.replace(/(^|[^а-яё])(?:на\s+|по\s+|целый\s+)?час(?:а|ов|у)?(?=$|[,!.?])/giu,'$1');
 s=s.replace(/(^|[^а-яё])(?:добавь|добавить|добавьте|добавьте|внеси|внести|запиши|записать|поставь|поставить|создай|создать|перенеси|перенести|передвинь|перемести|измени|изменить|поменяй|поменять|сделай|удали|убери|отмени|исключи|регулярное|разовое|повторяющееся|занятие|занятия|еженедельно|регулярно|пожалуйста|мне|у меня|мне нужно|на расписание|в расписание|каждую неделю|каждый день|ежедневно)(?=$|[^а-яё])/giu,'$1');
 s=s.replace(/(^|[^а-яё])(?:длительность|длительностью|продолжительность|продолжительностью|время|на|по|в|во|с|со|до)(?=$|[^а-яё])/giu,'$1');
 s=s.replace(/(^|[^0-9])\d{1,2}[:.]\d{2}(?=$|[^0-9])/gu,'$1');
 s=s.replace(/[«»“”"'`]/g,' ').replace(/[,:;.!?]+/g,' ').replace(/\s+/g,' ').trim();
 s=s.replace(/^(?:по|для|про|о)\s+/iu,'');
 s=s.replace(/^(?:моё|мое|мой|моя|мои|новое|новый)\s+/iu,'');
 if(s.length>0)s=s[0].toLocaleUpperCase('ru-RU')+s.slice(1);
 return s;
}
function inferActivity(title){const q=normRu(title);if(/англий|ielts|speaking|english|разговорн/u.test(q))return 'английский / IELTS / speaking';if(/литератур|литерат|чтен|книг/u.test(q))return 'литература / чтения';if(/олимпиад|всош|высшая проба|спбгу|ломоносов|филолог/u.test(q))return 'олимпиадная подготовка / филология';if(/немец/u.test(q))return 'немецкий язык';return 'самостоятельное занятие'}
function findRecurringMatches(query,day=null){
 const q=normalizeMatch(query);if(!q)return [];
 let rows=planner.recurring.filter(x=>day===null||Number(x.dayIndex)===Number(day));
 const exact=rows.filter(x=>normalizeMatch(x.title)===q);
 if(exact.length)return exact;
 // Natural-language aliases such as “английский” must match an existing IELTS/Speaking
 // lesson through its activity as well as its display title; otherwise they create duplicates.
 return rows.filter(x=>{const t=normalizeMatch(x.title),a=normalizeMatch(x.activity||'');return t.includes(q)||q.includes(t)||a.includes(q)||q.split(' ').every(part=>part.length>2&&a.split(' ').includes(part))});
}
function upsertRecurringNatural(title,activity,day,minutes){
 const existing=findRecurringMatches(title,day);
 if(existing.length===1){const before=copyPlanner(),x=existing[0];const changed=Number(x.minutes)!==Number(minutes)||(!x.activity&&activity)||x.active===false;x.minutes=minutes;if(!x.activity)x.activity=activity;if(x.active===false)x.active=true;clearDefaultRemoval(title,day);if(!persistPlannerOrRollback(before))return {saveError:true};return {item:x,kind:changed?'updated':'existing'};}
 if(existing.length>1)return {ambiguous:true,matches:existing.map(x=>`${x.title} — ${DAY_NAMES[x.dayIndex]}`)};
 const x=addRecurring(title,activity,day,minutes);return x?{item:x,kind:'added'}:{saveError:true};
}
function splitFields(s){return String(s).split(',').map(x=>x.trim()).filter(Boolean)}
function describeDay(day){return DAY_NAMES[day]||'неизвестный день'}
function chatReply(input){
 const raw=String(input||'').trim();const low=normRu(raw);
 if(!raw)return 'Напиши, что нужно добавить или изменить. Можно обычной фразой: «Добавь английский по средам на час».';
 let m;
 // Legacy, explicit comma-separated commands remain supported for old users.
 m=raw.match(/(?:добав(?:ь|ить)\s+)(?:регулярное\s+)?занятие\s*:\s*(.+)$/i);
 if(m){const f=splitFields(m[1]);if(f.length<4)return 'Не хватает данных. Можно без шаблона: «Добавь английский по средам на 60 минут».';const d=dayIndex(f[2]);const mins=parseDurationInfo(f[3])?.minutes||Number(f[3]);if(d===null||!mins)return 'Не понял день или длительность. Напиши, например: «английский, среда, 60 минут».';const title=f[0].trim(),activity=f[1].trim();const result=upsertRecurringNatural(title,activity,d,mins);if(result.ambiguous)return `Нашёл несколько похожих занятий: ${result.matches.join('; ')}. Уточни название.`;if(result.saveError)return 'Не удалось сохранить изменение расписания. Ничего не подтверждаю как сохранённое; скачай резервную копию и проверь хранилище.';render();return result.kind==='added'?`Добавил «${title}» — ${describeDay(d)}, ${mins} мин; после занятия оставлен резерв 30 минут.`:result.kind==='updated'?`Обновил «${title}»: ${describeDay(d)}, теперь ${mins} мин.`:`«${title}» уже есть в расписании на ${describeDay(d)} (${mins} мин). Вторую копию не создавал.`}
 m=raw.match(/добав(?:ь|ить)\s+разовое\s+занятие\s*:\s*(.+)$/i);
 if(m){const f=splitFields(m[1]);if(f.length<4)return 'Для разового занятия напиши название, категорию, дату и длительность — либо обычной фразой: «Добавь чтения завтра на 90 минут».';const mins=parseDurationInfo(f[3])?.minutes||Number(f[3]);if(!validDate(f[2])||!mins)return 'Нужна корректная дата ГГГГ-ММ-ДД и длительность.';addUserTask(f[0],mins,'move',f[2],f[1]);render();return `Добавил разовое занятие «${f[0]}» на ${f[2]}, ${mins} мин.`}
 // Daily mode / capacity context messages.
 if(/(?:сегодня|на сегодня).*(?:устал|устала|мало сил|легкий|лёгкий|ничего тяж[её]лого)/iu.test(low)){planner.modes[today()]='light';planner.context.todayNote=raw;savePlanner();replan();render();return 'Понял: сегодня лёгкий режим. Не буду догружать день сверху.'}
 if(/сегодня.*(?:нормальн|обычн)/iu.test(low)){planner.modes[today()]='normal';planner.context.todayNote=raw;savePlanner();replan();render();return 'Поставил обычный режим на сегодня.'}
 if(/сегодня.*(?:могу больше|много сил|насыщенн|тяж[её]л)/iu.test(low)){planner.modes[today()]='heavy';planner.context.todayNote=raw;savePlanner();replan();render();return 'Поставил насыщенный режим на сегодня. Резерв времени всё равно сохранён.'}
 if(/(?:этой|следующей)\s+недел[еи].*(?:много|куча).*?(?:дз|домашн|школь)/iu.test(low)||/много школьного дз|много домашнего задания/iu.test(low)){planner.context.weekNote=raw;planner.context.weekNoteAt=today();savePlanner();render();return 'Учту высокую школьную нагрузку на этой неделе. Она не превратится в дополнительные задачи приложения.'}
 if(/покажи|какое.*расписан|мое расписание|мо[ёе] расписание|что у меня|что.*стоит|какие занятия|сколько занятий|есть ли занятие/iu.test(low)){const queryDays=findDayMentions(raw);return renderRecurringText(queryDays.length?queryDays[0].index:null)}

 const days=findDayMentions(raw);const dur=parseDurationInfo(raw);const dateInfo=parseDateInfo(raw);const clockMention=raw.match(/(?:^|[^\d])((?:[01]?\d|2[0-3]):[0-5]\d)(?!\d)/u)?.[1]||'';const hasClock=!!clockMention;
 // Answer direct questions about the duration of an existing lesson without changing the schedule.
 if(/(?:сколько\s+минут|какая\s+(?:длительность|продолжительность)|сколько\s+длится|сколько\s+времени\s+занимает)/iu.test(low)){
  const queryTitle=cleanNaturalTitle(raw);const day=days.length?days[0].index:null;const matches=findRecurringMatches(queryTitle,day);
  if(matches.length===1)return `«${matches[0].title}» — ${matches[0].minutes} мин${day!==null?' в '+DAY_TO[day]:''}.`;
  if(matches.length>1)return `Нашёл несколько вариантов: ${matches.map(x=>`${x.title} — ${DAY_NAMES[x.dayIndex]}, ${x.minutes} мин`).join('; ')}. Уточни занятие.`;
  return `Не нашёл занятие по запросу «${queryTitle}». Уточни название или день.`;
 }
 // Move a recurring item between weekdays in one sentence.
 if(/(^|[^а-яё])(?:перенеси|перенести|передвинь|перемести)(?=$|[^а-яё])/iu.test(low)&&days.length>=2){
  const title=cleanNaturalTitle(raw);const from=days[0].index,to=days[1].index;const matches=findRecurringMatches(title,from);
  if(matches.length===1){const before=copyPlanner(),x=matches[0];const duplicate=planner.recurring.find(y=>y.id!==x.id&&Number(y.dayIndex)===to&&normalizeMatch(y.title)===normalizeMatch(x.title));if(duplicate)return `«${x.title}» уже есть на ${describeDay(to)}. Ничего не менял, чтобы не создать дубликат.`;x.dayIndex=to;if(!persistPlannerOrRollback(before)){render();return 'Не удалось сохранить перенос занятия. Изменение отменено; проверь хранилище и резервную копию.'}render();return `Перенёс «${x.title}» ${from===3?'со ': 'с '}${DAY_FROM[from]} на ${DAY_TO[to]}. Длительность ${x.minutes} мин сохранена.`}
  if(matches.length>1)return `Нашёл несколько занятий на ${describeDay(from)}: ${matches.map(x=>x.title).join('; ')}. Уточни название.`;
  return `Не нашёл занятие «${title}» на ${describeDay(from)}. Напиши название как в расписании.`;
 }
 // Change an existing recurring lesson's planned duration.
 if(/(^|[^а-яё])(?:измени|изменить|поменяй|поменять|сделай)(?=$|[^а-яё])/iu.test(low)&&/(длительност|продолжительност|времени|минут|час|ч\.?)/iu.test(low)){
  if(!dur)return 'Укажи новую длительность, например: «Сделай английский в среду 75 минут».';
  const title=cleanNaturalTitle(raw);const day=days.length?days[0].index:null;const matches=findRecurringMatches(title,day);
  if(matches.length===1){const before=copyPlanner(),x=matches[0];x.minutes=dur.minutes;if(!persistPlannerOrRollback(before)){render();return 'Не удалось сохранить длительность занятия. Изменение отменено; проверь хранилище и резервную копию.'}render();return `Изменил длительность «${x.title}»${day!==null?' на '+describeDay(day):''}: ${dur.minutes} мин.`}
  if(matches.length>1)return `Есть несколько совпадений: ${matches.map(x=>`${x.title} — ${describeDay(x.dayIndex)}`).join('; ')}. Уточни день.`;
 }
 // Delete a recurring lesson. Day names narrow the match instead of forcing a special command syntax.
 if(/(^|[^а-яё])(?:удали|убери|отмени|исключи|не ставь|не планируй)(?=$|[^а-яё])/iu.test(low)){
  const title=cleanNaturalTitle(raw);const day=days.length?days[0].index:null;const matches=findRecurringMatches(title,day);
  if(matches.length===1){const x=matches[0],result=deleteRecurringById(x.id);if(!result.ok){render();return 'Не удалось сохранить удаление занятия. Я вернул его в интерфейс, чтобы не показывать ложный успех. Проверь доступность хранилища и скачай резервную копию.'}render();return `Убрал «${x.title}»${day!==null?' из расписания на '+DAY_TO[day]: ' из регулярного расписания'}.`}
  if(matches.length>1)return `Нашёл несколько совпадений: ${matches.map(x=>`${x.title} — ${describeDay(x.dayIndex)}`).join('; ')}. Уточни день или название.`;
  return `Не нашёл регулярное занятие по запросу «${title}». Проверь название в блоке «Регулярное расписание».`;
 }

 const dayWordsInRaw=days.length>0;const everyday=/(^|[^а-яё])(?:каждый\s+день|ежедневно)(?=$|[^а-яё])/iu.test(low);
 const recurringIntent=/(?:регулярно|еженедел|кажд\w*\s+(?:понедельник|вторник|сред|четверг|пятниц|суббот|воскрес)|по\s+(?:понедельник|вторник|сред|четверг|пятниц|суббот|воскрес))/iu.test(low);
 const addVerb=/(^|[^а-яё])(?:добавь|добавить|внеси|внести|запиши|записать|поставь|поставить|создай|создать|запланируй|планируй)(?=$|[^а-яё])/iu.test(low);
 const scheduleStatement=/(^|[^а-яё])(?:у\s+меня|я\s+занимаюсь|мне\s+нужно|мне\s+надо)(?=$|[^а-яё])/iu.test(low)||/^\s*(?:по|кажд\w*)\s+/iu.test(low);
 const passiveScheduleStatement=(dayWordsInRaw||everyday||!!dateInfo)&&!/[?？]/u.test(raw)&&!/(?:^|[^а-яё])(?:перенеси|перенести|передвинь|перемести|измени|изменить|поменяй|поменять|сделай|удали|убери|отмени|исключи|покажи|сколько|что|какой|какая|какие|когда|не|нет)(?=$|[^а-яё])/iu.test(low)&&cleanNaturalTitle(raw).length>=3;
 const looksLikeAdd=(addVerb||scheduleStatement||((dayWordsInRaw||everyday)&&(dur||dateInfo))||passiveScheduleStatement)&&!/[?？]\s*$/u.test(raw)&&!/(?:не\s+добав|не\s+надо\s+добав)/iu.test(low);
 if(looksLikeAdd&&(dayWordsInRaw||everyday||dateInfo)){
  const title=cleanNaturalTitle(raw);
  if(!title||title.length<2)return 'Понял, но не смог выделить название занятия. Напиши, например: «Добавь английский по средам на час».';
  if(dateInfo&&!recurringIntent&&!everyday){
   const minutes=dur?dur.minutes:60;const activity=inferActivity(title);const oneOff=addUserTask(title,minutes,'hard',dateInfo.date,activity);const saved=getState().tasks.find(t=>t.id===oneOff.id);const actualDate=saved?.date||dateInfo.date;render();return `Добавил разовое занятие «${title}» на ${actualDate}, ${minutes} мин${actualDate!==dateInfo.date?' (дата скорректирована планировщиком из-за нагрузки)':''}.${dur?'':' Длительность не была указана, поэтому поставил 60 минут.'}${hasClock?' Время начала '+clockMention+' пока не сохраняется: планер учитывает только день и длительность.':''}`;
  }
  const dayList=everyday?[1,2,3,4,5,6,0]:[...new Set(days.map(x=>x.index))];
  const minutes=dur?dur.minutes:60;const activity=inferActivity(title);const answers=[],resultTitles=[];
  for(const day of dayList){const result=upsertRecurringNatural(title,activity,day,minutes);if(result.saveError){answers.push(`не удалось сохранить занятие на ${describeDay(day)}; это изменение не подтверждено`);continue;}if(result.ambiguous){answers.push(`Для «${title}» на ${describeDay(day)} есть неоднозначные совпадения: ${result.matches.join('; ')}.`);continue;}if(result.item?.title)resultTitles.push(result.item.title);if(result.kind==='added')answers.push(`добавил ${DAY_WEEKLY[day]}`);else if(result.kind==='updated')answers.push(`обновил ${DAY_WEEKLY[day]}`);else answers.push(`уже стоит ${DAY_WEEKLY[day]}`)}
  render();const outcome=answers.join('; '),finalTitle=[...new Set(resultTitles)].join(' / ')||title;return `${outcome.charAt(0).toLocaleUpperCase('ru-RU')}${outcome.slice(1)}: «${finalTitle}», ${minutes} мин${dur?'':' (по умолчанию, так как длительность не была указана)'}. После каждого занятия оставлен резерв 30 минут.${hasClock?' Время начала '+clockMention+' пока не сохраняется: планер учитывает только день и длительность.':''}`;
 }
 return 'Я могу понять обычную фразу: «Добавь английский по средам на час», «Перенеси чтения с воскресенья на субботу», «Убери английский в среду», «Сделай литературу в четверг 75 минут» или «Добавь чтения завтра на 90 минут». Можно писать без запятых и специального шаблона.';
}
function renderRecurringText(day=null){const rows=planner.recurring.filter(x=>day===null||Number(x.dayIndex)===Number(day));if(!rows.length)return day===null?'Регулярных занятий пока нет.':`На ${DAY_TO[day]} пока нет регулярных занятий.`;const label=day===null?'Регулярное расписание':`На ${DAY_TO[day]}`;return `${label}:\n`+rows.sort((a,b)=>WEEK.findIndex(d=>d.dayIndex===a.dayIndex)-WEEK.findIndex(d=>d.dayIndex===b.dayIndex)).map(x=>`• ${x.title} — ${x.minutes} мин + ${Number(x.bufferAfter)||30} мин резерв`).join('\n')}
function addChat(who,text){planner.chat.push({who,text,at:new Date().toISOString()});planner.chat=planner.chat.slice(-30);savePlanner()}
function renderChat(){const box=document.getElementById('plannerChatMessages');if(!box)return;box.innerHTML='';planner.chat.forEach(m=>{const el=document.createElement('div');el.className='planner-chat-msg '+(m.who==='user'?'user':'assistant');el.innerHTML='<span>'+esc(m.who==='user'?'Ты':'Планер')+'</span><p>'+esc(m.text).replace(/\n/g,'<br>')+'</p>';box.appendChild(el)});box.scrollTop=box.scrollHeight}
function renderRecurring(){const box=document.getElementById('recurringSchedule');if(!box)return;const byDay=WEEK.map(day=>({name:day.name,i:day.dayIndex,items:planner.recurring.filter(x=>x.dayIndex===day.dayIndex&&x.active!==false)}));box.innerHTML=byDay.map(d=>`<div class="recurring-day"><b>${d.name}</b><div>${d.items.length?d.items.map(x=>`<div class="recurring-item"><span><strong>${esc(x.title)}</strong><small>${esc(x.activity||'')} · ${x.minutes} мин · +30 мин резерв</small></span><button data-remove-rec="${esc(x.id)}" aria-label="Удалить ${esc(x.title)}">×</button></div>`).join(''):'<small class="muted">нет регулярных занятий</small>'}</div></div>`).join('');box.querySelectorAll('[data-remove-rec]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.removeRec;const result=deleteRecurringById(id);render();if(!result.ok&&!result.notFound)alert('Не удалось сохранить удаление занятия. Занятие восстановлено в интерфейсе. Скачай резервную копию и проверь доступность хранилища.')})}
function renderFixed(){const box=document.getElementById('todayFixed');if(!box)return;const d=today(),items=recurringForDate(d);if(!items.length){box.innerHTML='<div class="empty">Сегодня фиксированных занятий нет.</div>';return}box.innerHTML=items.map(x=>{const actual=actualFor(d,x.id,x.minutes);const recorded=!!(planner.actuals[d]&&Object.prototype.hasOwnProperty.call(planner.actuals[d],x.id));return `<div class="fixed-item"><div><b>${esc(x.title)}</b><small>${esc(x.activity||'Фиксированное занятие')} · по плану ${x.minutes} мин · резерв после занятия ${Number(x.bufferAfter)||30} мин</small></div><button class="actual-btn" data-actual="${esc(x.id)}" title="Отметить фактическую длительность. Она обновит расчёт свободного времени." aria-label="${recorded?'Изменить':'Записать'} фактическую длительность занятия ${esc(x.title)}">${recorded?`Факт: ${actual} мин`:'Записать факт'}</button></div>`}).join('');box.querySelectorAll('[data-actual]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.actual;const x=items.find(r=>r.id===id);const current=actualFor(d,id,x.minutes);const value=prompt(`Сколько минут на самом деле длилось занятие «${x.title}»? По плану было ${x.minutes} минут. Значение повлияет на расчёт свободного времени.`,String(current));if(value===null)return;const n=Number(value);if(!Number.isFinite(n)||n<5||n>600){alert('Укажи число от 5 до 600 минут.');return}const before=copyPlanner();planner.actuals[d]=planner.actuals[d]||{};planner.actuals[d][id]=Math.round(n);if(!persistPlannerOrRollback(before)){render();alert('Не удалось сохранить фактическую длительность. Изменение отменено; проверь хранилище и резервную копию.');return}replan();render()})}
function weeklyFacts(){const d=today();const s=getState();let done=0,total=0,mins=0;for(let i=0;i<7;i++){const day=add(d,i);const ts=s.tasks.filter(t=>t.date===day&&!isFixed(t));total+=ts.length;done+=ts.filter(isDone).length;mins+=ts.reduce((a,t)=>a+(Number(t.minutes)||45),0)}const fixed=Array.from({length:7},(_,i)=>fixedSpend(add(d,i))).reduce((a,b)=>a+b,0);return {total,done,mins,fixed}}
function render(){const d=today(),m=mode(d);const modeEl=document.getElementById('dayMode');if(modeEl)modeEl.value=m;const cap=selfCapacity(d),used=spend(d),fixed=fixedSpend(d),buffer=fixedBuffer(d);const sum=document.getElementById('todaySummary');if(sum)sum.innerHTML=`<span>${used} / ${cap} мин</span><i><em style="width:${cap?Math.min(100,Math.round(used/cap*100)):100}%"></em></i><small>${Math.max(0,cap-used)} мин свободно${fixed?' · фиксировано '+fixed+' мин':''}${buffer?' · резерв после занятий '+buffer+' мин':''}</small>`;const td=document.getElementById('todayDate');if(td)td.textContent=dt(d).toLocaleDateString('ru-RU',{day:'numeric',month:'long'});const badge=document.querySelector('.today-badge');if(badge)badge.textContent=planner.frozen[d]?'отдых':MODE_NAME[m];const status=document.getElementById('plannerStatus');if(status){const wf=weeklyFacts();const fact=`Неделя: ${wf.total} самостоятельных задач, ${wf.done} выполнено, ${wf.mins} мин запланировано; фиксированные занятия ${wf.fixed} мин. Это факт, а не недельная норма.`;status.textContent=(planner.context.todayNote?planner.context.todayNote+' · ':'')+(planner.context.weekNote&&planner.context.weekNote!==planner.context.todayNote?planner.context.weekNote+' · ':'')+fact;}const list=document.getElementById('todayTasks');if(list){const s=getState(),ts=s.tasks.filter(t=>t.date===d&&!isDone(t)&&!isFixed(t)&&!t.plan);list.innerHTML=planner.frozen[d]?'<div class="empty">Сегодня отдых. Долга не создаём.</div>':(!ts.length?'<div class="empty">На сегодня нет обязательных задач Via Classica.</div>':ts.map(t=>`<div class="task-item"><button class="task-check" data-done="${esc(t.id)}">○</button><span class="task-main"><b>${esc(t.text)}</b><small>${t.minutes} мин${t.activity?' · '+esc(t.activity):''}${t.replanned?' · перенесено':''}</small></span><button class="task-more" data-more="${esc(t.id)}">⋯</button></div>`).join(''));list.querySelectorAll('[data-done]').forEach(b=>b.onclick=()=>{const s2=getState(),t=s2.tasks.find(x=>x.id===b.dataset.done);if(t){t.done=true;t.completedAt=new Date().toISOString();saveState(s2);replan();render()}});list.querySelectorAll('[data-more]').forEach(b=>b.onclick=()=>{const s2=getState(),t=s2.tasks.find(x=>x.id===b.dataset.more);if(!t)return;const a=prompt('done = выполнено\nskip = перенести\ndelete = удалить','done');if(a==='done')t.done=true;else if(a==='skip')moveTask(t,d);else if(a==='delete')s2.tasks=s2.tasks.filter(x=>x.id!==t.id);saveState(s2);replan();render()})}
renderFixed();renderRecurring();renderChat();
const note=document.getElementById('plannerWeekNote');if(note)note.textContent=planner.context.weekNote||'Школьное ДЗ не заносится в Via Classica. Планер оставляет под него и под отдых свободное место.';
}
function migrate(){
 // Idempotent, non-destructive v13.25/v13.29 -> v14 planner migration.
 // Keep the old key untouched; the app's task/link/check state stays in viaClassicaV2.
 const marker=read(MIGRATION_KEY);
 const legacy=legacyStored.value||{};
 if(!marker){
   if(legacyStored.raw && !read(LEGACY_PKEY+'_pre_v14_backup')){try{localStorage.setItem(LEGACY_PKEY+'_pre_v14_backup',legacyStored.raw)}catch(e){console.warn('Could not duplicate legacy planner backup; original key remains intact')}}
   const mergeObject=(key)=>{const old=legacy[key]&&typeof legacy[key]==='object'&&!Array.isArray(legacy[key])?legacy[key]:{};const current=planner[key]&&typeof planner[key]==='object'&&!Array.isArray(planner[key])?planner[key]:{};planner[key]=Object.assign({},old,current)};
   mergeObject('modes'); mergeObject('frozen'); mergeObject('context');
   {const old=legacy.actuals&&typeof legacy.actuals==='object'?legacy.actuals:{},cur=planner.actuals&&typeof planner.actuals==='object'?planner.actuals:{};planner.actuals={};new Set([...Object.keys(old),...Object.keys(cur)]).forEach(d=>{planner.actuals[d]=Object.assign({},old[d]&&typeof old[d]==='object'?old[d]:{},cur[d]&&typeof cur[d]==='object'?cur[d]:{})})}
   Object.keys(planner.modes).forEach(d=>{if(planner.modes[d]==='vacation')planner.modes[d]='heavy';else if(planner.modes[d]==='festival')planner.modes[d]='light';else if(!['light','normal','heavy','rest'].includes(planner.modes[d]))delete planner.modes[d]});
   {const old=Array.isArray(legacy.recurring)?legacy.recurring:[],cur=Array.isArray(planner.recurring)?planner.recurring:[];const merged=[];old.forEach(x=>merged.push({...x}));cur.forEach(x=>{const idx=merged.findIndex(y=>y.id===x.id||(String(y.title||'').trim().toLowerCase()===String(x.title||'').trim().toLowerCase()&&Number(y.dayIndex)===Number(x.dayIndex)));if(idx<0)merged.push({...x});else merged[idx]={...merged[idx],...x}});planner.recurring=merged}
   if(!Array.isArray(planner.chat)||!planner.chat.length){if(Array.isArray(legacy.chat))planner.chat=legacy.chat.slice(-30)}
   ['school','weekNote','seeded','planVersion','scheduleTitle','scheduleUpdatedAt','scheduleMeta','scheduleEvents'].forEach(k=>{if(planner[k]===undefined&&legacy[k]!==undefined)planner[k]=legacy[k]});
   // Older releases kept scheduled tasks inside viaClassicaV2. Do not delete them.
   // Mark legacy generated tasks as ordinary dated tasks so they remain visible and editable.
   const s=getState();let changed=false;
   s.tasks=s.tasks.map(t=>{if(t&&t.plan===true){changed=true;return {...t,plan:false,legacyPlan:true}}return t});
   const tasksSaved=!changed||saveState(s);
   if(!tasksSaved)console.warn('Could not persist legacy task normalization; original state remains in storage');
   if(tasksSaved){try{localStorage.setItem(MIGRATION_KEY,JSON.stringify({version:14,at:new Date().toISOString(),source:'viaClassicaPlannerV2',tasksPreserved:true}))}catch(e){console.warn('Migration marker not saved; migration is designed to be idempotent')}}
 }
 if(!Array.isArray(planner.recurring))planner.recurring=[];
 if(!Array.isArray(planner.removedRecurringDefaults))planner.removedRecurringDefaults=[];
 // v14.4 persisted the chat's successful delete reply but re-seeded missing defaults on every load.
 // Recover a recent explicit chat deletion once, so upgrading can preserve it instead of resurrecting the lesson.
 recoverRecentChatDeletions();
 DEFAULT_RECURRING.forEach(def=>{
  if(planner.removedRecurringDefaults.includes(def.id))return;
  const exists=planner.recurring.some(x=>x.id===def.id||(normalizeMatch(x.title)===normalizeMatch(def.title)&&Number(x.dayIndex)===def.dayIndex));
  if(!exists)planner.recurring.push({...def});
 });
 planner.school=planner.school||{start:'09:00',end:'15:45',usualHome:'17:30',wake:'06:30',sleepGoal:'23:00',lunch:'около 17:30–18:00',dinner:'около 20:00–20:30',road:'личное время; только короткая лёгкая практика по желанию',schoolHomework:'вне Via Classica'};
 planner.weekNote=planner.weekNote||'Не заполнять всё свободное время. Всегда оставлять резерв и отдых.';
 planner.version=14;savePlanner();
}
function fullBackupPayload(){const local={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('viaClassica')&&k!=='viaClassicaFullBackup_preimport')local[k]=localStorage.getItem(k)}return {format:'via-classica-full-backup-v1',appVersion:14,createdAt:new Date().toISOString(),localStorage:local,sessionStorage:{viaClassicaReturnTask:sessionStorage.getItem('viaClassicaReturnTask')}}}
function downloadJson(filename,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function backupStatus(message,ok=true){const el=document.getElementById('fullBackupStatus');if(el){el.textContent=message;el.className='schedule-status '+(ok?'ok':'bad')}}
function plannerSchedulePayload(){const s=getState();return {format:'via-classica-planner-schedule-v1',appVersion:14,createdAt:new Date().toISOString(),tasks:s.tasks.map(t=>({...t})),planner:{recurring:planner.recurring.map(x=>({...x})),removedRecurringDefaults:Array.isArray(planner.removedRecurringDefaults)?planner.removedRecurringDefaults.slice():[],modes:{...planner.modes},frozen:{...planner.frozen},actuals:JSON.parse(JSON.stringify(planner.actuals||{})),context:{...planner.context},school:planner.school?{...planner.school}:null,weekNote:planner.weekNote||''}}}
function scheduleStatus(message,ok=true){const el=document.getElementById('plannerScheduleStatus');if(el){el.textContent=message;el.className='schedule-status '+(ok?'ok':'bad')}}
function exportPlannerSchedule(){downloadJson('via-classica-planner-schedule-'+today()+'.json',plannerSchedulePayload());scheduleStatus('Расписание скачано. При импорте записи будут объединены, текущие задачи не удаляются.',true)}
async function importPlannerScheduleFile(file){let raw;try{raw=JSON.parse(await file.text())}catch(_){throw new Error('Файл расписания не является корректным JSON.')};const modern=raw&&raw.format==='via-classica-planner-schedule-v1'&&raw.planner&&typeof raw.planner==='object';const legacy=raw&&raw.format==='via-classica-schedule-v1'&&Array.isArray(raw.tasks);if(!modern&&!legacy)throw new Error('Неизвестный формат. Нужен экспорт расписания Via Classica v14 или файл расписания v13.25/v13.29.');const incomingTasks=Array.isArray(raw.tasks)?raw.tasks:[];const clean=[];const ids=new Set();incomingTasks.forEach((t,i)=>{if(!t||typeof t!=='object'||!String(t.text||'').trim()||!validDate(t.date))throw new Error('Задача №'+(i+1)+': нет названия или неверная дата.');const id=String(t.id||('imported-'+Date.now()+'-'+i));if(ids.has(id))throw new Error('В файле повторяется ID '+id+'.');ids.add(id);const type=['move','soft','hard','fixed'].includes(t.type)?t.type:'move';clean.push({...t,id,text:String(t.text).trim(),date:String(t.date),type,fixed:type==='fixed'||t.fixed===true,plan:false,minutes:Math.max(5,Math.min(600,Number(t.minutes)||45)),done:!!t.done})});const oldState=getState(),oldPlanner=JSON.parse(JSON.stringify(planner));const snapshot={format:'via-classica-planner-schedule-safety-v1',at:new Date().toISOString(),state:oldState,planner:oldPlanner};try{localStorage.setItem('viaClassicaPlannerSchedule_preimport',JSON.stringify(snapshot))}catch(e){downloadJson('via-classica-before-schedule-import.json',plannerSchedulePayload());throw new Error('Не удалось сохранить страховочную копию в хранилище. Расписание до импорта скачано; освободи место и повтори.')};if(!confirm('Импорт объединит задачи и настройки из файла с текущим расписанием. Существующие задачи не удаляются. Продолжить?'))return;const nextState=getState();const byId=new Map(nextState.tasks.map(t=>[String(t.id),t]));clean.forEach(t=>byId.set(t.id,t));nextState.tasks=[...byId.values()];const src=modern?raw.planner:{};if(modern){const rec=Array.isArray(src.recurring)?src.recurring:[];rec.forEach(x=>{if(!x||!String(x.title||'').trim()||!Number.isInteger(Number(x.dayIndex))||Number(x.dayIndex)<0||Number(x.dayIndex)>6)return;clearDefaultRemoval(String(x.title).trim(),Number(x.dayIndex));const idx=planner.recurring.findIndex(y=>y.id===x.id||(String(y.title||'').trim().toLowerCase()===String(x.title).trim().toLowerCase()&&Number(y.dayIndex)===Number(x.dayIndex)));if(idx<0)planner.recurring.push({...x});else planner.recurring[idx]={...planner.recurring[idx],...x}});const importedRemoved=Array.isArray(src.removedRecurringDefaults)?src.removedRecurringDefaults.filter(id=>DEFAULT_RECURRING.some(d=>d.id===id)):[];const removedSet=new Set([...(Array.isArray(planner.removedRecurringDefaults)?planner.removedRecurringDefaults:[]),...importedRemoved]);planner.removedRecurringDefaults=[...removedSet];if(removedSet.size)planner.recurring=planner.recurring.filter(x=>!matchingDefaultItems(x).some(d=>removedSet.has(d.id)));planner.modes=Object.assign({},planner.modes,src.modes||{});Object.keys(planner.modes).forEach(d=>{if(planner.modes[d]==='vacation')planner.modes[d]='heavy';else if(planner.modes[d]==='festival')planner.modes[d]='light';else if(!['light','normal','heavy','rest'].includes(planner.modes[d]))delete planner.modes[d]});planner.frozen=Object.assign({},planner.frozen,src.frozen||{});const oldActual=planner.actuals||{},newActual=src.actuals||{};planner.actuals={};new Set([...Object.keys(oldActual),...Object.keys(newActual)]).forEach(d=>planner.actuals[d]=Object.assign({},oldActual[d]||{},newActual[d]||{}));planner.context=Object.assign({},planner.context,src.context||{});if(src.school)planner.school=Object.assign({},planner.school||{},src.school);if(src.weekNote)planner.weekNote=src.weekNote}
 if(!saveState(nextState)||!savePlanner()){planner=oldPlanner;try{localStorage.setItem(STATE_KEY,JSON.stringify(oldState));localStorage.setItem(PKEY,JSON.stringify(oldPlanner))}catch(_){}throw new Error('Не удалось записать импортированное расписание. Прежние данные восстановлены, если хранилище разрешило запись.')};replan();render();scheduleStatus('Расписание импортировано и объединено с текущими задачами.',true)}
async function importFullBackupFile(file){
 let payload;try{payload=JSON.parse(await file.text())}catch(_){throw new Error('Файл не является корректным JSON.')}
 if(!payload||payload.format!=='via-classica-full-backup-v1'||!payload.localStorage||typeof payload.localStorage!=='object'||Array.isArray(payload.localStorage))throw new Error('Это не полная резервная копия Via Classica v1.')
 const incoming=payload.localStorage;
 for(const [k,v] of Object.entries(incoming)){if(!k.startsWith('viaClassica')||k==='viaClassicaFullBackup_preimport'||typeof v!=='string')throw new Error('В копии есть недопустимая запись; данные не изменены.')}
 const current=fullBackupPayload();
 try{localStorage.setItem('viaClassicaFullBackup_preimport',JSON.stringify(current))}catch(e){downloadJson('via-classica-before-restore.json',current);throw new Error('Не удалось сохранить локальную страховочную копию в хранилище. Текущая копия скачана; освободи место и повтори восстановление.')}
 if(!confirm('Восстановление заменит данные Via Classica в этом браузере. Текущие данные сохранены в отдельную страховочную запись. Продолжить?'))return;
 const appKeys=()=>{const out=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('viaClassica')&&k!=='viaClassicaFullBackup_preimport')out.push(k)}return out};
 try{
   appKeys().forEach(k=>localStorage.removeItem(k));
   for(const [k,v] of Object.entries(incoming))localStorage.setItem(k,v);
   const ret=payload.sessionStorage&&payload.sessionStorage.viaClassicaReturnTask;
   if(ret==null)sessionStorage.removeItem('viaClassicaReturnTask');else sessionStorage.setItem('viaClassicaReturnTask',String(ret));
   backupStatus('Копия восстановлена. Страница перезагрузится, чтобы применить все данные.',true);setTimeout(()=>location.reload(),350);
 }catch(e){
   // Roll back to the pre-import snapshot if a write fails partway through.
   try{localStorage.removeItem('viaClassicaFullBackup_preimport');appKeys().forEach(k=>localStorage.removeItem(k));for(const [k,v] of Object.entries(current.localStorage))localStorage.setItem(k,v);try{localStorage.setItem('viaClassicaFullBackup_preimport',JSON.stringify(current))}catch(_){downloadJson('via-classica-before-restore.json',current)}}catch(rollbackError){downloadJson('via-classica-before-restore.json',current);throw new Error('Не удалось завершить восстановление. Скачана копия данных до импорта; проверь её перед дальнейшими действиями. Причина: '+(rollbackError?.message||'неизвестная ошибка'))}
   throw new Error('Импорт не удался; прежние данные восстановлены из страховочной копии. Причина: '+(e?.message||'неизвестная ошибка'));
 }
}
function init(){migrate();document.getElementById('exportFullBackup')?.addEventListener('click',()=>{try{const payload=fullBackupPayload();const count=Object.keys(payload.localStorage).length;const bytes=new Blob([JSON.stringify(payload)]).size;downloadJson('via-classica-full-backup-'+today()+'.json',payload);backupStatus(`Копия подготовлена: ${count} записей, ${Math.max(1,Math.round(bytes/1024))} КБ. Проверь папку «Загрузки».`,true)}catch(e){backupStatus('Не удалось создать копию: '+e.message,false)}});const backupFile=document.getElementById('importFullBackupFile');const chooseBackup=()=>backupFile?.click();document.getElementById('chooseFullBackup')?.addEventListener('click',chooseBackup);const handleBackupFile=async file=>{if(!file)return;if(file.size>25*1024*1024){backupStatus('Файл слишком большой для импорта (лимит 25 МБ). Данные не изменены.',false);return}try{let preview;try{preview=JSON.parse(await file.text())}catch(_){throw new Error('Файл не является корректным JSON. Данные не изменены.')}if(!preview||preview.format!=='via-classica-full-backup-v1'||!preview.localStorage||typeof preview.localStorage!=='object'||Array.isArray(preview.localStorage))throw new Error('Это не полная резервная копия Via Classica. Выбери JSON, созданный командой «Скачать полную копию».');backupStatus(`Файл проверен: ${file.name} · ${Object.keys(preview.localStorage).length} записей. Сейчас появится подтверждение восстановления.`,true);await importFullBackupFile(file)}catch(e){backupStatus(e.message,false)}};backupFile?.addEventListener('change',async()=>{const file=backupFile.files?.[0];await handleBackupFile(file);backupFile.value=''});const drop=document.getElementById('backupDropZone');if(drop){['dragenter','dragover'].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();drop.classList.add('dragover')}));['dragleave','dragend'].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();drop.classList.remove('dragover')}));drop.addEventListener('drop',async e=>{e.preventDefault();drop.classList.remove('dragover');const file=e.dataTransfer?.files?.[0];if(file)await handleBackupFile(file);else backupStatus('Перетащи сюда JSON-файл резервной копии.',false)});drop.addEventListener('click',chooseBackup);drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseBackup()}})}document.getElementById('exportPlannerSchedule')?.addEventListener('click',exportPlannerSchedule);const plannerFile=document.getElementById('importPlannerScheduleFile');document.getElementById('choosePlannerSchedule')?.addEventListener('click',()=>plannerFile?.click());plannerFile?.addEventListener('change',async()=>{const file=plannerFile.files?.[0];if(!file)return;try{await importPlannerScheduleFile(file)}catch(e){scheduleStatus(e.message,false)}finally{plannerFile.value=''}});document.getElementById('dayMode')?.addEventListener('change',e=>{planner.modes[today()]=['light','normal','heavy','rest'].includes(e.target.value)?e.target.value:'normal';savePlanner();replan();render()});document.getElementById('freezeDay')?.addEventListener('click',()=>{planner.frozen[today()]=!planner.frozen[today()];savePlanner();replan();render()});document.getElementById('replanBtn')?.addEventListener('click',()=>{const n=replan();alert(n?`Перераспределено задач: ${n}.`:'Перераспределение не потребовалось.');render()});document.getElementById('taskForm')?.addEventListener('submit',e=>{e.preventDefault();const text=document.getElementById('taskInput')?.value.trim();if(!text)return;const mins=Number(document.getElementById('taskMinutes')?.value)||45;const type=document.getElementById('taskType')?.value||'move';addUserTask(text,mins,type);document.getElementById('taskInput').value='';render()});document.getElementById('plannerChatForm')?.addEventListener('submit',e=>{e.preventDefault();const input=document.getElementById('plannerChatInput');const raw=input?.value.trim();if(!raw)return;addChat('user',raw);const reply=chatReply(raw);addChat('assistant',reply);input.value='';renderChat();render()});document.getElementById('plannerChatClear')?.addEventListener('click',()=>{planner.chat=[];savePlanner();renderChat()});document.querySelectorAll('[data-chat-example]').forEach(btn=>btn.addEventListener('click',()=>{const input=document.getElementById('plannerChatInput');if(input){input.value=btn.dataset.chatExample||'';input.focus()}}));document.getElementById('openPlannerChat')?.addEventListener('click',()=>{document.getElementById('plannerChat')?.scrollIntoView({behavior:'smooth',block:'start'});document.getElementById('plannerChatInput')?.focus()});render()}
init();
})();
