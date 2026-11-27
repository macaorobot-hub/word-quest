/* Collection stays on this browser. Data and art: PokéAPI. */
const COLLECTION_KEY = 'word-quest-pokemon-v1';
let pokeRound = null;
let awardingPokemon = false;
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function readCollection() {
  const value = JSON.parse(localStorage.getItem(COLLECTION_KEY) || '[]');
  if (!Array.isArray(value)) throw Error('collection');
  const ids = new Set();
  return value.filter(item => item && Number.isInteger(item.id) && POKEMON.some(p => p.id === item.id) && !ids.has(item.id) && ids.add(item.id));
}
function collectionCount() {
  try { return readCollection().length; } catch { return null; }
}
function pokemonMenuHTML() {
  const n = collectionCount();
  return `<section class="pokemon-banner" aria-label="寶可夢拼字挑戰">
    <div class="poke-ball" aria-hidden="true"></div><div><span class="sub">拼字 · 探索 · 收藏</span><h2>寶可夢拼字挑戰</h2>
    <p>隨機 2 個重點生字，全部拼對，解鎖新夥伴！</p>
    <div class="controls"><button class="gold" id="pokemon-start" ${n===151?'disabled':''}>${n===151?'151 隻已全部收集！':'開始挑戰'}</button>
    <button class="secondary" id="pokemon-collection">我的圖鑑 · ${n===null?'讀取失敗':n+' / 151'}</button></div>
    <p class="sub">同一裝置不重複解鎖 · 可重試及使用音節提示</p></div></section>`;
}
function bindPokemonMenu() {
  document.getElementById('pokemon-start').onclick = startPokemon;
  document.getElementById('pokemon-collection').onclick = showCollection;
}
function pokemonError() {
  stage='pokemon';
  el.innerHTML='<h1>暫時無法儲存收藏</h1><p>請允許此網站儲存資料，再重新開啟遊戲。為免重複解鎖，暫時未發出獎勵。</p><button id="home">返回主頁</button>';
  document.getElementById('home').onclick=menu;
}
function startPokemon() {
  try {
    const collection=readCollection();
    localStorage.setItem(COLLECTION_KEY,JSON.stringify(collection));
    if(collection.length>=POKEMON.length){showCollection();return;}
  } catch {pokemonError();return;}
  mode='spell';group='core';
  start(sh(words.slice(0,29)).slice(0,2),true);
}
async function finishPokemon() {
  if (!pokeRound || pokeRound.completed!==2 || !locked || index!==1 || awardingPokemon) return;
  if (pokeRound.reward) {showPokemon(pokeRound.reward,true);return;}
  const round=pokeRound;
  awardingPokemon=true;
  stage='pokemon';
  el.innerHTML='<h1>正在解鎖新夥伴…</h1><p role="status">2 個生字已全部拼對！</p>';
  try {
    const award=()=>{
      const collection=readCollection();
      const existing=collection.find(p=>p.round===round.id);
      if(existing) return existing.id;
      const remaining=POKEMON.filter(p=>!collection.some(c=>c.id===p.id));
      if(!remaining.length) return null;
      const pokemon=sh(remaining)[0];
      collection.push({id:pokemon.id,round:round.id});
      localStorage.setItem(COLLECTION_KEY,JSON.stringify(collection));
      return pokemon.id;
    };
    // Serialize awards across tabs where Web Locks is supported.
    const id=navigator.locks ? await navigator.locks.request(COLLECTION_KEY,award) : award();
    round.reward=id;
    if(id) showPokemon(id,true); else showCollection();
  } catch {pokemonError();}
  finally {awardingPokemon=false;}
}
function showPokemon(id,unlocked=false) {
  const p=POKEMON.find(p=>p.id===id);
  if(!p) return;
  stage='pokemon';
  const nameOf=id=>POKEMON.find(p=>p.id===id)?.name;
  const evolution=[p.previous&&nameOf(p.previous)?'由 '+nameOf(p.previous)+' 進化而來':'',p.next.length?'可進化成 '+p.next.map(nameOf).join('、'):''].filter(Boolean).join('；');
  const labels=['HP 體力','攻擊','防禦','特攻','特防','速度'];
  el.innerHTML=`<div class="stats"><button class="secondary" id="home">⌂ 主頁</button><span class="tag">圖鑑 ${collectionCount()} / 151</span></div>
  ${unlocked?'<p class="unlock-label" role="status">🎉 2 題完成！新夥伴已加入收藏</p>':''}
  <article class="pokemon-detail">
    <div class="pokemon-portrait"><img src="./pokemon/${p.id}.png" alt="${escapeHTML(p.name)}" width="300" height="300"><span class="dex-number">No. ${String(p.id).padStart(3,'0')}</span></div>
    <h1>${escapeHTML(p.name)}</h1><p class="pokemon-english">${escapeHTML(p.en)}</p>
    <div class="type-list">${p.types.map(t=>`<span class="type-tag">${escapeHTML(t)}</span>`).join('')}</div>
    <dl class="pokemon-facts"><div><dt>分類</dt><dd>${escapeHTML(p.genus)}</dd></div><div><dt>身高</dt><dd>${p.height} 米</dd></div><div><dt>體重</dt><dd>${p.weight} 公斤</dd></div><div><dt>身分</dt><dd>${p.mythical?'幻之寶可夢':p.legendary?'傳說的寶可夢':'一般寶可夢'}</dd></div></dl>
    <section class="pokemon-info"><h2>特性</h2><p>${p.abilities.map(escapeHTML).join('、')}</p>
    ${evolution?`<h2>首代進化關係</h2><p>${escapeHTML(evolution)}</p>`:''}
    <h2>基礎能力</h2><p class="sub">寶可夢的種族值，不是今次的遊戲得分。</p>
    <div class="pokemon-stats">${p.stats.map((value,i)=>`<div><span>${labels[i]}</span><meter min="0" max="255" value="${value}" aria-label="${labels[i]}"></meter><b>${value}</b></div>`).join('')}</div></section>
  </article><div class="controls"><button class="gold" id="another">再挑戰 2 題</button><button class="secondary" id="collection">查看我的圖鑑</button></div>
  <p class="sub pokemon-credit">資料及圖片：<a href="https://pokeapi.co/" target="_blank" rel="noopener">PokéAPI</a>。寶可夢角色屬其權利人所有；本遊戲為非官方學習作品。</p>`;
  document.getElementById('home').onclick=menu;
  document.getElementById('another').onclick=startPokemon;
  document.getElementById('collection').onclick=showCollection;
  window.scrollTo(0,0);
}
function showCollection() {
  let collection;
  try {collection=readCollection();} catch {pokemonError();return;}
  stage='collection';
  el.innerHTML=`<div class="stats"><button class="secondary" id="home">⌂ 主頁</button><span class="tag">${collection.length} / 151</span></div>
    <h1>我的寶可夢圖鑑</h1><p>${collection.length===151?'🏆 首代 151 隻全部收集完成！':collection.length?'點擊夥伴，查看詳細資料。':'完成第一輪拼字挑戰，認識你的第一位夥伴！'}</p>
    <p class="sub">收藏儲存在此瀏覽器。轉換裝置或清除網站資料後，收藏不會保留。</p>
    <button class="gold" id="challenge" ${collection.length===151?'disabled':''}>開始 2 題拼字挑戰</button>
    <div class="pokemon-grid">${collection.map(item=>{const p=POKEMON.find(p=>p.id===item.id);return `<button class="pokemon-card" data-pokemon="${p.id}"><img loading="lazy" src="./pokemon/${p.id}.png" alt="" width="160" height="160"><small>No. ${String(p.id).padStart(3,'0')}</small><b>${escapeHTML(p.name)}</b><span>${escapeHTML(p.en)}</span></button>`}).join('')}</div>`;
  document.getElementById('home').onclick=menu;
  document.getElementById('challenge').onclick=startPokemon;
  el.querySelectorAll('[data-pokemon]').forEach(b=>b.onclick=()=>showPokemon(Number(b.dataset.pokemon)));
  window.scrollTo(0,0);
}
