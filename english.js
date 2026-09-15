(function(){
  const KEY='viaClassicaEnglishV1';
  const $=s=>document.querySelector(s);
  const esc=s=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const bank=[
    {id:'g1',type:'mcq',skill:'Grammar',topic:'Conditionals',difficulty:2,context:'университет',q:'If I ___ enough time tomorrow, I’ll join the library tour.',opts:['have','had','would have','having'],a:'have',why:'После if для реального условия в будущем здесь используется Present Simple.',ex:'If I have time, I’ll come.'},
    {id:'g2',type:'mcq',skill:'Grammar',topic:'Conditionals',difficulty:2,context:'повседневный',q:'If I were you, I ___ the email before sending it.',opts:['check','checked','would check','will check'],a:'would check',why:'Во Second Conditional в главной части используется would + infinitive.',ex:'If I were you, I would wait.'},
    {id:'v1',type:'input',skill:'Vocabulary',topic:'Academic collocations',difficulty:2,context:'университет',q:'Complete naturally: “The article provides strong ___ for the argument.”',a:'evidence',why:'Evidence is the natural academic noun for facts or material supporting an argument.',ex:'The study provides evidence for the claim.'},
    {id:'v2',type:'mcq',skill:'Vocabulary',topic:'Academic collocations',difficulty:2,context:'университет',q:'Which verb most naturally completes: “The seminar will ___ the relationship between myth and ritual”?',opts:['examine','make','do','put'],a:'examine',why:'Examine is the standard academic verb for studying a relationship or issue closely.',ex:'The paper examines the relationship between language and culture.'},
    {id:'r1',type:'reading',skill:'Reading',topic:'Reading: main idea',difficulty:2,context:'академический',q:'Read: “Museums increasingly use digital catalogues not only to preserve records but also to make collections accessible to researchers abroad.” What is the main point?',opts:['Digital catalogues can widen access to museum collections.','Researchers no longer need museums.','Museums are replacing all physical collections.','Digital catalogues are mainly for tourists.'],a:'Digital catalogues can widen access to museum collections.',why:'The sentence links digital catalogues with preservation and wider researcher access.',ex:'Digital tools can make cultural collections available beyond their physical location.'},
    {id:'c1',type:'mcq',skill:'Contextual use',topic:'Register: formal requests',difficulty:2,context:'университет',q:'Which is the most appropriate opening for a formal email to a university office?',opts:['Dear Admissions Team,','Hey guys,','Hi buddy,','Yo,'],a:'Dear Admissions Team,',why:'This is an appropriate neutral-formal opening for a university office.',ex:'Dear Student Services Team,'},
    {id:'l1',type:'mcq',skill:'Listening',topic:'Listening: gist',difficulty:2,context:'аэропорт',q:'A station announcement says a train to Rome is delayed and passengers should wait for platform information. What should passengers do?',opts:['Wait for further platform information.','Board immediately on any platform.','Leave the station.','Buy a new ticket for another city.'],a:'Wait for further platform information.',why:'The key instruction is to wait for updated platform information.',ex:'Please wait for further announcements.'},
    {id:'w1',type:'input',skill:'Writing',topic:'Writing: concise academic sentences',difficulty:3,context:'академический',q:'Write one sentence: explain why primary sources are useful in historical research.',a:'',why:'A strong answer should give a clear reason and connect primary sources with direct evidence from the period being studied.',ex:'Primary sources are useful because they provide direct evidence from the period being studied.'},
    {id:'t1',type:'input',skill:'Translation',topic:'Translation: meaning and register',difficulty:2,context:'университет',q:'Translate naturally: “Я хотел бы уточнить, можно ли перенести встречу.”',a:'I would like to ask whether the meeting can be rescheduled.',why:'This keeps the polite register and the meaning of asking whether the meeting can be moved.',ex:'I would like to check whether the appointment can be rescheduled.'},
    {id:'c2',type:'input',skill:'Contextual use',topic:'Real-life communication',difficulty:3,context:'повседневный',q:'You are in a café. Ask politely whether you can pay by card. Write one sentence.',a:'Can I pay by card?',why:'This is a natural, polite everyday question in this context.',ex:'Can I pay by card, please?'}
  ];

  const DEFAULT_STATE={history:[],session:null,dict:[],profile:{cefr:null,mastered:[],active:[]}};
  let st;
  try { st=JSON.parse(localStorage.getItem(KEY)||'null')||DEFAULT_STATE; } catch(e) { st=DEFAULT_STATE; localStorage.removeItem(KEY); }
  if(!st || typeof st!=='object') st=DEFAULT_STATE;
  if(!Array.isArray(st.history)) st.history=[];
  if(!Array.isArray(st.dict)) st.dict=[];
  if(!st.profile || typeof st.profile!=='object') st.profile={cefr:null,mastered:[],active:[]};
  if(!Array.isArray(st.profile.mastered)) st.profile.mastered=[];
  if(!Array.isArray(st.profile.active)) st.profile.active=[];
  if(st.session && (typeof st.session!=='object' || !Number.isFinite(st.session.n) || !Number.isFinite(st.session.total) || st.session.n<0 || st.session.total<1 || st.session.n>=st.session.total)) st.session=null;
  let current=null, mode='ai', manual=null;
  function save(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){console.warn('Via Classica English storage error',e)}}
  const DICT = {
    'if':{ru:'если',en:'used to introduce a condition'},'enough':{ru:'достаточно',en:'as much or as many as needed'},'time':{ru:'время',en:'a period during which something happens'},'tomorrow':{ru:'завтра',en:'the day after today'},'join':{ru:'присоединиться; участвовать',en:'to become a member of a group or take part in an activity'},'library':{ru:'библиотека',en:'a place where books and other resources are available for study'},'tour':{ru:'экскурсия',en:'a journey around a place to see and learn about it'},
    'have':{ru:'иметь; располагать',en:'to possess, own, or experience something'},'would':{ru:'бы; вспомогательный глагол',en:'a modal verb used in several conditional and polite constructions'},'check':{ru:'проверять',en:'to examine something to make sure it is correct or satisfactory'},'email':{ru:'электронное письмо',en:'a message sent electronically'},'before':{ru:'до; перед',en:'earlier than a particular time or event'},'sending':{ru:'отправка; отправлением',en:'the act of causing something to be sent'},
    'evidence':{ru:'доказательства; подтверждающие сведения',en:'facts or information showing that something is true'},'argument':{ru:'аргумент; довод',en:'a reason or set of reasons supporting an idea'},'article':{ru:'статья',en:'a piece of writing published in a newspaper, journal, or other publication'},'provide':{ru:'предоставлять',en:'to give or make something available'},'strong':{ru:'убедительный; сильный',en:'having a powerful effect or providing strong support'},'seminar':{ru:'семинар',en:'a class or meeting for discussion and study'},'examine':{ru:'исследовать; подробно рассматривать',en:'to look at or study something carefully'},
    'relationship':{ru:'связь; взаимоотношение',en:'the way in which two or more things are connected'},'myth':{ru:'миф',en:'a traditional story, often involving gods or heroes'},'ritual':{ru:'ритуал; обряд',en:'a set of actions performed regularly, especially as part of a tradition'},'museum':{ru:'музей',en:'a place where objects of artistic, cultural, or historical interest are displayed'},'museums':{ru:'музеи',en:'plural of museum'},'increasingly':{ru:'всё чаще; в возрастающей степени',en:'more and more as time passes'},'digital':{ru:'цифровой',en:'relating to information represented electronically'},'catalogues':{ru:'каталоги',en:'organized lists or collections of items'},'preserve':{ru:'сохранять',en:'to keep something in its original or existing condition'},
    'records':{ru:'записи; сведения',en:'stored information about something'},'accessible':{ru:'доступный',en:'easy to reach, use, or obtain'},'researchers':{ru:'исследователи',en:'people who carry out systematic investigation'},'abroad':{ru:'за рубежом',en:'in or to a foreign country'},'main':{ru:'основной',en:'most important or central'},'point':{ru:'смысл; основная мысль',en:'the main idea or purpose of something'},'collections':{ru:'коллекции',en:'groups of objects collected and kept together'},'formal':{ru:'официальный; формальный',en:'following established conventions rather than being informal'},
    'request':{ru:'запрос; просьба',en:'an act of asking for something'},'appropriate':{ru:'уместный; подходящий',en:'suitable or correct for a particular situation'},'opening':{ru:'начало; вступительная фраза',en:'the first part of something, such as a letter'},'university':{ru:'университет',en:'an institution of higher education'},'office':{ru:'отдел; учреждение',en:'a department or place where administrative work is done'},'station':{ru:'станция; вокзал',en:'a place where trains or other public transport stop'},'announcement':{ru:'объявление',en:'a public or formal statement giving information'},'announcements':{ru:'объявления',en:'plural of announcement'},
    'train':{ru:'поезд',en:'a series of connected railway vehicles'},'delayed':{ru:'задержанный; задерживается',en:'made to happen later than planned'},'passengers':{ru:'пассажиры',en:'people travelling in a vehicle or on public transport'},'wait':{ru:'ждать',en:'to stay where you are until something happens'},'further':{ru:'дальнейший',en:'additional or more distant'},'platform':{ru:'платформа',en:'the raised area beside railway tracks where passengers board trains'},'information':{ru:'информация',en:'facts or details about something'},'primary':{ru:'первичный; первоисточниковый',en:'original or first-hand rather than derived from another source'},
    'sources':{ru:'источники',en:'places, documents, or people from which information comes'},'useful':{ru:'полезный',en:'helpful or practical'},'historical':{ru:'исторический',en:'relating to history or past events'},'research':{ru:'исследование',en:'careful study undertaken to discover or establish facts'},'direct':{ru:'прямой; непосредственный',en:'not indirect; coming from the original source'},'period':{ru:'период',en:'a length or section of time'},'studied':{ru:'изучаемый; изученный',en:'examined or learned about carefully'},
    'translate':{ru:'переводить',en:'to express the meaning of words in another language'},'naturally':{ru:'естественно',en:'in a way that is normal or fluent'},'wanted':{ru:'хотел',en:'past form of want: wished or desired something'},'meeting':{ru:'встреча',en:'an occasion when people come together'},'rescheduled':{ru:'перенесённый; перенести',en:'arranged for a different time'},'café':{ru:'кафе',en:'a small restaurant or place serving drinks and light meals'},'pay':{ru:'платить',en:'to give money in exchange for something'},'card':{ru:'карта',en:'a small plastic or electronic payment card'},'please':{ru:'пожалуйста',en:'used to make a request more polite'},'context':{ru:'контекст',en:'the situation or surrounding words that help explain meaning'},'language':{ru:'язык',en:'a system of communication using words and rules'},'culture':{ru:'культура',en:'the ideas, customs, and social practices of a group'},'study':{ru:'изучать; исследовать',en:'to learn about or examine something carefully'},'claim':{ru:'утверждение',en:'a statement that something is true'},'paper':{ru:'научная работа; статья',en:'an academic written work'},'academic':{ru:'академический',en:'relating to education, study, or scholarship'},'sentence':{ru:'предложение',en:'a group of words forming a complete grammatical statement'},'because':{ru:'потому что',en:'for the reason that'},'reason':{ru:'причина; основание',en:'a cause, explanation, or justification'},'past':{ru:'прошлое; прошедший',en:'the time before the present'}
  };
  const WORD_RE=/[A-Za-z]+(?:['’][A-Za-z]+)?/g;
  function dayKey(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function dictInfo(word){
    const key=word.toLowerCase().replace(/[’]/g,"'");
    const x=DICT[key];
    return x || {ru:'Перевод уточняется в контексте',en:'Definition will be refined from context'};
  }
  function isSavedToday(word){return (st.dict||[]).some(x=>x.key===word.toLowerCase()&&x.lastClickedDay===dayKey())}
  function wordHtml(text, sentence){
    return esc(text).replace(WORD_RE, m=>{
      const key=m.toLowerCase();
      const disabled=isSavedToday(key)?' is-saved-today':'';
      return '<button type="button" class="dict-word'+disabled+'" data-dict-word="'+esc(key)+'" data-dict-original="'+esc(m)+'" data-dict-sentence="'+esc(sentence||text)+'">'+esc(m)+'</button>';
    });
  }
  function saveWord(word, sentence){
    const key=word.toLowerCase(); const today=dayKey(); const info=dictInfo(key);
    st.dict=st.dict||[];
    let item=st.dict.find(x=>x.key===key);
    if(!item){item={key,unit:word,translation:info.ru,definition:info.en,firstContext:sentence||'',addedAt:Date.now(),lastClickedDay:today,status:'new',clicks:1,reviewCount:0};st.dict.unshift(item)}
    else {item.lastClickedDay=today;item.clicks=(item.clicks||0)+1;if(!item.firstContext)item.firstContext=sentence||'';if(!item.definition)item.definition=info.en;if(!item.translation)item.translation=info.ru;}
    save(); return item;
  }
  function showWordPopup(btn){
    const word=btn.dataset.dictWord, original=btn.dataset.dictOriginal, sentence=btn.dataset.dictSentence||'';
    const item=saveWord(word,sentence);
    document.querySelectorAll('.dict-word-popover').forEach(x=>x.remove());
    const pop=document.createElement('div');pop.className='dict-word-popover';
    pop.innerHTML='<div class="dict-pop-head"><b>'+esc(original)+'</b><button type="button" class="dict-pop-close" aria-label="Закрыть">×</button></div><div class="dict-pop-translation">'+esc(item.translation)+'</div><div class="dict-pop-definition">'+esc(item.definition)+'</div><div class="dict-pop-context">'+esc(sentence)+'</div><div class="dict-pop-note">Добавлено в личный словарь</div>';
    const host=btn.closest('.english-question,.english-option')||btn.parentElement; host.style.position='relative';host.appendChild(pop);
    pop.querySelector('.dict-pop-close').onclick=()=>pop.remove();
    btn.classList.add('is-saved-today');
  }
  function wireDictionaryWords(root){
    (root||document).querySelectorAll('.dict-word:not(.is-saved-today)').forEach(b=>{b.onclick=e=>{e.stopPropagation();showWordPopup(b)}});
  }
  function pick(){
    const recent=st.history.slice(-8).map(x=>x.taskId), errors={};
    st.history.forEach(x=>{if(!x.correct)errors[x.topic]=(errors[x.topic]||0)+1});
    let candidates=bank.filter(x=>!recent.includes(x.id)); if(!candidates.length)candidates=bank.slice();
    candidates.sort((a,b)=>(errors[b.topic]||0)-(errors[a.topic]||0));
    const target=candidates[0]||bank[0];
    if(!target) throw new Error('English task bank is empty');
    const recentErr=st.history.filter(x=>x.topic===target.topic&&!x.correct).length;
    const recentGood=st.history.filter(x=>x.topic===target.topic&&x.correct).length;
    return Object.assign({},target,{difficulty:Math.max(1,Math.min(5,target.difficulty+(recentErr>1?1:recentGood>2?1:0))),_retried:false});
  }

  function ensureOverlay(){
    let overlay=$('#englishFullscreen');
    if(!overlay){
      overlay=document.createElement('div');
      overlay.id='englishFullscreen';
      overlay.className='english-fullscreen';
      overlay.innerHTML='<div class="english-fullscreen-top"><div class="english-progress-wrap"><div class="english-progress-label" id="englishProgressText">Задание 1 из 10</div><div class="english-progress-track"><i id="englishProgressBar"></i></div></div><button class="english-close" id="englishClose" aria-label="Закрыть тренировку">×</button></div><main class="english-fullscreen-content" id="englishFullscreenContent"></main>';
      document.body.appendChild(overlay);
      $('#englishClose').onclick=()=>closeTraining();
    }
    return overlay;
  }
  function openTraining(){ensureOverlay().classList.add('open');document.body.classList.add('english-lock');}
  function closeTraining(){
    const overlay=$('#englishFullscreen'); if(overlay)overlay.classList.remove('open');
    document.body.classList.remove('english-lock');
    current=null; manual=null; st.session=null; save();
    if(mode==='manual')renderTopic(); else render();
  }
  function setProgress(done,total){
    const label=$('#englishProgressText'),bar=$('#englishProgressBar');
    if(!label||!bar)return;
    if(total){label.textContent='Задание '+Math.min(done+1,total)+' из '+total;bar.style.width=Math.min(100,(done/total)*100)+'%';}
    else {label.textContent='Задание '+(done+1);bar.style.width='0%';}
  }

  function start(total=10){mode='ai';st.session={started:Date.now(),n:0,total,done:[],topic:null};save();openTraining();renderTask();}

  function taskMarkup(t, retry=false){
    const isChoice=t.type==='mcq'||t.type==='reading';
    const body=isChoice
      ? '<div class="english-options">'+t.opts.map((o,i)=>'<div class="english-option" role="button" tabindex="0" data-answer="'+esc(o)+'"><span>'+String.fromCharCode(65+i)+'</span><b>'+wordHtml(o,t.q)+'</b></div>').join('')+'</div>'
      : '<textarea id="englishAnswer" rows="3" placeholder="'+(retry?'Попробуй ещё раз…':'Твой ответ…')+'"></textarea>';
    return (retry?'<div class="english-retry-label">Попробуй ещё раз</div>':'')+body+'<div class="english-answer-bar"><button class="primary" id="englishCheck" disabled>Проверить ответ</button><button class="ghost english-stop" id="englishStop">Остановить</button></div><div id="englishFeedback"></div>';
  }

  function renderTask(){
    if(!st.session || st.session.n>=st.session.total){ finish(); return; }
    current=pick();
    const box=$('#englishFullscreenContent'); if(!box)return;
    setProgress(st.session.n,st.session.total);
    const title='<div class="english-task-heading"><small>AI-ТРЕНИРОВКА</small></div>';
    const meta='<div class="task-meta"><span>'+esc(current.skill)+'</span><span>'+esc(current.context)+'</span></div>';
    box.innerHTML=title+meta+'<h1 class="english-question">'+wordHtml(current.q,current.q)+'</h1>'+taskMarkup(current,false);
    wireAnswer(); wireDictionaryWords(box);
  }

  function renderManualTask(retry=false){
    if(!manual || !Array.isArray(manual.pool) || !manual.pool.length) { renderTopic(); return; }
    const t=manual.pool[manual.idx%manual.pool.length]; current=t;
    const box=$('#englishFullscreenContent'); if(!box)return;
    const label=$('#englishProgressText'),bar=$('#englishProgressBar'); if(label)label.textContent='Задание '+(manual.done+1)+' · до остановки'; if(bar)bar.style.width='0%';
    const header='<div class="english-task-heading"><small>ТРЕНИРОВКА ПО ТЕМЕ</small><h2>'+esc(manual.topic)+'</h2></div>';
    const meta='<div class="task-meta"><span>'+esc(t.skill)+'</span><span>'+esc(t.context)+'</span></div>';
    box.innerHTML=header+meta+'<h1 class="english-question">'+wordHtml(t.q,t.q)+'</h1>'+taskMarkup(t,retry);
    wireAnswer(true); wireDictionaryWords(box);
  }

  function wireAnswer(){
    const isChoice=current.type==='mcq'||current.type==='reading';
    let selected='';
    if(isChoice){
      document.querySelectorAll('.english-option').forEach(b=>{
        b.onclick=e=>{ if(e.target.closest('.dict-word')) return; document.querySelectorAll('.english-option').forEach(x=>x.classList.remove('selected')); b.classList.add('selected'); selected=b.dataset.answer; const check=$('#englishCheck'); if(check)check.disabled=false; };
        b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();b.click();}};
      });
    } else {
      const input=$('#englishAnswer');
      if(input)input.oninput=e=>{const check=$('#englishCheck');if(check)check.disabled=!e.target.value.trim()};
    }
    $('#englishCheck').onclick=()=>check(isChoice?selected:$('#englishAnswer').value.trim());
    $('#englishStop').onclick=()=>closeTraining();
  }

  function normalize(s){return String(s||'').toLowerCase().trim().replace(/[“”"'.,!?;:()\-]/g,' ').replace(/\s+/g,' ')}
  function evaluate(task,answer){
    if(task.a) return normalize(answer)===normalize(task.a);
    if(task.id==='w1') return /\b(primary sources|sources)\b/i.test(answer)&&/\b(evidence|information|direct|period|past|historical)\b/i.test(answer);
    if(task.id==='t1') return /would like|wanted|want|could i/i.test(answer)&&/meeting|appointment/i.test(answer)&&/reschedul|move|change/i.test(answer);
    if(task.id==='c2') return /pay by card|pay with (a )?card/i.test(answer);
    return !!answer;
  }

  function record(correct){
    st.history.push({taskId:current.id,topic:current.topic,skill:current.skill,correct,ts:Date.now()});
    if(mode==='ai'){st.session.done.push(current.id);st.session.n++}
    save();
  }

  function feedbackHtml(correct,firstTry){
    if(correct){
      return '<div class="feedback good"><div class="feedback-title">✓ Верно</div><button class="feedback-link" id="whyBtn">Почему?</button></div>';
    }
    if(firstTry){
      return '<div class="feedback retry"><div class="feedback-title">Не совсем.</div><p>Попробуй исправить ответ ещё раз.</p><button class="secondary-action" id="retryBtn">Попробовать ещё</button></div>';
    }
    return '<div class="feedback bad"><div class="feedback-title">Не совсем.</div><p><b>Правильный ответ:</b> '+esc(current.a||current.ex)+'</p><button class="feedback-link" id="whyBtn">Почему?</button></div>';
  }

  function wireWhy(){
    $('#whyBtn')?.addEventListener('click',()=>toggleExplain('why'));
    $('#betterBtn')?.addEventListener('click',()=>toggleExplain('better'));
  }
  function toggleExplain(kind){
    const existing=$('#englishExplain'); if(existing){existing.remove();return}
    const text=kind==='better'?'Более естественный вариант: '+current.ex+'\n\nНюанс: этот вариант звучит естественно в данном контексте.':'Почему подходит: '+current.why+'\n\nПример: '+current.ex;
    const el=document.createElement('div');el.id='englishExplain';el.className='explain-box';
    el.innerHTML='<b>'+(kind==='better'?'Как лучше':'Почему?')+'</b>'+text.split('\n\n').map(p=>'<p>'+esc(p)+'</p>').join('');
    $('#englishFeedback').appendChild(el);
  }

  function check(answer){
    if(!current||!answer||($('#englishCheck')&&$('#englishCheck').disabled))return;
    const correct=evaluate(current,answer),fb=$('#englishFeedback');
    if(correct){record(true);fb.innerHTML=feedbackHtml(true,false);wireWhy();appendNext();return}
    if(!current._retried){current._retried=true;fb.innerHTML=feedbackHtml(false,true);$('#englishCheck').disabled=true;$('#retryBtn').onclick=()=>mode==='manual'?renderManualTask(true):renderRetry();return}
    record(false);fb.innerHTML=feedbackHtml(false,false);wireWhy();appendNext();
  }

  function renderRetry(){
    const box=$('#englishFullscreenContent');
    const title='<div class="english-task-heading"><small>AI-ТРЕНИРОВКА</small></div>';
    const meta='<div class="task-meta"><span>'+esc(current.skill)+'</span><span>'+esc(current.context)+'</span></div>';
    box.innerHTML=title+meta+'<h1 class="english-question">'+wordHtml(current.q,current.q)+'</h1>'+taskMarkup(current,true);
    wireAnswer(); wireDictionaryWords(box);
    setProgress(st.session.n,st.session.total);
  }

  function appendNext(){
    if(!$('#englishFeedback')) return;
    const wrap=document.createElement('div');wrap.className='english-next';
    const isDone=mode==='ai'&&st.session.n>=st.session.total;
    wrap.innerHTML='<button class="primary" id="nextEnglish">'+(isDone?'Завершить тренировку':'Дальше →')+'</button>';
    $('#englishFeedback').appendChild(wrap);
    $('#nextEnglish').onclick=()=>isDone?finish():mode==='ai'?renderTask():manualNext();
    if(mode==='ai')setProgress(st.session.n,st.session.total);
  }

  function finish(){
    const total=st.session?.total||10,last=st.history.slice(-total),errs={};
    last.filter(x=>!x.correct).forEach(x=>errs[x.topic]=(errs[x.topic]||0)+1);
    const top=Object.entries(errs).sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>x[0]);
    st.profile.active=top; if(!st.profile.cefr) st.profile.cefr='B2'; st.session=null;save();
    const box=$('#englishFullscreenContent');
    const bar=$('#englishProgressBar'); if(bar)bar.style.width='100%';
    const label=$('#englishProgressText'); if(label)label.textContent=total+' из '+total;
    box.innerHTML='<div class="english-complete"><span>СЕССИЯ ЗАВЕРШЕНА</span><h1>'+total+' заданий пройдено.</h1><p>'+(top.length?'Сейчас стоит немного усилить: '+esc(top.join(' · '))+'.':'Сегодня явной повторяющейся проблемы не видно.')+'</p><div class="english-actions"><button class="primary" id="again5">Ещё 5</button><button class="ghost" id="profileGo">Профиль</button></div></div>';
    $('#again5').onclick=()=>start(5);
    $('#profileGo').onclick=()=>{closeTraining();renderProfile()};
  }

  function renderProfile(){
    nav('english');const box=$('#englishTask'),errs={};
    st.history.forEach(x=>{if(!x.correct)errs[x.topic]=(errs[x.topic]||0)+1});
    const top=Object.entries(errs).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);
    box.innerHTML='<div class="english-profile"><span>МОЙ ПРОФИЛЬ</span><h3>'+(st.profile.cefr?esc(st.profile.cefr)+' — Upper-Intermediate':'Профиль формируется')+'</h3><p>Предварительная оценка; по мере накопления истории профиль будет уточняться.</p>'+(top.length?'<h4>Сейчас стоит усилить</h4><ul>'+top.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p>Устойчивых повторяющихся ошибок пока немного.</p>')+'<button class="text-link" id="profileMore">Подробнее</button></div>';
    $('#profileMore').onclick=()=>{const el=document.createElement('div');el.className='explain-box';el.innerHTML='<b>Подробнее</b><p>В полноценной версии здесь появится расширенная картина по Grammar, Vocabulary, Reading, Listening, Writing и contextual use. Сейчас профиль хранится локально.</p>';box.appendChild(el)};
  }

  function renderDictionary(){
    nav('english'); const box=$('#englishTask'); const list=st.dict||[];
    const cards=list.map((x,i)=>'<article class="dict-card"><div class="dict-card-head"><b>'+esc(x.unit)+'</b><span class="dict-status">'+esc(x.status==='mastered'?'освоено':x.status==='familiar'?'знакомо, требует практики':'новое')+'</span></div><strong>'+esc(x.translation||'—')+'</strong><div class="dict-definition">'+esc(x.definition||'')+'</div><p>'+esc(x.firstContext||'Контекст пока не сохранён.')+'</p><div class="dict-card-actions"><button type="button" class="text-link dict-delete" data-dict-index="'+i+'">Удалить</button></div></article>').join('');
    box.innerHTML='<div class="english-profile dictionary-page"><span>СЛОВАРЬ</span><h3>Личные слова и выражения</h3><p>Нажми слово в английском задании — оно сразу попадёт сюда. Словарь сохраняется на этом устройстве.</p><div class="dict-add"><input id="dictManualWord" class="topic-search" placeholder="Добавить слово или фразу…"><button class="primary" id="dictManualAdd">Добавить</button></div><div class="dict-toolbar"><input id="dictSearch" class="topic-search" placeholder="Поиск в словаре…"><select id="dictFilter"><option value="newest">Сначала новые</option><option value="alpha">По алфавиту</option><option value="new">Новые</option><option value="familiar">Требуют практики</option><option value="mastered">Освоено</option></select></div><div id="dictList">'+(cards||'<div class="dict-empty">Пока нет записей. Нажми на любое английское слово в задании.</div>')+'</div></div>';
    const renderFiltered=()=>{
      const q=($('#dictSearch')?.value||'').trim().toLowerCase(), f=$('#dictFilter')?.value||'newest';
      let arr=(st.dict||[]).filter(x=>!q || x.unit.toLowerCase().includes(q) || (x.translation||'').toLowerCase().includes(q));
      if(f==='alpha')arr.sort((a,b)=>a.unit.localeCompare(b.unit)); else if(f!=='newest')arr=arr.filter(x=>x.status===f);
      else arr.sort((a,b)=>(b.addedAt||0)-(a.addedAt||0));
      $('#dictList').innerHTML=arr.length?arr.map(x=>'<article class="dict-card"><div class="dict-card-head"><b>'+esc(x.unit)+'</b><span class="dict-status">'+esc(x.status==='mastered'?'освоено':x.status==='familiar'?'знакомо, требует практики':'новое')+'</span></div><strong>'+esc(x.translation||'—')+'</strong><div class="dict-definition">'+esc(x.definition||'')+'</div><p>'+esc(x.firstContext||'Контекст пока не сохранён.')+'</p></article>').join(''):'<div class="dict-empty">Ничего не найдено.</div>';
    };
    $('#dictSearch').oninput=renderFiltered; $('#dictFilter').onchange=renderFiltered;
    $('#dictManualAdd').onclick=()=>{const v=$('#dictManualWord').value.trim(); if(!v)return; const item=saveWord(v,v); item.unit=v; item.firstContext='Добавлено вручную'; item.lastClickedDay=null; item.status='new'; save(); renderDictionary();};
    box.querySelectorAll('.dict-delete').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.dictIndex); if(st.dict[i]){st.dict.splice(i,1);save();renderDictionary();}});
  }
  function renderTopic(){
    nav('english');const box=$('#englishTask');
    const topics=['Conditionals','Academic collocations','Reading: main idea','Register: formal requests','Listening: gist','Writing: concise academic sentences','Translation: meaning and register','Real-life communication'];
    box.innerHTML='<div class="english-profile topic-picker"><span>ТРЕНИРОВКА ПО ТЕМЕ</span><h3>Выбери тему</h3><input id="topicSearch" class="topic-search" placeholder="Поиск темы…"><div class="topic-list">'+topics.map(t=>'<button class="topic-choice" data-topic="'+esc(t)+'">'+esc(t)+'<span>→</span></button>').join('')+'</div><p class="topic-note">Эта тренировка отдельна от долгосрочного профиля.</p></div>';
    document.querySelectorAll('.topic-choice').forEach(b=>b.onclick=()=>startManual(b.dataset.topic));
    $('#topicSearch').oninput=e=>document.querySelectorAll('.topic-choice').forEach(b=>b.hidden=!b.textContent.toLowerCase().includes(e.target.value.toLowerCase()));
  }
  function startManual(topic){
    mode='manual';manual={topic,pool:bank.filter(x=>x.topic===topic),idx:0,done:0};
    if(!manual.pool.length)manual.pool=bank.filter(x=>x.skill===topic);
    if(!manual.pool.length)manual.pool=bank.slice();
    openTraining();renderManualTask(false);
  }
  function manualNext(){manual.done++;manual.idx++;renderManualTask(false)}

  function render(){
    const box=$('#englishTask');
    if(st.session)box.innerHTML='<div class="english-start"><span>AI-ТРЕНИРОВКА</span><h3>Продолжить сессию</h3><p>Сессия уже начата.</p><button class="primary" id="startEnglish">Продолжить</button></div>';
    else box.innerHTML='<div class="english-start"><span>AI-ТРЕНИРОВКА</span><h3>10 коротких заданий · ~7–10 минут</h3><p>Система выбирает содержание по истории выполнения. Внутри одной сессии тему вручную не переключаем.</p><button class="primary" id="startEnglish">Начать тренировку</button><button class="ghost" id="profileEnglish">Мой профиль</button></div>';
    $('#startEnglish')?.addEventListener('click',()=>st.session? (mode='ai',openTraining(),renderTask()):start(10));
    $('#profileEnglish')?.addEventListener('click',renderProfile);
  }

  window.showEnglishTraining=()=>{mode='ai';nav('english');render()};
  window.showEnglishProfile=()=>{nav('english');renderProfile()};
  window.showEnglishDictionary=()=>{nav('english');renderDictionary()};
  window.showEnglishTopic=()=>{mode='manual';renderTopic()};
  window.initEnglish=render;
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('[data-english-action]').forEach(b=>b.addEventListener('click',()=>{
      const a=b.dataset.englishAction;
      if(a==='train')showEnglishTraining();
      if(a==='topic')showEnglishTopic();
      if(a==='profile')showEnglishProfile();
      if(a==='dict')showEnglishDictionary();
    }));
    // Rendering the English module must not change the current page.
    // Navigation happens only through an explicit English action.
    const englishPage=document.querySelector('#english');
    if(englishPage && englishPage.classList.contains('active')) render();
  });
})();
