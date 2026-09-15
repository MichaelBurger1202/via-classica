(function(){
  const KEY='viaClassicaEnglishV1';
  const $=s=>document.querySelector(s);
  const esc=s=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const bank=[
    {id:'g1',type:'mcq',skill:'Grammar',topic:'Conditionals → выбор конструкции по смыслу',difficulty:2,context:'университет',q:'If I ___ enough time tomorrow, I’ll join the library tour.',opts:['have','had','would have','having'],a:'have',why:'После if для реального условия в будущем здесь используется Present Simple.',ex:'If I have time, I’ll come.'},
    {id:'g2',type:'mcq',skill:'Grammar',topic:'Conditionals → выбор конструкции по смыслу',difficulty:2,context:'повседневный',q:'If I were you, I ___ the email before sending it.',opts:['check','checked','would check','will check'],a:'would check',why:'Во Second Conditional в главной части используется would + infinitive.',ex:'If I were you, I would wait.'},
    {id:'v1',type:'input',skill:'Vocabulary',topic:'Academic collocations',difficulty:2,context:'университет',q:'Complete naturally: “The article provides strong ___ for the argument.”',a:'evidence',why:'Evidence is the natural academic noun for facts or material supporting an argument.',ex:'The study provides evidence for the claim.'},
    {id:'v2',type:'mcq',skill:'Vocabulary',topic:'Academic collocations',difficulty:2,context:'университет',q:'Which verb most naturally completes: “The seminar will ___ the relationship between myth and ritual”?',opts:['examine','make','do','put'],a:'examine',why:'Examine is the standard academic verb for studying a relationship or issue closely.',ex:'The paper examines the relationship between language and culture.'},
    {id:'r1',type:'reading',skill:'Reading',topic:'Reading → main idea',difficulty:2,context:'академический',q:'Read: “Museums increasingly use digital catalogues not only to preserve records but also to make collections accessible to researchers abroad.” What is the main point?',opts:['Digital catalogues can widen access to museum collections.','Researchers no longer need museums.','Museums are replacing all physical collections.','Digital catalogues are mainly for tourists.'],a:'Digital catalogues can widen access to museum collections.',why:'The sentence links digital catalogues with preservation and wider researcher access.',ex:'Digital tools can make cultural collections available beyond their physical location.'},
    {id:'c1',type:'mcq',skill:'Contextual use',topic:'Register → formal requests',difficulty:2,context:'университет',q:'Which is the most appropriate opening for a formal email to a university office?',opts:['Dear Admissions Team,','Hey guys,','Hi buddy,','Yo,'],a:'Dear Admissions Team,',why:'This is an appropriate neutral-formal opening for a university office.',ex:'Dear Student Services Team,'},
    {id:'l1',type:'mcq',skill:'Listening',topic:'Listening → gist',difficulty:2,context:'аэропорт',q:'A station announcement says a train to Rome is delayed and passengers should wait for platform information. What should passengers do?',opts:['Wait for further platform information.','Board immediately on any platform.','Leave the station.','Buy a new ticket for another city.'],a:'Wait for further platform information.',why:'The key instruction is to wait for updated platform information.',ex:'Please wait for further announcements.'},
    {id:'w1',type:'input',skill:'Writing',topic:'Writing → concise academic sentences',difficulty:3,context:'академический',q:'Write one sentence: explain why primary sources are useful in historical research.',a:'',why:'A strong answer should give a clear reason and connect primary sources with direct evidence from the period.',ex:'Primary sources are useful because they provide direct evidence from the period being studied.'},
    {id:'t1',type:'input',skill:'Translation',topic:'Translation → meaning and register',difficulty:2,context:'университет',q:'Translate naturally: “Я хотел бы уточнить, можно ли перенести встречу.”',a:'I would like to ask whether the meeting can be rescheduled.',why:'This keeps the polite register and the meaning of asking whether the meeting can be moved.',ex:'I would like to check whether the appointment can be rescheduled.'},
    {id:'c2',type:'input',skill:'Contextual use',topic:'Real-life communication',difficulty:3,context:'повседневный',q:'You are in a café. Ask politely whether you can pay by card. Write one sentence.',a:'Can I pay by card?',why:'This is a natural, polite everyday question in this context.',ex:'Can I pay by card, please?'}
  ];
  let st=JSON.parse(localStorage.getItem(KEY)||'null')||{history:[],session:null,dict:[],profile:{cefr:'B2',mastered:[],active:[]}};
  let current=null;
  function save(){localStorage.setItem(KEY,JSON.stringify(st))}
  function nav(page){if(window.showViaPage)window.showViaPage(page);else{document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===page));}}
  function pick(){
    const recent=st.history.slice(-8).map(x=>x.taskId);
    const errors={}; st.history.forEach(x=>{if(!x.correct)errors[x.topic]=(errors[x.topic]||0)+1});
    let candidates=bank.filter(x=>!recent.includes(x.id));
    if(!candidates.length)candidates=bank.slice();
    candidates.sort((a,b)=>(errors[b.topic]||0)-(errors[a.topic]||0));
    const target=candidates[0]||bank[0];
    const recentErr=st.history.filter(x=>x.topic===target.topic&&!x.correct).length;
    const recentGood=st.history.filter(x=>x.topic===target.topic&&x.correct).length;
    return Object.assign({},target,{difficulty:Math.max(1,Math.min(5,target.difficulty+(recentErr>1?1:recentGood>2?1:0)))});
  }
  function start(){st.session={started:Date.now(),n:0,done:[],topic:null};save();renderTask()}
  function renderTask(){
    current=pick(); const box=$('#englishTask'); if(!box)return;
    let body='';
    if(current.type==='mcq'||current.type==='reading') body='<div class="english-options">'+current.opts.map((o,i)=>'<button class="english-option" data-answer="'+esc(o)+'"><span>'+String.fromCharCode(65+i)+'</span>'+esc(o)+'</button>').join('')+'</div>';
    else body='<textarea id="englishAnswer" rows="3" placeholder="Ваш ответ…"></textarea><div class="english-actions"><button class="primary" id="englishCheck">Проверить</button></div>';
    box.innerHTML='<div class="task-meta"><span>'+esc(current.skill)+'</span><span>'+esc(current.topic)+'</span><span>'+esc(current.context)+'</span></div><h3>'+esc(current.q)+'</h3>'+body+'<div id="englishFeedback"></div>';
    if(current.type==='mcq'||current.type==='reading')document.querySelectorAll('.english-option').forEach(b=>b.onclick=()=>check(b.dataset.answer));
    else $('#englishCheck').onclick=()=>check($('#englishAnswer').value.trim());
  }
  function normalize(s){return String(s||'').toLowerCase().trim().replace(/[“”"'.,!?;:()\-]/g,' ').replace(/\s+/g,' ')}
  function check(answer){
    if(!current)return;
    let correct=false;
    if(current.a) correct=normalize(answer)===normalize(current.a);
    else if(current.id==='w1') correct=/\b(primary sources|sources)\b/i.test(answer)&&/\b(evidence|information|direct|period|past|historical)\b/i.test(answer);
    else if(current.id==='t1') correct=/would like|wanted|want/i.test(answer)&&/meeting|appointment/i.test(answer)&&/reschedul|move|change/i.test(answer);
    else if(current.id==='c2') correct=/pay by card|pay with (a )?card/i.test(answer);
    const item={taskId:current.id,topic:current.topic,skill:current.skill,correct,ts:Date.now()}; st.history.push(item);
    st.session.done.push(current.id);st.session.n++;save();
    const fb=$('#englishFeedback');
    if(correct){fb.innerHTML='<div class="feedback good"><b>✓ Верно</b><p>'+esc(current.why)+'</p>'+(current.type==='input'&&current.id!=='w1'&&current.id!=='c2'?'<button class="text-link" id="betterBtn">Как лучше</button>':'')+'</div>'}
    else {fb.innerHTML='<div class="feedback bad"><b>Правильный ориентир</b><p>'+esc(current.a||'Сформулируйте ясное предложение с правильным смыслом и регистром.')+'</p><p>'+esc(current.why)+'</p><button class="text-link" id="whyBtn">Почему?</button></div>'}
    const next='<div class="english-next"><button class="primary" id="nextEnglish">'+(st.session.n>=10?'Завершить тренировку':'Следующее задание →')+'</button></div>';
    fb.insertAdjacentHTML('beforeend',next);$('#nextEnglish').onclick=()=>st.session.n>=10?finish():renderTask();
    if($('#betterBtn'))$('#betterBtn').onclick=()=>alert('Как лучше\n\n'+current.ex);
    if($('#whyBtn'))$('#whyBtn').onclick=()=>alert('Почему?\n\n'+current.why+'\n\nПример: '+current.ex);
  }
  function finish(){
    const last=st.history.slice(-10);const errs={};last.filter(x=>!x.correct).forEach(x=>errs[x.topic]=(errs[x.topic]||0)+1);const top=Object.entries(errs).sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>x[0]);st.profile.active=top;st.session=null;save();
    $('#englishTask').innerHTML='<div class="english-complete"><span>СЕССИЯ ЗАВЕРШЕНА</span><h3>10 заданий готовы.</h3><p>'+ (top.length?'Сейчас стоит немного усилить: '+esc(top.join(' · '))+'.':'Сегодня явной повторяющейся проблемы не видно.')+'</p><div class="english-actions"><button class="primary" id="again10">Ещё 5</button><button class="ghost" id="profileGo">Профиль</button></div></div>';
    $('#again10').onclick=()=>{st.session={started:Date.now(),n:0,done:[],topic:null};save();renderTask()};$('#profileGo').onclick=renderProfile;
  }
  function renderProfile(){
    const box=$('#englishTask');const errs={};st.history.forEach(x=>{if(!x.correct)errs[x.topic]=(errs[x.topic]||0)+1});const top=Object.entries(errs).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);
    box.innerHTML='<div class="english-profile"><span>МОЙ ПРОФИЛЬ</span><h3>'+esc(st.profile.cefr)+' — Upper-Intermediate</h3><p>Профиль строится по всей истории, а не по одному тесту. Сейчас система видит: '+(top.length?'':'устойчивых повторяющихся ошибок пока немного.')+'</p>'+(top.length?'<h4>Сейчас стоит усилить</h4><ul>'+top.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+'<button class="text-link" id="profileMore">Подробнее</button></div>';
    $('#profileMore').onclick=()=>alert('Подробный внутренний профиль пока хранится локально и используется AI для выбора следующих заданий. Здесь не показываются баллы и рейтинги.');
  }
  function renderDictionary(){
    const box=$('#englishTask');
    box.innerHTML='<div class="english-profile"><span>СЛОВАРЬ</span><h3>Личные слова и выражения</h3><p>Первое нажатие на слово в поддерживаемом задании добавляет его сюда. Полная AI-тренировка словаря подключается следующим этапом.</p><div class="dict-empty">'+(st.dict.length?st.dict.map(x=>'<div><b>'+esc(x.unit)+'</b> — '+esc(x.translation||'сохранено')+'</div>').join(''):'Пока нет автоматически добавленных записей.')+'</div></div>';
  }
  function renderTopic(){
    const box=$('#englishTask');
    const topics=['Conditionals → выбор конструкции по смыслу','Academic collocations','Reading → main idea','Register → formal requests','Listening → gist','Translation → meaning and register','Real-life communication'];
    box.innerHTML='<div class="english-profile"><span>ТРЕНИРОВКА ПО ТЕМЕ</span><h3>Выбери тему</h3><input id="topicSearch" class="topic-search" placeholder="Поиск темы…"><div class="topic-list">'+topics.map(t=>'<button class="topic-choice" data-topic="'+esc(t)+'">'+esc(t)+'<span>→</span></button>').join('')+'</div><p class="topic-note">Эта тренировка отдельна от долгосрочного профиля.</p></div>';
    document.querySelectorAll('.topic-choice').forEach(b=>b.onclick=()=>startManual(b.dataset.topic));
    $('#topicSearch').oninput=e=>document.querySelectorAll('.topic-choice').forEach(b=>b.hidden=!b.textContent.toLowerCase().includes(e.target.value.toLowerCase()));
  }
  function startManual(topic){
    let pool=bank.filter(x=>x.topic===topic); if(!pool.length)pool=bank.filter(x=>x.skill===topic); if(!pool.length)pool=bank.slice(); let idx=0;
    const box=$('#englishTask');
    function one(){
      const t=pool[idx%pool.length];
      box.innerHTML='<div class="task-meta"><span>'+esc(t.skill)+'</span><span>'+esc(t.topic)+'</span></div><h3>'+esc(t.q)+'</h3>'+(t.opts?'<div class="english-options">'+t.opts.map((o,i)=>'<button class="english-option" data-a="'+esc(o)+'"><span>'+String.fromCharCode(65+i)+'</span>'+esc(o)+'</button>').join('')+'</div>':'<textarea id="manualAnswer" rows="3" placeholder="Ваш ответ…"></textarea><div class="english-actions"><button class="primary" id="manualCheck">Проверить</button></div>')+'<div class="english-actions"><button class="ghost" id="stopTopic">Остановить тренировку</button></div>';
      document.querySelectorAll('.english-option').forEach(b=>b.onclick=()=>manualCheck(t,b.dataset.a));
      $('#manualCheck')?.addEventListener('click',()=>manualCheck(t,$('#manualAnswer').value.trim()));
      $('#stopTopic').onclick=()=>renderTopic();
    }
    function manualCheck(t,a){
      const ok=t.a?normalize(a)===normalize(t.a):!!a;
      box.insertAdjacentHTML('beforeend','<div class="feedback '+(ok?'good':'bad')+'"><b>'+(ok?'✓ Верно':'Ответ требует доработки')+'</b><p>'+esc(t.why)+'</p></div><div class="english-actions"><button class="primary" id="manualNext">Следующее</button><button class="ghost" id="manualStop">Остановить</button></div>');
      $('#manualNext').onclick=()=>{idx++;one()};$('#manualStop').onclick=()=>renderTopic();
    }
    one();
  }
  function render(){
    const box=$('#englishTask'); if(!box)return;
    if(st.session)renderTask(); else box.innerHTML='<div class="english-start"><span>AI-ТРЕНИРОВКА</span><h3>10 коротких заданий · ~7–10 минут</h3><p>AI выбирает содержание по истории выполнения. Сегодняшняя сессия не переключается вручную между темами.</p><button class="primary" id="startEnglish">Начать тренировку</button><button class="ghost" id="profileEnglish">Мой профиль</button></div>';
    $('#startEnglish')?.addEventListener('click',start);$('#profileEnglish')?.addEventListener('click',renderProfile);
  }
  window.showEnglishTraining=()=>{nav('english');render()};
  window.showEnglishProfile=()=>{nav('english');renderProfile()};
  window.showEnglishDictionary=()=>{nav('english');renderDictionary()};
  window.initEnglish=render;
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('[data-english-action]').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.englishAction;if(a==='train')showEnglishTraining();if(a==='profile')showEnglishProfile();if(a==='dict')showEnglishDictionary();}));
    render();
  });
})();
