/* Via Classica D1.0 — separately validated diagnostic pilot, no automatic CEFR claims.
 * No diagnostic items are bundled until independent expert review and rights checks.
 * User history in viaClassicaEnglishV1 is never read or modified by this module.
 */
(function(){
 'use strict';
 const KEY='viaClassicaEnglishDiagnosticsV1';
 const POLICY='D1.0';
 const SECTIONS=['Grammar','Vocabulary','Reading','Use of English'];
 const INITIAL_A={Grammar:4,Vocabulary:3,Reading:3,'Use of English':2};
 const INITIAL_B={...INITIAL_A};
 const REPEAT={Grammar:5,Vocabulary:4,Reading:4,'Use of English':3};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const clone=o=>JSON.parse(JSON.stringify(o));
 const blank=()=>({schemaVersion:1,policyVersion:POLICY,attempts:[],activeAttemptId:null,firstCompletedId:null,latestCompletedId:null});
 const $=id=>document.getElementById(id);
 let state=blank(),bank={bankVersion:'unavailable',items:[]},approved=[],issues=[],readiness=null,loading=true;
 let message='';
 try{window.VCGuard?.track(KEY);const raw=localStorage.getItem(KEY);if(raw){const parsed=JSON.parse(raw);if(parsed&&parsed.schemaVersion===1&&Array.isArray(parsed.attempts)){
   state={...blank(),...parsed,attempts:parsed.attempts.filter(x=>x&&typeof x==='object')};
 }else message='Формат сохранённых диагностик неизвестен. Данные не изменены; восстановите совместимую копию.';}}
 catch(e){message='Историю диагностики не удалось прочитать. Она не будет перезаписана до проверки.';state=null;}
 const active=()=>state?.attempts?.find(a=>a.attemptId===state.activeAttemptId&&['in_progress','paused'].includes(a.status));
 const completed=()=>state?.attempts?.filter(a=>a.status==='completed')||[];
 function warn(s){message=s;render();}
 function commit(next){if(!state)return false;const res=window.VCGuard?.commit(KEY,next);if(!res?.ok){message=res?.conflict?'История изменилась в другом окне. Обновите страницу, чтобы не потерять результаты.':'Не удалось сохранить ответ. Данные не изменены. Повторите действие после проверки хранилища.';render();return false;}state=next;readiness=readyStatus();message='';return true;}
 function validItem(x){
  if(!x||typeof x!=='object'||typeof x.itemId!=='string'||!x.itemId.trim()||typeof x.version!=='string'||!x.version||!SECTIONS.includes(x.section))return false;
  if(x.reviewStatus!=='teacher-verified'||typeof x.reviewedAt!=='string'||!/^\d{4}-\d\d-\d\d/.test(x.reviewedAt)||!x.reviewer||typeof x.reviewer!=='string')return false;
  if(x.rightsStatus!=='verified'||!x.source||typeof x.source.name!=='string'||!x.source.name.trim())return false;
  if(typeof x.prompt!=='string'||!x.prompt.trim()||typeof x.explanation!=='string'||!x.explanation.trim())return false;
  if(!Array.isArray(x.options)||x.options.length<2||x.options.length>6||!x.options.every(o=>typeof o==='string'&&o.trim())||new Set(x.options).size!==x.options.length)return false;
  if(!Array.isArray(x.correctAnswers)||x.correctAnswers.length!==1||!x.options.includes(x.correctAnswers[0]))return false;
  if(!['anchor','branch','repeat','reserve'].includes(x.pool)||!Number.isInteger(x.difficulty)||x.difficulty<1||x.difficulty>5)return false;
  if(x.section==='Reading'&&(!x.passageId||!x.passage||typeof x.passage!=='string'||x.passage.length<80))return false;
  return true;
 }
 function reviewBank(data){
  const problems=[];if(!data||!Array.isArray(data.items)||data.schemaVersion!==1){return {items:[],issues:['Некорректный формат диагностического банка.']};}
  const seen=new Set(),items=[];
  for(const x of data.items){if(!validItem(x)){problems.push('Отклонена неполная или непроверенная запись '+String(x?.itemId||'?'));continue;}
   const key=x.itemId+'@'+x.version;
   if(seen.has(x.itemId)){problems.push('Повторяющийся itemId: '+x.itemId);continue;}seen.add(x.itemId);
   if(x.section==='Reading'&&x.passageId&&items.some(y=>y.passageId===x.passageId&&y.passage!==x.passage)){problems.push('Несовпадающие тексты Reading '+x.passageId);continue;}
   items.push(clone(x));
  }
  return {items,issues:problems};
 }
 function byPool(pool,exclude=new Set(),source=approved){return source.filter(i=>i.pool===pool&&!exclude.has(i.itemId));}
 function sectionCounts(items){return Object.fromEntries(SECTIONS.map(s=>[s,items.filter(i=>i.section===s).length]));}
 function readingGroup(items,count,forbiddenPassages=new Set(),difficulty=3){
  const groups=new Map();for(const i of items.filter(x=>x.section==='Reading'&&!forbiddenPassages.has(x.passageId))){if(!groups.has(i.passageId))groups.set(i.passageId,[]);groups.get(i.passageId).push(i);}
  const candidates=[...groups.values()].filter(g=>g.length>=count).sort((a,b)=>Math.abs(a[0].difficulty-difficulty)-Math.abs(b[0].difficulty-difficulty)||a[0].passageId.localeCompare(b[0].passageId));
  return candidates.length?candidates[0].slice(0,count):[];
 }
 function choose(pool,counts,exclude=new Set(),targets={},forbiddenPassages=new Set(),source=approved){
  const out=[];
  for(const s of SECTIONS){const candidates=byPool(pool,exclude,source).filter(i=>i.section===s);
   const n=counts[s],target=targets[s]||3;
   let chosen=[];
   if(s==='Reading')chosen=readingGroup(candidates,n,forbiddenPassages,target);
   else chosen=candidates.sort((a,b)=>Math.abs(a.difficulty-target)-Math.abs(b.difficulty-target)||a.itemId.localeCompare(b.itemId)).slice(0,n);
   if(chosen.length!==n)return null;
   chosen.forEach(x=>{exclude.add(x.itemId);out.push(x)});
  }
  // Interleave sections, while keeping all items of a Reading passage in the same block.
  const buckets=Object.fromEntries(SECTIONS.map(s=>[s,out.filter(i=>i.section===s)]));
  const ordered=[];while(SECTIONS.some(s=>buckets[s].length)){for(const s of SECTIONS)if(buckets[s].length)ordered.push(buckets[s].shift());}
  return ordered;
 }
 function preparedAttemptItems(a){return a.items.map(x=>x.itemId);}
 function priorIds(){return new Set(completed().flatMap(a=>(a.items||[]).map(x=>x.itemId)));}
 function readyStatus(){
  const anchor=choose('anchor',INITIAL_A,new Set());
  if(!anchor)return {initial:false,reason:'Не хватает проверенных опорных заданий во всех четырёх разделах (4/3/3/2).'};
  const ids=new Set(anchor.map(x=>x.itemId));const textIds=new Set(anchor.filter(x=>x.section==='Reading').map(x=>x.passageId));
  const second=choose('branch',INITIAL_B,ids,{},textIds);
  if(!second)return {initial:false,reason:'Не хватает проверенных заданий второго блока или второго независимого текста Reading.'};
  const previous=priorIds();const repeat=choose('repeat',REPEAT,previous);
  return {initial:true,repeat:!!repeat,mode:'pilot',initialCount:anchor.length+second.length,repeatCount:repeat?.length||0};
 }
 // Display order is generated independently for every attempt and item, then frozen
 // in the saved attempt. It never relies on the order of answers in source JSON.
 // This is a usability/assessment-quality measure, not protection against a user
 // deliberately inspecting a client-side key in developer tools.
 function shuffledForAttempt(options, attemptId, itemId){
  const out=options.slice();const seedText=String(attemptId)+'|'+String(itemId)+'|D1.1';
  let seed=2166136261;
  for(let i=0;i<seedText.length;i++){seed^=seedText.charCodeAt(i);seed=Math.imul(seed,16777619);}
  const next=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
  for(let i=out.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
  return out;
 }
 function freezeItem(x,attemptId){return clone({itemId:x.itemId,version:x.version,pool:x.pool,section:x.section,topic:String(x.topic||''),difficulty:x.difficulty,prompt:x.prompt,options:shuffledForAttempt(x.options,attemptId,x.itemId),correctAnswers:x.correctAnswers,explanation:x.explanation,source:x.source,reviewStatus:x.reviewStatus,reviewedAt:x.reviewedAt,passageId:x.passageId||null,passage:x.passage||null});}
 function begin(kind){if(loading||!state)return;const a=active();if(a){warn('Сначала завершите или продолжите уже начатую диагностику.');return;}
  readiness=readyStatus();if(!readiness.initial){warn(readiness.reason);return;}
  if(kind==='repeat'&&!readiness.repeat){warn('Для повторной диагностики пока нет новой проверенной формы из 16 заданий. Старые ответы не повторяются.');return;}
  const isInitial=kind==='initial',exclude=isInitial?new Set():priorIds();
  const selected=choose(isInitial?'anchor':'repeat',isInitial?INITIAL_A:REPEAT,exclude);
  if(!selected){warn('Не удалось сформировать проверенную диагностическую форму.');return;}
  const start=Date.now(),attemptId='diag-'+start+'-'+Math.random().toString(36).slice(2,10);
  const attempt={attemptId,kind,status:'in_progress',startedAt:new Date(start).toISOString(),completedAt:null,formId:kind+'-'+bank.bankVersion,bankVersion:bank.bankVersion,policyVersion:POLICY,items:selected.map(x=>freezeItem(x,attemptId)),branchCandidates:isInitial?approved.filter(x=>x.pool==='branch').map(clone):[],reserveCandidates:isInitial?approved.filter(x=>x.pool==='reserve').map(clone):[],answers:{},step:0,phase:isInitial?1:2,summary:null,limitations:['Не оценивались Listening, Speaking и Writing.','Диагностические вопросы не калиброваны для оценки CEFR.']};
  const next=clone(state);next.attempts.push(attempt);next.activeAttemptId=attemptId;if(commit(next))render();
 }
 function itemAt(a){return a.items[a.step]||null;}
 function correct(item,choice){return item.correctAnswers.includes(choice);}
 function persistAnswer(choice,skip=false){
  const a=active();if(!a||a.status!=='in_progress')return;
  const item=itemAt(a);if(!item||(!skip&&!item.options.includes(choice)))return;
  if(a.answers[item.itemId]){warn('Этот вопрос уже оценён. Повторный ответ не засчитан.');return;}
  const next=clone(state),n=next.attempts.find(x=>x.attemptId===a.attemptId),id=item.itemId;
  n.answers[id]={itemId:id,itemVersion:item.version,selected:skip?null:choice,skipped:!!skip,correct:skip?null:correct(item,choice),answeredAt:new Date().toISOString()};
  n.step+=1;
  if(n.kind==='initial'&&n.step===12&&n.phase===1){
   const targets={};for(const s of SECTIONS){const records=n.items.filter(x=>x.section===s).map(x=>n.answers[x.itemId]).filter(Boolean);
    const hit=records.filter(x=>x.correct===true).length;
    targets[s]=hit===records.length?4:hit===0?2:3;
   }
   const ids=new Set(n.items.map(i=>i.itemId));const passages=new Set(n.items.filter(i=>i.section==='Reading').map(i=>i.passageId));
   const second=choose('branch',INITIAL_B,ids,targets,passages,n.branchCandidates||[]);
   if(!second){warn('Не хватает проверенных вопросов для продолжения. Ответ не был записан: обратитесь к составителю банка.');return;}
   n.items.push(...second.map(x=>freezeItem(x,n.attemptId)));n.phase=2;
  }
  if(n.kind==='initial'&&n.step===24&&!n.extraChecked){
   n.extraChecked=true;
   const extra=[];
   const used=new Set(n.items.map(x=>x.itemId));
   const passages=new Set(n.items.filter(x=>x.section==='Reading').map(x=>x.passageId));
   for(const s of SECTIONS){
    const first=n.items.slice(0,12).filter(x=>x.section===s);
    const second=n.items.slice(12,24).filter(x=>x.section===s);
    const firstHits=first.filter(x=>n.answers[x.itemId]?.correct===true).length;
    const secondHits=second.filter(x=>n.answers[x.itemId]?.correct===true).length;
    // Contradiction in proportions, not proof of a level; add at most one item per section.
    const discrepancy=Math.abs(firstHits/first.length-secondHits/second.length);
    if(discrepancy<0.67)continue;
    const more=choose('reserve',{Grammar:s==='Grammar'?1:0,Vocabulary:s==='Vocabulary'?1:0,Reading:s==='Reading'?1:0,'Use of English':s==='Use of English'?1:0},used,{},passages,n.reserveCandidates||[]);
    if(more?.length){extra.push(...more);if(s==='Reading')more.forEach(x=>passages.add(x.passageId));}
   }
   if(extra.length)n.items.push(...extra.map(x=>freezeItem(x,n.attemptId)));
  }
  if(n.step>=n.items.length){
   n.status='completed';n.completedAt=new Date().toISOString();n.summary=score(n);delete n.branchCandidates;delete n.reserveCandidates;
   next.activeAttemptId=null;if(!next.firstCompletedId)next.firstCompletedId=n.attemptId;next.latestCompletedId=n.attemptId;
  }
  if(commit(next))render();
 }
 function score(a){const sections={};for(const s of SECTIONS){const items=a.items.filter(x=>x.section===s),records=items.map(x=>a.answers[x.itemId]).filter(Boolean);sections[s]={total:items.length,correct:records.filter(x=>x.correct===true).length,skipped:records.filter(x=>x.skipped).length,topicsForReview:[...new Set(items.filter(x=>a.answers[x.itemId]?.correct===false).map(x=>x.topic).filter(Boolean))]};}
  return {sections,statement:'Результаты описывают только письменные навыки. CEFR не определяется.',evidenceStatus:'предварительный учебный пилот',confidenceLabel:'ограниченная',overallCefr:null,limitations:a.limitations};
 }
 function togglePause(){const a=active();if(!a)return;const next=clone(state),n=next.attempts.find(x=>x.attemptId===a.attemptId);n.status=n.status==='paused'?'in_progress':'paused';if(commit(next))render();}
 function showAfter(a){const summary=a.summary||score(a),sections=summary.sections||{};
  return '<div class="diag-result"><h4>Карта навыков · учебная диагностика</h4><p class="diag-notice">Оценка CEFR пока не производится. Проверены только письменные задания; аудирование, устная речь и полноценное письмо не оценивались.</p>'+SECTIONS.map(s=>{const r=sections[s];return '<div class="diag-score"><b>'+esc(s)+'</b><span>'+r.correct+' из '+r.total+(r.skipped?', пропущено: '+r.skipped:'')+'</span></div>'+(r.topicsForReview?.length?'<p class="diag-small">Повторить: '+esc(r.topicsForReview.join(', '))+'</p>':'')}).join('')+
   '<details><summary>Вопросы и объяснения</summary>'+a.items.map(item=>{const r=a.answers[item.itemId];return '<div class="diag-review"><b>'+esc(item.section)+'</b> · '+esc(item.prompt)+'<p>Ваш ответ: '+esc(r?.selected??'пропущено')+'</p><p>Верный ответ: '+esc(item.correctAnswers.join(' / '))+'</p><p>'+esc(item.explanation)+'</p><small>Источник: '+esc(item.source?.name||'не указан')+'</small></div>'}).join('')+'</details></div>';
 }
 function render(){const host=$('diagnosticPanel');if(!host)return;
  if(loading){host.innerHTML='<p>Проверяем доступность диагностических заданий…</p>';return;}
  const latest=state?.attempts?.find(x=>x.attemptId===state.latestCompletedId),a=active(),broken=!state;
  let html='<div class="diag-head"><h3>Диагностика английского</h3><p>Grammar · Vocabulary · Reading · Use of English</p><p class="diag-small">Старт: 24 задания; повторная: 16. Диагностика не определяет общий CEFR и не влияет на тренировочную историю. Повторные формы пока не откалиброваны: проценты разных форм нельзя напрямую сравнивать как изменение уровня.</p></div>';
  if(message)html+='<p class="diag-notice" role="alert">'+esc(message)+'</p>';
  if(issues.length)html+='<p class="diag-small">Отклонены непроверенные или некорректные записи: '+issues.length+'.</p>';
  if(broken){html+='<p class="diag-notice">История недоступна. Не начинайте диагностику до восстановления данных.</p>';host.innerHTML=html;return;}
  if(a){
   const item=itemAt(a),done=Object.keys(a.answers).length;
   html+='<div class="diag-progress">Вопрос '+(a.step+1)+' из '+(a.kind==='initial'?24:16)+' · подтверждённых ответов: '+done+'</div>';
   if(a.status==='paused')html+='<p>Диагностика приостановлена. Ответы сохранены.'+(Date.now()-new Date(a.startedAt).getTime()>7*24*3600000?' Пауза длится больше недели: перед продолжением проверьте, сохраняет ли такая попытка учебный смысл.':'')+'</p><button type="button" class="ghost diag-resume">Продолжить</button>';
   else if(item){html+='<div class="diag-question"><small>'+esc(item.section)+' · '+esc(item.topic||'Диагностика')+'</small>'+(item.passage?'<div class="diag-passage"><b>Прочитайте текст</b><p>'+esc(item.passage)+'</p></div>':'')+'<h4>'+esc(item.prompt)+'</h4><fieldset class="diag-choices"><legend>Выберите один ответ</legend>'+item.options.map((o,i)=>'<label class="diag-choice"><input type="radio" name="diagChoice" value="'+i+'"><span>'+esc(o)+'</span></label>').join('')+'</fieldset><div class="diag-buttons"><button class="primary diag-answer" type="button">Подтвердить ответ</button><button class="ghost diag-skip" type="button">Пропустить</button><button class="ghost diag-pause" type="button">Пауза</button></div></div>'}
  }else{
   if(!readiness?.initial)html+='<p class="diag-notice"><b>Диагностика пока недоступна.</b> '+esc(readiness?.reason||'Не загружен проверенный банк заданий.')+' Тренировочные и внешние материалы не подставляются вместо проверенных вопросов.</p>';
   if(readiness?.initial)html+='<div class="diag-buttons"><button class="primary diag-start" type="button" data-kind="initial">Начать первоначальную диагностику (24)</button>'+(completed().length&&readiness.repeat?'<button class="ghost diag-start" type="button" data-kind="repeat">Повторная диагностика (16)</button>':'')+'</div>';
   if(completed().length&&!readiness?.repeat)html+='<p class="diag-small">Повторная форма станет доступна после добавления новых проверенных заданий.</p>';
   if(latest)html+=showAfter(latest);
   if(completed().length>1)html+='<details><summary>История диагностики · '+completed().length+'</summary>'+completed().map(x=>'<div class="diag-history"><b>'+esc(x.kind==='initial'?'Первичная':'Повторная')+'</b> · '+esc(x.completedAt?.slice(0,10))+' · '+esc(x.attemptId)+'</div>').join('')+'</details>';
  }
  host.innerHTML=html;
  host.querySelectorAll('.diag-start').forEach(b=>b.addEventListener('click',()=>begin(b.dataset.kind)));
  host.querySelector('.diag-pause')?.addEventListener('click',togglePause);
  host.querySelector('.diag-resume')?.addEventListener('click',togglePause);
  host.querySelector('.diag-skip')?.addEventListener('click',()=>persistAnswer(null,true));
  host.querySelector('.diag-answer')?.addEventListener('click',()=>{const sel=host.querySelector('input[name="diagChoice"]:checked');if(!sel){warn('Сначала выберите вариант или нажмите «Пропустить».');return;}
   const item=itemAt(active());persistAnswer(item.options[Number(sel.value)],false)});
 }
 async function load(){loading=true;render();try{const response=await fetch('english-diagnostic-bank-v1.json?v=15.1-d1',{cache:'no-store'});if(!response.ok)throw new Error('HTTP '+response.status);const json=await response.json();const checked=reviewBank(json);bank=json;approved=checked.items;issues=checked.issues;}
  catch(e){bank={bankVersion:'unavailable',items:[]};approved=[];issues=['Банк недоступен: '+String(e?.message||e)];}
  loading=false;readiness=readyStatus();render();}
 function open(){const host=$('diagnosticPanel');if(!host)return;host.hidden=false;render();host.scrollIntoView({behavior:'auto',block:'start'});host.querySelector('h3')?.setAttribute('tabindex','-1');host.querySelector('h3')?.focus({preventScroll:true});}
 document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('[data-english-action="diagnostic"]').forEach(b=>b.addEventListener('click',open));load();});
 // Public diagnostic API exposes read-only metadata and UI actions, not a path for
 // bypassing expert review or injecting scoring data in the shipped application.
 window.VCDiagnostics={open,reloadBank:load,summary:()=>({ready:!!readiness?.initial,repeatReady:!!readiness?.repeat,validatedItems:approved.length,attempts:state?.attempts?.length||0,status:bank.status||'unknown'})};
})();
