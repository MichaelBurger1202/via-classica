(function(){
const PKEY='viaClassicaPlannerV1';
const planner=JSON.parse(localStorage.getItem(PKEY)||'{}');
planner.modes=planner.modes||{}; planner.frozen=planner.frozen||{}; planner.seeded=planner.seeded||false;
const iso=d=>d.toISOString().slice(0,10), today=()=>iso(new Date());
const dt=s=>new Date(s+'T12:00:00'), add=(s,n)=>{let d=dt(s);d.setDate(d.getDate()+n);return iso(d)};
const caps={normal:150,light:90,heavy:210,vacation:240,festival:30};
const modeName={normal:'Обычный день',light:'Лёгкий день',heavy:'Тяжёлый день',vacation:'Каникулы',festival:'Фестиваль / поездка'};
const stateRef=window.__viaState || null;
// Existing app keeps its state in a lexical variable, so we use localStorage directly.
const getState=()=>{let s=JSON.parse(localStorage.getItem('viaClassicaV2')||'{}');s.tasks=s.tasks||[];return s};
const saveState=s=>localStorage.setItem('viaClassicaV2',JSON.stringify(s));
const getTasks=()=>getState().tasks;
const capacity=d=>caps[planner.modes[d]||'normal'];
const isDone=t=>t.done===true||t.status==='done';
const ensureSeed=()=>{
 let s=getState();
 if(!planner.seeded){
  const seed=[
   ['2026-09-14','Проверить регистрацию на «Высшую пробу» по филологии и сохранить подтверждение','hard',30],['2026-09-14','Филология: 45 минут работы + 15 минут разбора ошибок','move',60],['2026-09-14','Литература: 45 минут — одно задание ВСОШ','move',45],['2026-09-14','Английский: 30 минут поддерживающей практики','soft',30],
   ['2026-09-15','Русский: финальная подготовка к школьному этапу ВСОШ','move',60],['2026-09-16','Написать ВСОШ по русскому языку','hard',120],['2026-09-17','Разобрать ошибки после ВСОШ по русскому','move',45],['2026-09-18','Филология: подготовка к «Высшей пробе»','move',60],['2026-09-19','Литература: олимпиадная практика','move',60],['2026-09-20','Проверить регистрацию «Высшей пробы» перед дедлайном','hard',20],['2026-09-21','Закрыть регистрацию «Высшая проба» по филологии','hard',20],['2026-09-22','Филология: тренировочный блок','move',90],['2026-09-23','Филология: теория + разбор ошибок','move',90],['2026-09-24','Лёгкая подготовка перед «Высшей пробой»','move',45],['2026-09-26','Участие в «Высшей пробе» по филологии','hard',120],['2026-09-27','Разбор результата / ошибок после 26 сентября','move',60],['2026-09-28','Участие в «Высшей пробе» по филологии','hard',120],['2026-09-29','Литература: подготовка к ВСОШ 1 октября','move',60],['2026-09-30','Литература: лёгкий повтор перед ВСОШ','move',45],['2026-10-01','Написать ВСОШ по литературе','hard',150],['2026-10-02','Отдых + короткая фиксация ошибок после ВСОШ','soft',20],['2026-10-03','Филология: разбор осеннего блока','move',90],['2026-10-05','Филология: следующий тренировочный блок','move',60],['2026-10-07','Литература: анализ ошибок ВСОШ','move',60],['2026-10-11','Проверить завершение окна «Высшей пробы»','hard',20],['2026-10-12','Собрать итоги сентябрьско-октябрьского олимпиадного цикла','soft',45],['2026-10-15','Обновить список ближайших олимпиад и дедлайнов','soft',30],['2026-10-31','Составить план нагрузки на ноябрь по реальному школьному графику','hard',45],['2026-11-02','Филология: основной тренировочный блок','move',90],['2026-11-07','Литература: олимпиадная практика','move',60],['2026-11-14','Филология: практика','move',90],['2026-11-21','Литература: практика','move',60],['2026-11-30','Составить план нагрузки на декабрь','hard',45],['2026-12-05','Филология: основной блок','move',90],['2026-12-12','Литература: практика','move',60],['2026-12-19','Филология: практика','move',90],['2026-12-27','Подвести итоги осеннего цикла','soft',60],['2026-12-31','Вместе пересмотреть следующие 3 месяца и обновить сайт','hard',60]
  ];
  seed.forEach((x,i)=>s.tasks.push({id:'plan'+i,date:x[0],text:x[1],type:x[2],minutes:x[3],done:false,plan:true}));
  saveState(s);planner.seeded=true;localStorage.setItem(PKEY,JSON.stringify(planner));
 }
};
function spend(s,d){return s.tasks.filter(t=>t.date===d&&!isDone(t)).reduce((a,t)=>a+(Number(t.minutes)||45),0)}
function replan(){
 let s=getState(),d=today(), moved=0;
 s.tasks.filter(t=>!isDone(t)&&t.type!=='hard'&&t.date<d).sort((a,b)=>a.date.localeCompare(b.date)).forEach(t=>{
  for(let i=0;i<21;i++){let nd=add(d,i);if(planner.frozen[nd])continue;if(spend(s,nd)+(Number(t.minutes)||45)<=capacity(nd)){t.date=nd;t.replanned=true;moved++;break}}
 });
 saveState(s); return moved;
}
function render(){
 ensureSeed(); const s=getState(),d=today(),mode=planner.modes[d]||'normal';
 const modeEl=document.getElementById('dayMode'); if(modeEl)modeEl.value=mode;
 const cap=capacity(d), used=spend(s,d); const sum=document.getElementById('todaySummary');
 if(sum)sum.innerHTML='<span>'+used+' / '+cap+' мин</span><i><em style="width:'+Math.min(100,Math.round(used/cap*100))+'%"></em></i><small>'+Math.max(0,cap-used)+' мин свободно</small>';
 const mt=document.getElementById('monthTitle'); if(mt)mt.textContent=dt(d).toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
 const mn=document.getElementById('monthNumber'); if(mn)mn.textContent=String(dt(d).getMonth()+1).padStart(2,'0');
 const badge=document.getElementById('todayBadge'); if(badge)badge.textContent=planner.frozen[d]?'заморожен':modeName[mode];
 const events=document.getElementById('monthEvents'); if(events){const key=d.slice(0,7),map={
  '2026-09':[['16.09','ВСОШ · Русский язык'],['21.09','«Высшая проба» · дедлайн регистрации'],['26.09','«Высшая проба» · филология'],['28.09','«Высшая проба» · филология']],
  '2026-10':[['01.10','ВСОШ · Литература'],['11.10','«Высшая проба» · завершение окна'],['31.10','Ревизия плана на ноябрь']],
  '2026-11':[['30.11','Ревизия плана на декабрь']], '2026-12':[['31.12','Квартальный пересмотр плана']]};
  events.innerHTML=(map[key]||[]).map(e=>'<div class="month-event"><time>'+e[0]+'</time><span>'+e[1]+'</span></div>').join('')||'<div class="empty">Для этого месяца пока нет зафиксированных событий.</div>';
 }
 const box=document.getElementById('alerts');if(box){box.innerHTML='';if(planner.frozen[d])box.innerHTML='<div class="alert ok">💤 Сегодня заморожен. План не создаёт долга.</div>';let overdue=s.tasks.filter(t=>!isDone(t)&&t.type==='hard'&&t.date<d);if(overdue.length)box.innerHTML+='<div class="alert warn">⚠️ Жёстких задач с прошедшим сроком: '+overdue.length+'. Они не переносятся автоматически.</div>'}
 // Override existing task renderer by updating DOM directly.
 const list=document.getElementById('todayTasks'); if(list){let ts=s.tasks.filter(t=>t.date===d&&!isDone(t));list.innerHTML='';if(planner.frozen[d]){list.innerHTML='<div class="empty">День заморожен. Можно отдыхать без долга.</div>'}else if(!ts.length){list.innerHTML='<div class="empty">На сегодня нет незакрытых задач.</div>'}else ts.forEach(t=>{const r=document.createElement('div');r.className='task-item';r.innerHTML='<button class="task-check">○</button><span class="task-main"><b>'+esc(t.text)+'</b><small>'+t.minutes+' мин · '+(t.type==='hard'?'🔴 жёсткая':t.type==='soft'?'🟢 фоновая':'🟡 переносимая')+(t.replanned?' · перенесено':'')+'</small></span><button class="task-more">⋯</button>';r.querySelector('.task-check').onclick=()=>{t.done=true;saveState(s);render()};r.querySelector('.task-more').onclick=()=>{const a=prompt('done = выполнено\n25 / 50 / 75 = частично\nskip = перенести\ndelete = удалить','done');if(a==='done')t.done=true;else if(['25','50','75'].includes(a)){let left=Math.max(15,Math.round(t.minutes*(1-Number(a)/100)/15)*15);t.minutes=left;t.date=add(d,1)}else if(a==='skip'&&t.type!=='hard'){t.date=add(d,1)}else if(a==='delete'){s.tasks=s.tasks.filter(x=>x.id!==t.id)}saveState(s);render()};list.appendChild(r)})}
}
function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
ensureSeed(); replan();
document.getElementById('dayMode').addEventListener('change',e=>{planner.modes[today()]=e.target.value;localStorage.setItem(PKEY,JSON.stringify(planner));render()});
document.getElementById('freezeDay').addEventListener('click',()=>{const d=today();planner.frozen[d]=!planner.frozen[d];localStorage.setItem(PKEY,JSON.stringify(planner));render()});
document.getElementById('freezePeriod').addEventListener('click',()=>{const start=prompt('Дата начала (ГГГГ-ММ-ДД):',today());if(!start)return;const end=prompt('Дата окончания (ГГГГ-ММ-ДД):',start);if(!end)return;let d=start,n=0;while(d<=end&&n<90){planner.frozen[d]=true;d=add(d,1);n++}localStorage.setItem(PKEY,JSON.stringify(planner));alert('Заморожено дней: '+n+'.');render()});
document.getElementById('replanBtn').addEventListener('click',()=>{const n=replan();alert(n?'Перераспределено задач: '+n+'.':'Переносимых просроченных задач нет.');render()});
// Replace the old task form handler with richer version by adding a second listener; stop old handler effects by using a marker.
document.getElementById('taskForm').addEventListener('submit',e=>{e.preventDefault();const s=getState(),text=document.getElementById('taskInput').value.trim();if(!text)return;s.tasks.push({id:'u'+Date.now(),text,date:today(),type:document.getElementById('taskType').value,minutes:Number(document.getElementById('taskMinutes').value)||45,done:false});saveState(s);document.getElementById('taskInput').value='';render()});
render();
})();
