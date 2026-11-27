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
    <div class="controls"><button class="gold" id="pokemon-start" ${n===POKEMON.length?'disabled':''}>${n===POKEMON.length?POKEMON.length+' 隻已全部收集！':'開始挑戰'}</button>
    <button class="secondary" id="pokemon-collection">我的圖鑑 · ${n===null?'讀取失敗':n+' / '+POKEMON.length}</button></div>
    <p class="sub">共 ${POKEMON.length} 隻 · 傳說 ${POKEMON.filter(p=>p.legendary).length} 隻 · 幻之 ${POKEMON.filter(p=>p.mythical).length} 隻<br>每第 3 隻優先解鎖未收藏的傳說／幻之夥伴</p></div></section>`;
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
      const rare=remaining.filter(p=>p.legendary||p.mythical);
      const candidatePool=(collection.length+1)%3===0&&rare.length?rare:remaining;
      const pokemon=sh(candidatePool)[0];
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
function rarity(p) {return p.mythical?'幻之寶可夢':p.legendary?'傳說的寶可夢':'一般寶可夢';}
function rarityBadge(p) {return p.legendary||p.mythical?'<span class="rarity-badge">'+(p.mythical?'✨ 幻之寶可夢':'🌟 傳說的寶可夢')+'</span>':'';}
function showPokemon(id,unlocked=false) {
  const p=POKEMON.find(p=>p.id===id);
  if(!p) return;
  stage='pokemon';
  const nameOf=id=>POKEMON.find(p=>p.id===id)?.name;
  const evolution=[p.previous&&nameOf(p.previous)?'由 '+nameOf(p.previous)+' 進化而來':'沒有更早的進化階段',p.next.length?'後續進化：'+p.next.map(nameOf).join('、'):'目前沒有後續進化階段'].join('。')+'。';
  const labels=['HP 體力','攻擊','防禦','特攻','特防','速度'];
  const explanations=['承受傷害的基礎體力','影響物理招式的威力','抵擋物理招式的能力','影響特殊招式的威力','抵擋特殊招式的能力','影響一般情況下的行動先後'];
  const strongest=labels.filter((_,i)=>p.stats[i]===Math.max(...p.stats));
  const weakest=labels.filter((_,i)=>p.stats[i]===Math.min(...p.stats));
  const profile=strongest.length===6?'牠的六項基礎能力都是 '+p.stats[0]+'，分布十分平均，沒有特別偏向某一項。':'在牠自己的六項基礎能力中，'+strongest.join('、')+'最高，'+weakest.join('、')+'最低。這代表牠的能力分布特色，並不是與所有寶可夢相比的排名。';
  const matchup=(title,items,empty)=>'<h3>'+title+'</h3><div class="matchup-list">'+(items.length?items.map(m=>'<span>'+escapeHTML(m.type)+' <b>×'+m.multiplier+'</b></span>').join(''):'<p>'+empty+'</p>')+'</div>';
  const intro=p.name+'是第 '+p.generation+' 世代登場的'+p.genus+'，屬性為'+p.types.join('／')+'。身高 '+p.height+' 米、體重 '+p.weight+' 公斤；圖鑑把牠的主要體色分類為'+p.color+'。';
  el.innerHTML=`<div class="stats"><button class="secondary" id="home">⌂ 主頁</button><span class="tag">圖鑑 ${collectionCount()} / ${POKEMON.length}</span></div>
  ${unlocked?'<p class="unlock-label" role="status">🎉 2 題完成！新夥伴已加入收藏</p>':''}
  <article class="pokemon-detail">
    <div class="pokemon-portrait"><img src="./pokemon/${p.id}.png" alt="${escapeHTML(p.name)}" width="300" height="300"><span class="dex-number">No. ${String(p.id).padStart(3,'0')}</span></div>
    ${rarityBadge(p)}<h1>${escapeHTML(p.name)}</h1><p class="pokemon-english">${escapeHTML(p.en)}</p>
    <div class="type-list">${p.types.map(t=>`<span class="type-tag">${escapeHTML(t)}</span>`).join('')}</div>
    <nav class="detail-nav" aria-label="圖鑑章節"><a href="#pokemon-about">介紹</a><a href="#pokemon-abilities">特性</a><a href="#pokemon-matchups">相剋</a><a href="#pokemon-stats">能力</a></nav>
    <section class="pokemon-info" id="pokemon-about"><h2>認識${escapeHTML(p.name)}</h2>
    ${POKEMON_STORIES[p.id]?`<p class="pokemon-story">${escapeHTML(POKEMON_STORIES[p.id])}</p>`:''}
    <p>${escapeHTML(intro)}</p><p>${escapeHTML(profile)}</p></section>
    <dl class="pokemon-facts"><div><dt>分類</dt><dd>${escapeHTML(p.genus)}</dd></div><div><dt>初登場</dt><dd>第 ${p.generation} 世代</dd></div><div><dt>身高</dt><dd>${p.height} 米</dd></div><div><dt>體重</dt><dd>${p.weight} 公斤</dd></div><div><dt>身分</dt><dd>${rarity(p)}</dd></div><div><dt>主要體色</dt><dd>${escapeHTML(p.color)}</dd></div></dl>
    <section class="pokemon-info" id="pokemon-abilities"><h2>特性有甚麼作用？</h2><p class="sub">特性是主系列遊戲中的被動能力，並非拼字遊戲的技能。一般一隻寶可夢同時只具有其中一種特性。</p>
    ${p.abilities.map(a=>`<div class="ability-card"><h3>${escapeHTML(a.name)}${a.hidden?' <small>隱藏特性</small>':''}</h3><p>${escapeHTML(a.description||'目前沒有繁體中文效果資料。')}</p></div>`).join('')}
    <h2>進化關係</h2><p>${escapeHTML(evolution)}</p><p class="sub">這裡列出物種的進化關係；實際進化條件和可用形態會因遊戲版本而不同。</p></section>
    <section class="pokemon-info" id="pokemon-matchups"><h2>屬性相剋小教室</h2><p>以下是${escapeHTML(p.name)}受到不同屬性招式攻擊時的基本倍率。×2 或 ×4 代表較怕這種攻擊；×0.5 或 ×0.25 代表較能抵擋；×0 代表屬性免疫。</p>
    ${matchup('需要留意的攻擊',p.matchups.filter(m=>m.multiplier>1),'沒有單靠屬性造成的弱點。')}
    ${matchup('比較能抵擋的攻擊',p.matchups.filter(m=>m.multiplier>0&&m.multiplier<1),'沒有單靠屬性帶來的減傷。')}
    ${matchup('屬性免疫',p.matchups.filter(m=>m.multiplier===0),'沒有單靠屬性帶來的免疫。')}
    <p class="sub">以資料庫預設形態及現代屬性表計算；未計特性、道具、招式效果或太晶化。例如「飄浮」還可能帶來額外免疫。</p></section>
    <section class="pokemon-info" id="pokemon-stats"><h2>六項基礎能力 · 合計 ${p.total}</h2><p class="sub">以下為種族值，用來了解物種的能力分布；實際遊戲數值還受等級等因素影響。</p>
    <div class="pokemon-stats">${p.stats.map((value,i)=>`<div><span>${labels[i]}</span><meter min="0" max="255" value="${value}" aria-label="${labels[i]}"></meter><b>${value}</b></div><p class="stat-explanation">${explanations[i]}</p>`).join('')}</div></section>
  </article><div class="controls"><button class="gold" id="another">再挑戰 2 題</button><button class="secondary" id="collection">查看我的圖鑑</button></div>
  <p class="sub pokemon-credit">資料及圖片：<a href="https://pokeapi.co/" target="_blank" rel="noopener">PokéAPI</a> · <a href="https://www.pokemon.com/us/pokedex" target="_blank" rel="noopener">官方寶可夢圖鑑</a><br>介紹依圖鑑資料整理；神話與傳說屬寶可夢世界的故事。角色屬其權利人所有，本遊戲為非官方學習作品。</p>`;
  document.getElementById('home').onclick=menu;
  document.getElementById('another').onclick=startPokemon;
  document.getElementById('collection').onclick=showCollection;
  window.scrollTo(0,0);
}
function showCollection() {
  let collection;
  try {collection=readCollection();} catch {pokemonError();return;}
  stage='collection';
  const owned=collection.map(item=>POKEMON.find(p=>p.id===item.id));
  el.innerHTML=`<div class="stats"><button class="secondary" id="home">⌂ 主頁</button><span class="tag">${collection.length} / ${POKEMON.length}</span></div>
    <h1>我的寶可夢圖鑑</h1><p>${collection.length===POKEMON.length?'🏆 '+POKEMON.length+' 隻全部收集完成！':collection.length?'點擊夥伴，查看詳細資料。':'完成第一輪拼字挑戰，認識你的第一位夥伴！'}</p>
    <p class="sub">已收藏：傳說 ${owned.filter(p=>p.legendary).length} 隻 · 幻之 ${owned.filter(p=>p.mythical).length} 隻</p>
    <p class="sub">收藏儲存在此瀏覽器。轉換裝置或清除網站資料後，收藏不會保留。</p>
    <button class="gold" id="challenge" ${collection.length===POKEMON.length?'disabled':''}>開始 2 題拼字挑戰</button>
    <div class="collection-filters"><label>尋找已收藏夥伴<input id="pokemon-search" type="search" placeholder="中文、英文或圖鑑編號"></label><label>顯示分類<select id="pokemon-filter"><option value="all">全部收藏</option><option value="legendary">傳說寶可夢</option><option value="mythical">幻之寶可夢</option><option value="normal">一般寶可夢</option></select></label></div>
    <p id="collection-count" role="status"></p><div class="pokemon-grid" id="pokemon-grid"></div>`;
  const draw=()=>{
    const q=document.getElementById('pokemon-search').value.trim().toLowerCase();
    const filter=document.getElementById('pokemon-filter').value;
    const visible=owned.filter(p=>(filter==='all'||(filter==='normal'?!p.legendary&&!p.mythical:p[filter]))&&(!q||p.name.includes(q)||p.en.toLowerCase().includes(q)||String(p.id).includes(q)));
    document.getElementById('collection-count').textContent=visible.length?'顯示 '+visible.length+' 隻夥伴':'暫時沒有符合條件的已收藏夥伴。';
    document.getElementById('pokemon-grid').innerHTML=visible.map(p=>`<button class="pokemon-card" data-pokemon="${p.id}"><img loading="lazy" src="./pokemon/${p.id}.png" alt="" width="160" height="160"><small>No. ${String(p.id).padStart(3,'0')}</small><b>${escapeHTML(p.name)}</b><span>${escapeHTML(p.en)}</span>${rarityBadge(p)}</button>`).join('');
    el.querySelectorAll('[data-pokemon]').forEach(b=>b.onclick=()=>showPokemon(Number(b.dataset.pokemon)));
  };
  document.getElementById('home').onclick=menu;
  document.getElementById('challenge').onclick=startPokemon;
  document.getElementById('pokemon-search').oninput=draw;
  document.getElementById('pokemon-filter').onchange=draw;
  draw();window.scrollTo(0,0);
}
