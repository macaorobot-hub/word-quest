
const raw=[
["job","工作","💼","job"],
["dentist","牙醫","🦷","den·tist"],
["firefighter","消防員","🧑‍🚒","fire·fight·er"],
["nurse","護士","🧑‍⚕️","nurse"],
["photographer","攝影師","📸","pho·tog·ra·pher"],
["pilot","飛機師","🧑‍✈️","pi·lot"],
["police officer","警察","👮","po·lice / of·fi·cer"],
["teacher","老師","🧑‍🏫","teach·er"],
["designer","設計師","🎨","de·sign·er"],
["vet","獸醫","🐕","vet"],
["coach","教練","🏅","coach"],
["uniform","制服","👔","u·ni·form"],
["airport","機場","✈️","air·port"],
["office","辦公室","🏢","of·fice"],
["clinic","診所","🏥","clin·ic"],
["fire station","消防局","🚒","fire / sta·tion"],
["put out fires","撲滅火災","🧯","put / out / fires"],
["teach others","教導他人","📚","teach / oth·ers"],
["take care of","照顧","🤝","take / care / of"],
["hard-working","勤力的","💪","hard-work·ing"],
["patient","有耐心的","😌","pa·tient"],
["describe","描述","📝","de·scribe"],
["different","不同的","🔶","dif·fer·ent"],
["favourite","最喜愛的","❤️","fa·vour·ite"],
["interview","訪問；面試","🎙️","in·ter·view"],
["carefully","小心地","🔍","care·ful·ly"],
["creatively","有創意地","💡","cre·a·tive·ly"],
["seriously","認真地","🧐","se·ri·ous·ly"],
["together","一起","👫","to·geth·er"],
["YouTuber","YouTube 影片創作者","📹","You·Tu·ber"],
["civil servant","公務員","🏛️","civ·il / serv·ant"],
["film director","電影導演","🎬","film / di·rec·tor"],
["actor","演員","🎭","ac·tor"],
["flight attendant","空中服務員","🛫","flight / at·tend·ant"],
["training","訓練","🏋️","train·ing"],
["duty","職責","📋","du·ty"],
["skills","技能","🛠️","skills"],
["responsible","負責任的","✅","re·spon·si·ble"],
["equipment","設備","🧰","e·quip·ment"],
["animation","動畫","🎞️","an·i·ma·tion"],
["society","社會","🌍","so·ci·e·ty"]
];
const words=raw.map((r,i)=>({en:r[0],zh:r[1],pic:r[2],sy:r[3],id:i}));
const el=document.getElementById('game');
const sh=a=>{a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
let mode='choice',group='core',count='10',queue=[],index=0,score=0,streak=0,miss=[],picked=[],tiles=[],opts=[],locked=false,wrongHere=false,feedback='',hint=false,stage='menu';
let savedWrong=[];
try {savedWrong=JSON.parse(localStorage.getItem('word-quest-wrong')||'[]').filter(id=>Number.isInteger(id)&&id>=0&&id<41)} catch(e){}
function saveWrong(){try{localStorage.setItem('word-quest-wrong',JSON.stringify(savedWrong))}catch(e){}}
let totalStars=0;
try{totalStars=Number(localStorage.getItem('jobs-stars')||0)}catch(e){}
function pool(){return group==='core'?words.slice(0,29):group==='read'?words.slice(29):words}
function speak(s){try{if(!window.speechSynthesis){feedback='此介面暫未支援語音播放。';render();return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(s);u.lang='en-GB';u.rate=.78;u.onerror=(event)=>{if(event.error==='interrupted'||event.error==='canceled')return;if(stage==='play'){feedback='語音未能播放，仍可繼續遊戲。';render()}};speechSynthesis.speak(u)}catch(e){feedback='此介面暫未支援語音播放。';render()}}
function menu(){pokeRound=null;if(window.speechSynthesis)speechSynthesis.cancel();stage='menu';el.innerHTML=`<div class="stats"><span class="tag">UNIT 1</span><span class="tag">⭐ ${totalStars} 星</span></div><div class="picture">🏙️</div><h1>職業大冒險</h1><div class="sub">WORD QUEST · ALL KINDS OF JOBS</div>${pokemonMenuHTML()}<label class="label" for="group">選擇生字範圍</label><select id="group"><option value="core">重點生字（29 個）</option><option value="read">認讀生字（12 個）</option><option value="all">全部生字（41 個）</option></select><label class="label" for="count">每次挑戰題數</label><select id="count"><option value="10">10 題快速挑戰</option><option value="20">20 題進階挑戰</option><option value="all">全部生字</option></select><div class="menu"><button class="gold" data-mode="choice">🖼️ 看圖選字<small>圖片及中文提示，揀出正確英文</small></button><button data-mode="spell">🔤 拼字大挑戰<small>觸碰字母，串出正確單詞</small></button><button data-mode="listen">🔊 聽音辨字<small>聽英文發音，選擇正確單詞</small></button><button class="secondary" data-mode="study">📖 生字學習室<small>全部生字、中文解釋、音節及讀音</small></button><button class="secondary" id="saved-retry" ${savedWrong.length?'':'disabled'}>🔁 錯題重練（${savedWrong.length} 個）<small>重新答對後，從錯題簿移除</small></button></div><p class="sub">學習紀錄只存於此裝置，不需登入。</p>`;el.querySelector('#saved-retry').onclick=()=>{mode='spell';group='all';start(words.filter(w=>savedWrong.includes(w.id)))};
bindPokemonMenu();el.querySelector('#group').value=group;el.querySelector('#count').value=count;el.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{group=el.querySelector('#group').value;count=el.querySelector('#count').value;mode=b.dataset.mode;start()})}
function start(retry,pokemonChallenge=false){pokeRound=pokemonChallenge?{id:crypto.randomUUID(),completed:0,reward:null}:null;queue=retry?[...retry]:mode==='study'?pool():sh(pool()).slice(0,count==='all'?pool().length:Number(count));index=0;score=0;streak=0;miss=[];stage='play';prepare()}
function prepare(){picked=[];locked=false;wrongHere=false;feedback='';hint=false;const w=queue[index];tiles=sh(w.en.replace(/[^a-z]/gi,'').toLowerCase().split(''));const others=sh(pool().filter(x=>x.id!==w.id));opts=sh([w,...others.slice(0,3)]);render()}
function markWrong(){wrongHere=true;streak=0;if(!savedWrong.includes(queue[index].id)){savedWrong.push(queue[index].id);saveWrong()}if(!miss.some(x=>x.id===queue[index].id))miss.push(queue[index])}
function win(){if(locked)return;if(pokeRound)pokeRound.completed++;if(!wrongHere){savedWrong=savedWrong.filter(id=>id!==queue[index].id);saveWrong()}locked=true;score+=wrongHere?5:10;streak++;totalStars++;try{localStorage.setItem('jobs-stars',totalStars)}catch(e){}feedback='🎉 Excellent! 答啱喇！';render()}
function next(){if(window.speechSynthesis)speechSynthesis.cancel();if(index+1>=queue.length){finish();return}index++;prepare()}
function render(){const w=queue[index];if(!w)return;let body='';if(mode==='study'){body=`<div class="picture">${w.pic}</div><h2>${w.en}</h2><div style="font-size:19px">${w.zh}</div><div class="syllable" style="margin:15px 0">${w.sy}</div><button class="gold" id="audio">🔊 英式英文發音</button><div class="controls" style="margin-top:20px"><button class="secondary" id="prev" ${index===0?'disabled':''}>上一個</button><button id="next">${index+1===queue.length?'完成':'下一個'}</button></div>`}else{
body=`<div class="sub">${mode==='spell'?'點擊字母，串出英文':mode==='listen'?'聽一聽，揀正確英文':'睇提示，揀正確英文'}</div>${mode==='listen'?`<div class="picture">🎧</div><button class="gold" id="audio">🔊 播放單詞</button>`:`<div class="picture">${w.pic}</div><h2>${w.zh}</h2>`}`;
if(mode==='spell'){let pos=0;body+=`<div class="slots">${w.en.split(' ').map(part=>`<div class="wordslots">${[...part].map(c=>{if(c==='-')return '<span style="align-self:center">-</span>';let j=pos++;return `<button class="slot" data-slot="${j}" ${locked?'disabled':''}>${picked[j]===undefined?'':tiles[picked[j]]}</button>`}).join('')}</div>`).join('')}</div><div class="letters">${tiles.map((c,i)=>`<button data-tile="${i}" ${picked.includes(i)||locked?'disabled':''}>${c}</button>`).join('')}</div><div class="controls"><button class="secondary" id="undo" ${locked?'disabled':''}>⌫ 退回</button><button class="secondary" id="clear" ${locked?'disabled':''}>重拼</button><button class="secondary" id="hint" ${locked?'disabled':''}>💡 音節提示</button></div>`}
else{body+=`<div class="answers">${opts.map(o=>`<button data-answer="${o.id}" ${locked?'disabled':''} class="${locked&&o.id===w.id?'correct':''}">${o.en}</button>`).join('')}</div>`}
if(hint)body+=`<div class="syllable" style="margin-top:12px">${w.sy}</div>`;
body+=`<div class="feedback" role="status" aria-live="polite">${feedback}${locked?`<br><b>${w.en}</b> · ${w.zh}<br><span class="sub">${w.sy}</span>`:''}</div>${locked?`<div class="controls"><button class="secondary" id="audio">🔊 聽發音</button><button class="gold" id="next">下一題</button></div>`:''}`;
}
el.innerHTML=`<div class="stats"><button class="secondary" id="home" style="padding:5px 12px;min-height:32px">⌂ 主頁</button><span class="tag">⭐ ${score} 分</span><span class="tag">🔥 ${streak} 連中</span></div>${pokeRound?'<p class="quest-tag">🔴 寶可夢挑戰 · 拼對 2 題解鎖新夥伴</p>':''}<div class="sub">第 ${index+1} / ${queue.length} ${mode==='study'?'個生字':'題'}</div><div class="bar"><i style="width:${(index+(locked?1:0))/queue.length*100}%"></i></div>${body}`;
const bind=(id,fn)=>{const b=el.querySelector('#'+id);if(b)b.onclick=fn};bind('home',menu);bind('audio',()=>speak(w.en));bind('next',next);bind('prev',()=>{index--;prepare()});bind('undo',()=>{picked.pop();feedback='';render()});bind('clear',()=>{picked=[];feedback='';render()});bind('hint',()=>{hint=true;markWrong();render()});
el.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{if(locked)return;if(Number(b.dataset.answer)===w.id)win();else{markWrong();feedback='再試一次！';b.classList.add('wrong');b.disabled=true;el.querySelector('.feedback').textContent=feedback}});
el.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{picked.splice(Number(b.dataset.slot),1);feedback='';render()});
el.querySelectorAll('[data-tile]').forEach(b=>b.onclick=()=>{if(locked||picked.length>=tiles.length||picked.includes(Number(b.dataset.tile)))return;picked.push(Number(b.dataset.tile));if(picked.length===tiles.length){if(picked.map(i=>tiles[i]).join('')===w.en.replace(/[^a-z]/gi,'').toLowerCase())win();else{markWrong();feedback='差少少！可以退回或重新拼字。';render()}}else{feedback='';render()}})
}
function finish(){if(pokeRound){finishPokemon();return;}stage='finish';el.innerHTML=`<div class="picture">🏆</div><h1>${mode==='study'?'學習完成！':'挑戰完成！'}</h1>${mode==='study'?'':`<div style="font-size:48px;color:#ffdc7d;font-weight:800">${score} / ${queue.length*10}</div><p>首次答對 ${queue.length-miss.length} / ${queue.length} 題</p>`}<p>⭐ 累積星星：${totalStars}</p>${miss.length?`<div class="review"><b>需要加強嘅生字</b>${miss.map(w=>`<div><b>${w.en}</b> · ${w.zh}<br><small>${w.sy}</small></div>`).join('')}</div><button class="gold start" id="retry">🔁 專攻錯題（${miss.length} 題）</button>`:''}<button class="secondary start" id="home">返回遊戲主頁</button>`;el.querySelector('#home').onclick=menu;const b=el.querySelector('#retry');if(b)b.onclick=()=>start([...miss])}
menu();

if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
