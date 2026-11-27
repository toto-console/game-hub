/* Read-only profile panels. Parse only public display fields; never run fetched scripts. */
function gameHubCompleted(progress){return Number.isInteger(progress?.achievable)&&progress.achievable>0&&Number.isInteger(progress.unlocked)&&progress.unlocked===progress.achievable;}
function gameHubProfileData(parsed){
 const node=parsed.querySelector('#valve-ssr-data');if(!node)return {queries:[],loaders:[]};
 const data=JSON.parse(node.textContent);return {queries:JSON.parse(data.renderContext?.queryData||'{"queries":[]}').queries||[],loaders:(data.loaderData||[]).slice(1).map(x=>JSON.parse(x))};
}
function gameHubProfileGames(parsed){
 const {queries,loaders}=gameHubProfileData(parsed),owner=loaders.find(x=>x.steamid),id=owner?.steamid;
 const get=name=>queries.find(q=>q.queryKey?.[0]===name&&String(q.queryKey[1])===String(id))?.state?.data;
 const list=owner?.listData||{},owned=get('OwnedGames');if(!Array.isArray(owned))throw Error('Steam has not shared this game library.');
 const progress=get('AchievementGroupsProgress')||{},followed=get('FollowedGamesList')||[];
 const clean=g=>({id:Number(g.appid),name:String(g.name||''),minutes:Number(g.playtime_forever)||0,lastPlayed:Number(g.rtime_last_played)||0,stats:g.has_community_visible_stats===true,progress:progress[g.appid],capsule:g.capsule_filename});
 const extra=(list.mapFollowedUnownedGames?.v||[]).map(x=>x[1]);
 return {all:owned.map(clean),recent:(list.rgRecentlyPlayedGames||[]).map(clean),followed:[...owned,...extra].filter(g=>followed.includes(g.appid)).map(clean)};
}
function gameHubProfileAchievements(parsed,appid){
 const {queries,loaders}=gameHubProfileData(parsed),owner=loaders.find(x=>x.targetSteamId),id=owner?.targetSteamId;
 const get=kind=>queries.find(q=>q.queryKey?.[0]==='achievements'&&Number(q.queryKey[1])===Number(appid)&&q.queryKey[2]===kind&&(kind!=='user_achievements'||String(q.queryKey[3])===String(id)))?.state?.data;
 const schema=get('schema_v2'),user=get('user_achievements'),global=get('globalpercentages')?.percentages||{};
 if(!schema?.groups||!user?.achievements)throw Error('Steam has not shared achievement progress for this player.');
 return schema.groups.filter(g=>!g.archived&&!g.developeronly&&g.ispublic!==false).flatMap(g=>g.achievements||[]).filter(a=>!a.archived).map(a=>{
  const earned=user.achievements[a.internal_key],unlocked=earned?.unlocked===true,pct=global[a.internal_key];
  return {id:String(a.internal_key),name:a.hidden&&!unlocked?'Hidden achievement':String(a.name||a.api_name||'Achievement'),description:a.hidden&&!unlocked?'Unlock this achievement to reveal its details.':String(a.description||''),unlocked,time:unlocked?Number(earned.unlock_time)||0:0,percent:typeof pct==='number'&&pct>=0&&pct<=100?pct:null,icon:a.hidden&&!unlocked?'':(unlocked?a.icon_achieved:a.icon_unachieved)||''};
 });
}
function connectGameHubProfileTabs({axis,doc,win,shell,nav,tabs,base,make,focusable,options}){
 const names=['Overview','Games','Achievements','Friends','Groups','Inventory','Reviews'],links=[...tabs.children].filter(n=>n.matches('a')),overview=[...shell.children].filter(n=>n!==nav&&!n.classList.contains('ghp-hero')),remaining=doc.querySelector('[data-ghp-remaining]');
 const content=make('div','ghp-scroll-content'),remainingMarker=remaining?doc.createComment('profile remaining'):null;
 if(remaining)remaining.before(remainingMarker);shell.append(content);overview.forEach(n=>content.append(n));if(remaining)content.append(remaining);
 const pane=make('section','ghp-pane');pane.hidden=true;content.append(pane);const cache=new Map(),requests=new Set(),mem=new Map(),held=new Set();let active='Overview',generation=0,disposed=false,detail=false,lastApp=null,restoreGame=null,closeComparison=null;
 const gems=typeof win.IntersectionObserver==='function'?new win.IntersectionObserver(entries=>entries.forEach(e=>{e.target.dataset.inViewport=String(e.isIntersecting);e.target.dataset.visible=String(e.isIntersecting&&!doc.hidden&&options().motion);}),{threshold:.1}):null;
 const visibility=()=>{for(const g of pane.querySelectorAll('.gha-gem-rare,.ghp-completion-trophy'))g.dataset.visible=String(g.dataset.inViewport!=='false'&&!doc.hidden&&options().motion);};doc.addEventListener('visibilitychange',visibility);
 const text=(parent,tag,cls,value)=>{const n=make(tag,cls,value);parent.append(n);return n;};
 const button=(parent,label,fn,cls='ghp-pill')=>{const b=focusable(make('button',cls,label));b.type='button';b.addEventListener('click',fn);parent.append(b);return b;};
 const safeURL=(raw,asset=false)=>{if(typeof raw!=='string'||!raw.trim())return '';try{const u=new URL(raw,base);if(u.protocol!=='https:'||u.username||u.password)return '';return (asset?/\.(steamstatic|akamaihd)\.com$/.test(u.hostname)||u.hostname==='avatars.steamstatic.com':u.origin===base.origin||u.origin==='https://store.steampowered.com')?u.href:'';}catch{return '';}};
 const anchor=(parent,label,url,cls='ghp-pill')=>{const a=focusable(make('a',cls,label));a.href=safeURL(url)||base.href;parent.append(a);return a;};
 const picture=(parent,url,cls='')=>{const src=safeURL(url,true);if(!src)return;const img=make('img',cls);img.src=src;img.alt='';img.loading='lazy';img.addEventListener('error',()=>{img.hidden=true;},{once:true});parent.append(img);};
 async function read(path,profileBase=base){
  if(profileBase.origin!==base.origin||!/^\/(?:id\/[a-zA-Z0-9_-]+|profiles\/\d+)\/?$/.test(profileBase.pathname))throw Error('Invalid comparison profile');
  const url=new URL(profileBase.href.replace(/\/$/,'')+path);if(url.origin!==base.origin)throw Error('Invalid profile page');
  if(cache.has(url.href))return cache.get(url.href);
  const control=new AbortController();requests.add(control);const timer=setTimeout(()=>control.abort(),12000);
  try{const response=await fetch(url.href,{credentials:'same-origin',signal:control.signal});if(!response.ok||new URL(response.url).origin!==base.origin||!new URL(response.url).pathname.startsWith(profileBase.pathname.replace(/\/$/,'')+'/'))throw Error('Steam profile data is unavailable.');
   const html=await response.text();if(html.length>12000000)throw Error('Steam profile page is too large.');const parsed=new DOMParser().parseFromString(html,'text/html');cache.set(url.href,parsed);return parsed;
  }finally{clearTimeout(timer);requests.delete(control);}
 }
 // Steam's Community keyboard bridge targets the focused input (shared_global/legacy_web).
 let searchSession=null,keyboardRequested=false,lastKeyboardRequest=0;
 function finishSearch(){const input=searchSession;keyboardRequested=false;searchSession=null;delete doc.documentElement.dataset.ghProfileEditing;if(input)input.readOnly=true;}
 function openKeyboard(){
  const browser=win.SteamClient?.BrowserView;
  if(browser?.PostMessageToParent)browser.PostMessageToParent('GameHubProfileKeyboard','{}');
  else win.GPShowVirtualKeyboard?.(true);
 }
 const commentSelector='[data-ghp-remaining] textarea, [data-ghp-remaining] [contenteditable="true"]';
 const editComment=e=>{
  const field=e.target.closest?.(commentSelector);
  if(!field||e.repeat||e.detail?.is_repeat)return;
  if(e.type==='vgp_onok')e.preventDefault();
  e.stopImmediatePropagation();
  field.focus({preventScroll:true});
  openKeyboard();
 };
 for(const type of ['click','vgp_onok'])win.addEventListener(type,editComment,true);
 function searchInput(label){const input=focusable(make('input','ghp-search'));input.type='text';input.setAttribute('enterkeyhint','search');input.readOnly=true;input.placeholder=label;input.setAttribute('aria-label',label);input.autocomplete='off';
  input.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const now=Date.now();if(keyboardRequested&&now-lastKeyboardRequest<300)return;lastKeyboardRequest=now;input.readOnly=false;focus(input);
   if(win.SteamClient?.BrowserView?.PostMessageToParent||typeof win.GPShowVirtualKeyboard==='function'){searchSession=input;keyboardRequested=true;doc.documentElement.dataset.ghProfileEditing='true';try{openKeyboard();}catch{finishSearch();}}
  });
  input.addEventListener('blur',()=>{if(searchSession===input&&doc.hasFocus()&&doc.activeElement!==doc.body)finishSearch();});return input;
 }
 const searchFocus=e=>{if(searchSession&&e.target!==searchSession&&shell.contains(e.target))finishSearch();};
 const searchEvent=e=>{const input=searchSession;if(!input?.isConnected)return;
  if(e.type==='vgp_oncancel'||(e.type==='keydown'&&(e.key==='Escape'||e.key==='Enter'))){e.preventDefault();e.stopImmediatePropagation();win.GPShowVirtualKeyboard?.(false);finishSearch();focus(input);}
  else if(e.type==='vgp_onok'){e.preventDefault();e.stopImmediatePropagation();}
  else if(e.type==='vgp_ondirection'){
   // Returning from Steam's keyboard must never leave a dead input focus trap.
   e.preventDefault();e.stopImmediatePropagation();
  }else if((e.type==='vgp_onbuttondown'||e.type==='vgp_onbuttonup')&&[5,6].includes(e.detail?.button)){e.preventDefault();e.stopImmediatePropagation();}
 };
 for(const name of ['vgp_onok','vgp_oncancel','vgp_ondirection','vgp_onbuttondown','vgp_onbuttonup','keydown'])win.addEventListener(name,searchEvent,true);
 doc.addEventListener('focusin',searchFocus,true);

 const releaseYears=new Map();
 let releaseQueue=Promise.resolve();
 const releaseRequests=new Set();
 const badgeObserver=typeof win.IntersectionObserver==='function'?new win.IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting)continue;
   badgeObserver.unobserve(entry.target);
   const badge=entry.target,id=Number(badge.dataset.appid);
   releaseQueue=releaseQueue.then(async()=>{
    if(disposed||!badge.isConnected)return;
    let year=releaseYears.get(id);
    if(year===undefined){
     const controller=new AbortController();
     releaseRequests.add(controller);
     const timer=setTimeout(()=>controller.abort(),5000);
     try{
      const response=await fetch('https://store.steampowered.com/api/appdetails?appids='+id+'&filters=release_date&l=english',{signal:controller.signal});
      if(!response.ok)return;
      const data=await response.json();
      const date=data?.[id]?.data?.release_date;
      const match=!date?.coming_soon&&date?.date?.match(/\b(19|20)\d{2}\b/);
      year=match?Number(match[0]):null;
      releaseYears.set(id,year);
     }catch{return;}finally{clearTimeout(timer);releaseRequests.delete(controller);}
    }
    if(disposed||!badge.isConnected)return;
    if(year){badge.dataset.era=year<=2019?'classic':'modern';badge.title='Steam release: '+year;}
   });
  }
 },{root:content,rootMargin:'150px'}):null;
 function platformBadge(parent,game){
  const badge=text(parent,'small','ghp-platform','STEAM');
  badge.dataset.appid=String(game.id);
  badgeObserver?.observe(badge);
 }
 const status=message=>{pane.replaceChildren();text(pane,'p','ghp-empty',message);};
 function remember(){const items=[...shell.querySelectorAll('[data-ghp-focus]')];mem.set(active,{index:items.indexOf(doc.activeElement),scroll:content.scrollTop||0});}
 function focus(el){if(!el)return;shell.querySelectorAll('.ghp-focus').forEach(n=>n.classList.remove('ghp-focus'));el.classList.add('ghp-focus');el.focus({preventScroll:true});if(typeof win.GPNavFocusChild==='function'){const target=win.$J?win.$J(el):[el];win.InstrumentFocusElements?.(target);win.GPNavFocusChild(target);}}
 function route(name,app){axis?.stop();if(name===active&&Boolean(app)===detail&&(!app||String(app)===lastApp)){focus(links[names.indexOf(name)]);return;}restoreGame=detail&&name===active&&!app?lastApp:null;if(app)lastApp=String(app);const h='#ghp-'+name.toLowerCase()+(app?'-'+app:'');if(location.hash!==h)history.replaceState(null,'',h);show(name,app);}
 function gridGames(data,achievements=false){
  pane.replaceChildren();const toolbar=make('div','ghp-pane-toolbar');pane.append(toolbar);text(toolbar,'h1','',achievements?'Achievements':'Games');
  const filters=make('div','ghp-filters');pane.append(filters);let mode='all',query='',sort='playtime',limit=36;
  const search=searchInput('Find a game');toolbar.append(search);
  const grid=make('div','ghp-game-grid');pane.append(grid);
  const render=()=>{grid.replaceChildren();let games=[...data[mode]].filter(g=>!achievements||g.progress?.achievable>0||g.stats).filter(g=>g.name.toLowerCase().includes(query));games.sort(sort==='name'?(a,b)=>a.name.localeCompare(b.name):(a,b)=>b.minutes-a.minutes);
   for(const g of games.slice(0,limit)){const card=focusable(make('article','ghp-game-card'));card.tabIndex=0;card.setAttribute('data-panel',JSON.stringify({focusable:true,noFocusRing:true}));card.setAttribute('data-ghp-card','');card.setAttribute('role','button');card.setAttribute('aria-label',g.name);card.dataset.appid=String(g.id);card.addEventListener('click',e=>{if(e.target===card)route(achievements?'Achievements':'Games',g.id);});grid.append(card);const open=button(card,g.name,()=>achievements?route('Achievements',g.id):route('Games',g.id),'ghp-game-open');open.dataset.appid=String(g.id);picture(open,`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${g.id}/${g.capsule||'library_600x900.jpg'}`,'ghp-game-art');text(card,'p','ghp-muted',`${Math.round(g.minutes/6)/10} hours played`);
    if(g.progress?.achievable>0){text(card,'small','',`${g.progress.unlocked} / ${g.progress.achievable} achievements`);const meter=make('progress');meter.max=g.progress.achievable;meter.value=g.progress.unlocked;meter.setAttribute('aria-label',g.name+' achievements');card.append(meter);}
    if(!achievements)anchor(card,'Game hub',`https://steamcommunity.com/app/${g.id}`);}
   if(!games.length)text(grid,'p','ghp-empty','No shared games match this view.');if(games.length>limit)button(grid,'Show more games',()=>{limit+=36;render();});
  };
  for(const [key,label] of [['all','All Games'],['recent','Recently Played'],['followed','Followed']]){const b=button(filters,label,()=>{mode=key;limit=36;[...filters.querySelectorAll('[aria-pressed]')].forEach(n=>n.setAttribute('aria-pressed',String(n===b)));render();});b.setAttribute('aria-pressed',String(key===mode));}
  button(toolbar,'Sort: Playtime / Name',()=>{sort=sort==='name'?'playtime':'name';render();});search.addEventListener('input',()=>{query=search.value.toLowerCase();limit=36;render();});render();
 }
 function completionTrophy(parent,label){
  const trophy=make('span','ghp-completion-trophy');trophy.setAttribute('role','img');trophy.setAttribute('aria-label',label||'100% complete — platinum trophy');
  const sphere=make('span','ghp-trophy-snow');sphere.setAttribute('aria-hidden','true');trophy.append(sphere);
  for(let i=0;i<18;i++){const flake=make('i');flake.style.setProperty('--x',`${8+(i*37)%84}%`);flake.style.setProperty('--y',`${7+(i*23)%84}%`);flake.style.setProperty('--drift',`${(i%3-1)*10}px`);flake.style.setProperty('--delay',`${-i*.71}s`);flake.style.setProperty('--duration',`${4+i%5}s`);sphere.append(flake);}
  parent.append(trophy);trophy.dataset.visible=String(!doc.hidden&&options().motion);gems?.observe(trophy);return trophy;
 }
 function trophyIcon(parent){const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');const path=doc.createElementNS(svg.namespaceURI,'path');path.setAttribute('d','M7 3h10v6a5 5 0 0 1-10 0ZM7 5H3v3a5 5 0 0 0 5 5M17 5h4v3a5 5 0 0 1-5 5M12 14v6m-5 1h10');svg.append(path);parent.append(svg);}
 let metalId=0;
 function gameTrophy(parent,unlocked,total){
  if(!Number.isInteger(unlocked)||!Number.isInteger(total)||total<=0||unlocked<0||unlocked>total)return false;
  const pct=Math.floor(100*unlocked/total);
  if(pct>=90){completionTrophy(parent,pct===100?undefined:pct+'% complete — platinum in progress');return true;}
  if(pct<1)return false;
  const tier=pct>=60?'gold':pct>=30?'silver':'bronze',id='ghp-metal-'+(++metalId);
  const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 64 76');svg.setAttribute('class','ghp-metal-trophy');
  svg.dataset.tier=tier;svg.setAttribute('role','img');svg.setAttribute('aria-label',pct+'% complete — '+tier+' trophy');
  // A common silhouette keeps the cups aligned as their metal finish changes.
  svg.innerHTML=`<defs><linearGradient id="${id}"><stop stop-color="var(--shade)"/><stop offset=".24" stop-color="var(--shine)"/><stop offset=".53" stop-color="var(--metal)"/><stop offset=".81" stop-color="var(--shade)"/><stop offset="1" stop-color="var(--metal)"/></linearGradient></defs>
   <path d="M15 11H5c-1 12 3 22 15 27m29-27h10c1 12-3 22-15 27" fill="none" stroke="url(#${id})" stroke-width="4" stroke-linejoin="round"/>
   <path d="M12 7Q32 4 52 7l-2 17c-1 11-7 19-15 23-2 8 1 14 6 18l5 2v4H18v-4l5-2c5-4 8-10 6-18-8-4-14-12-15-23Z" fill="url(#${id})" stroke="var(--shade)" stroke-width="1.1"/>
   <path d="M14 8q18-2 36 0M20 68h24" fill="none" stroke="var(--shine)" stroke-width="1.3"/>
   <g stroke="var(--shade)" stroke-width="1.5" fill="none"><path d="M22 14h7v7h-7zM38 14l4 7h-8zM22 25l7 7m0-7-7 7"/><circle cx="38" cy="28.5" r="3.7"/></g>`;
  parent.append(svg);return true;
 }
 function trophyGames(data){
  pane.replaceChildren();const toolbar=make('div','ghp-pane-toolbar');pane.append(toolbar);text(toolbar,'h1','','Trophies');
  const games=data.all.filter(g=>g.progress?.achievable>0||g.stats),known=games.filter(g=>g.progress?.achievable>0),earned=known.reduce((n,g)=>n+g.progress.unlocked,0),total=known.reduce((n,g)=>n+g.progress.achievable,0),complete=known.filter(g=>gameHubCompleted(g.progress)).length;
  const summary=make('div','ghp-trophy-summary');toolbar.append(summary);
  const platinum=make('div','ghp-platinum-total');summary.append(platinum);completionTrophy(platinum,'Platinum trophies earned');const caption=make('div');platinum.append(caption);text(caption,'small','','Platinum');text(caption,'strong','',String(complete));
  for(const [label,value] of [['Earned',earned],['Available',total]]){const n=make('div');summary.append(n);text(n,'small','',label);text(n,'strong','',String(value));}
  const filters=make('div','ghp-filters');pane.append(filters);let sort='Recent',query='',nearOnly=false;const recent=new Map((data.recent||[]).map((g,i)=>[g.id,i]));const search=searchInput('Find a game');filters.append(search);
  const list=make('div','ghp-trophy-library');pane.append(list);
  const render=()=>{gems?.disconnect();list.replaceChildren();const items=games.filter(g=>g.name.toLowerCase().includes(query)).filter(g=>!nearOnly||g.progress?.achievable>0&&g.progress.unlocked/g.progress.achievable>=0.9&&g.progress.unlocked<=g.progress.achievable).sort((a,b)=>{if(sort==='Name')return a.name.localeCompare(b.name);if(sort==='Playtime')return b.minutes-a.minutes;const fallback=(recent.get(a.id)??Infinity)-(recent.get(b.id)??Infinity);return fallback||b.lastPlayed-a.lastPlayed||a.name.localeCompare(b.name);});for(const g of items){const row=button(list,'',()=>route('Achievements',g.id),'ghp-trophy-game');row.dataset.appid=String(g.id);picture(row,`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${g.id}/library_600x900.jpg`);const label=text(row,'span','ghp-trophy-name',g.name);platformBadge(label,g);const pct=g.progress?.achievable>0?Math.floor(100*g.progress.unlocked/g.progress.achievable):null,progress=text(row,'span','ghp-trophy-progress',pct===null?'—':pct+'%');if(pct!==null){const meter=make('progress');meter.max=100;meter.value=pct;meter.setAttribute('aria-label',g.name+' completion');progress.append(meter);}const counts=make('span','ghp-trophy-earned');row.append(counts);if(gameHubCompleted(g.progress))row.dataset.complete='true';if(!gameTrophy(counts,g.progress?.unlocked,g.progress?.achievable))trophyIcon(counts);text(counts,'span','',g.progress?.achievable>0?`${g.progress.unlocked} / ${g.progress.achievable}`:'Not shared');}
   if(!items.length)text(list,'p','ghp-empty','No shared achievement games match this view.');};
  const sortButton=button(filters,'Sort: Recent',()=>{sort=sort==='Recent'?'Playtime':sort==='Playtime'?'Name':'Recent';sortButton.textContent='Sort: '+sort;render();});
  const platinumFilter=button(filters,'Platinum progress · 90–100%',()=>{nearOnly=!nearOnly;platinumFilter.setAttribute('aria-pressed',String(nearOnly));render();});platinumFilter.setAttribute('aria-pressed','false');search.addEventListener('input',()=>{query=search.value.toLowerCase();render();});text(pane,'p','ghp-muted','Select a game to view trophies, compare with friends, and see global percentages.');render();
 }
 function achievementRows(rows,app,name){
  pane.replaceChildren();detail=true;const toolbar=make('div','ghp-pane-toolbar');pane.append(toolbar);button(toolbar,'‹ All games',()=>route('Achievements'));text(toolbar,'h1','',name||'Achievements');const earned=rows.filter(a=>a.unlocked).length;gameTrophy(toolbar,earned,rows.length);text(toolbar,'strong','',`${earned} / ${rows.length} · ${rows.length?Math.floor(100*earned/rows.length):0}%`);
  let filter='all',sort='default',comparison=null,comparisonName='';const comparisonStatus=text(pane,'p','ghp-compare-status','');const filters=make('div','ghp-filters');pane.append(filters);const list=make('div','gha-list ghp-trophies');pane.append(list);
  const render=()=>{gems?.disconnect();list.replaceChildren();let items=rows.filter(a=>filter==='all'||a.unlocked===(filter==='earned'));if(sort==='rarity')items.sort((a,b)=>(a.percent??101)-(b.percent??101));
   for(const a of items){const row=focusable(make('div','gha-row'));row.tabIndex=0;row.setAttribute('aria-label',a.name+', '+(a.unlocked?'Unlocked':'Locked'));list.append(row);const icon=make('span','gha-icon'),gem=make('span','gha-gem');row.append(icon);icon.append(gem);const rare=a.unlocked&&a.percent!==null&&a.percent<10;
    if(rare){gem.classList.add('gha-gem-rare');gems?.observe(gem);const stars=make('span','gha-gem-stars'),sparkles=make('span','gha-gem-sparkles');for(let i=0;i<8;i++)sparkles.append(make('i'));gem.append(stars,sparkles);}
    if(a.icon)picture(gem,`https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/${app}/${a.icon}`);else text(gem,'span','','◇');
    const info=make('div','gha-info');row.append(info);text(info,'strong','',a.name);text(info,'span','',a.unlocked?'Unlocked':'Locked');text(info,'span','',a.percent===null?'Global percentage unavailable':`${a.percent<10?'Rare · ':''}${a.percent.toFixed(1)}% of players earned`);const compareCell=make('div','gha-compare-cell');row.append(compareCell);if(comparison){const other=comparison.find(b=>b.id===a.id);text(compareCell,'span','','This player: '+(a.unlocked?'Unlocked':'Locked'));text(compareCell,'span','',comparisonName+': '+(other?other.unlocked?'Unlocked':'Locked':'Unavailable'));}else text(compareCell,'time','',a.time?new Date(a.time*1000).toLocaleDateString():'');text(row,'div','gha-description',a.description);
   }
  };
  button(filters,'Global percentages',()=>{comparison=null;comparisonName='';comparisonStatus.textContent='Global unlock percentages are shown on each trophy.';render();});
  button(filters,'Compare with me',async()=>{
   const revision=generation,viewer=String(win.g_steamID||'');comparisonStatus.setAttribute('role','status');
   if(!/^7656119\d{10}$/.test(viewer)){comparisonStatus.textContent='Sign in to Steam to compare your achievements with this player.';return;}
   comparisonStatus.textContent='Loading your achievements…';
   try{const result=gameHubProfileAchievements(await read('/achievements/'+app,new URL('https://steamcommunity.com/profiles/'+viewer)),app);if(disposed||generation!==revision)return;
    comparison=result;comparisonName='You';const mine=result.filter(a=>a.unlocked).length;
    comparisonStatus.textContent=`This player: ${earned} / ${rows.length} (${rows.length?Math.floor(earned/rows.length*100):0}%) · You: ${mine} / ${result.length} (${result.length?Math.floor(mine/result.length*100):0}%)`;
    render();content.scrollTop=0;focus(list.querySelector('[data-ghp-focus]'));
   }catch{if(!disposed&&generation===revision)comparisonStatus.textContent='Your achievements for this game are private or unavailable. This player’s trophies are still shown.';}
  });
  for(const [key,label] of [['all','All'],['earned','Earned'],['locked','Locked']])button(filters,label,()=>{filter=key;render();});button(filters,'Sort: Default / Rarity',()=>{sort=sort==='default'?'rarity':'default';render();});render();
 }
 function people(parsed,groups=false){
  pane.replaceChildren();const toolbar=make('div','ghp-pane-toolbar');pane.append(toolbar);text(toolbar,'h1','',groups?'Groups':'Friends');const search=searchInput(groups?'Find a group':'Find a friend');toolbar.append(search);const grid=make('div',groups?'ghp-people-grid':'ghp-people-grid ghp-friend-grid');pane.append(grid);
  const items=[...parsed.querySelectorAll(groups?'.group_block':'.friend_block_v2')];if(!groups){const rank=e=>e.matches('.in-game')?0:e.matches('.online')?1:2;items.sort((a,b)=>rank(a)-rank(b));text(toolbar,'span','ghp-muted',`All friends: ${items.length}`);text(toolbar,'span','ghp-muted','Online – Offline');}let online=false;const render=()=>{grid.replaceChildren();for(const item of items){const content=item.querySelector(groups?'.group_block_details':'.friend_block_content');const name=(groups?item.querySelector('.linkTitle')?.textContent:[...(content?.childNodes||[])].filter(n=>n.nodeType===3).map(n=>n.textContent).join('')).trim();if(!name.toLowerCase().includes(search.value.toLowerCase())||(!groups&&online&&!item.matches('.online,.in-game')))continue;
    const target=item.querySelector(groups?'.linkTitle':'a.selectable_overlay[href],a.friend_block_link_overlay[href]'),card=anchor(grid,'',target?.getAttribute('href'),'ghp-person');const portrait=make('span','ghp-person-portrait');card.append(portrait);picture(portrait,item.querySelector('img')?.getAttribute('src'),'ghp-avatar');const info=make('span','ghp-person-info');card.append(info);text(info,'strong','',name);text(info,'small','',groups?item.querySelector('.memberRow')?.textContent.trim():content?.querySelector('.friend_small_text')?.textContent.trim()||(item.classList.contains('in-game')?'In game':item.classList.contains('online')?'Online':'Offline'));card.dataset.state=item.classList.contains('in-game')?'playing':item.classList.contains('online')?'online':'offline';}
   if(!grid.children.length)text(grid,'p','ghp-empty','No shared results in this view.');};search.addEventListener('input',render);if(!groups)button(toolbar,'All / Online',()=>{online=!online;render();});render();
 }
 function reviews(parsed){pane.replaceChildren();text(pane,'h1','','Reviews');for(const review of parsed.querySelectorAll('.review_box')){const card=make('article','ghp-review');pane.append(card);picture(card,review.querySelector('.game_capsule')?.src);const title=review.querySelector('.title a');anchor(card,title?.textContent.trim()||'Read review',title?.href);text(card,'p','ghp-muted',review.querySelector('.hours')?.textContent.trim());text(card,'p','',review.querySelector('.content')?.textContent.trim());text(card,'small','',review.querySelector('.posted')?.textContent.trim());}if(pane.children.length===1)text(pane,'p','ghp-empty','No public reviews are available.');}
 async function show(name,app){
  if(disposed)return;if(keyboardRequested)win.GPShowVirtualKeyboard?.(false);finishSearch();closeComparison=null;remember();active=name;detail=false;const revision=++generation;for(const c of requests)c.abort();requests.clear();
  links.forEach((a,i)=>{if(names[i]===name)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  overview.forEach(n=>{n.hidden=name!=='Overview';});if(remaining)remaining.hidden=name!=='Overview';pane.hidden=name==='Overview';shell.dataset.tab=name;
  focus(links[names.indexOf(name)]);if(name==='Overview'){content.scrollTo?.(0,mem.get(name)?.scroll||0);return;}
  status('Loading '+name.toLowerCase()+'…');
  try{
   if(name==='Games'||name==='Achievements'){const data=gameHubProfileGames(await read('/games/?tab=all'));if(disposed||revision!==generation)return;if(name==='Achievements'&&app){const parsed=await read('/achievements/'+app);if(disposed||revision!==generation)return;achievementRows(gameHubProfileAchievements(parsed,app),app,data.all.find(g=>g.id===Number(app))?.name);}else if(name==='Games'&&app){const game=data.all.find(g=>g.id===Number(app))||data.followed.find(g=>g.id===Number(app));pane.replaceChildren();detail=true;button(pane,'‹ All games',()=>route('Games'));text(pane,'h1','',game?.name||'Game');const card=make('div','ghp-game-detail');pane.append(card);picture(card,`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${app}/header.jpg`);if(game)text(card,'p','',`${Math.round(game.minutes/6)/10} hours played`);button(card,'Achievements',()=>route('Achievements',app));anchor(card,'Game hub',`https://steamcommunity.com/app/${app}`);anchor(card,'Steam Store',`https://store.steampowered.com/app/${app}/`);}else if(name==='Achievements')trophyGames(data);else gridGames(data);}
   else if(name==='Friends'||name==='Groups'){const parsed=await read(name==='Friends'?'/friends/':'/groups/');if(disposed||revision!==generation)return;people(parsed,name==='Groups');}
   else if(name==='Reviews'){const parsed=await read('/recommended/');if(disposed||revision!==generation)return;reviews(parsed);}
   else {pane.replaceChildren();text(pane,'h1','','Inventory');text(pane,'p','ghp-empty','Browse this player’s Steam inventory. Item actions and trading are handled by Steam.');anchor(pane,'Open Steam inventory',base.href+'/inventory/');}
   content.scrollTo?.(0,0);if(restoreGame){const el=[...pane.querySelectorAll('[data-appid]')].find(n=>n.dataset.appid===restoreGame);focus(el);if(el&&axis)followVertical(axis,content,el);else el?.scrollIntoView({block:'nearest'});restoreGame=null;}
  }catch(e){if(disposed||revision!==generation)return;status(e.name==='AbortError'?'Steam took too long to respond. Please retry.':e.message||'Steam data is unavailable.');button(pane,'Retry',()=>show(name,app));anchor(pane,'Open in Steam',base.href+(name==='Games'?'/games/?tab=all':name==='Achievements'&&app?'/achievements/'+app:name==='Reviews'?'/recommended/':'/'+name.toLowerCase()+'/'));}
 }
 const click=e=>{const a=e.target.closest?.('a');if(!a||!shell.contains(a)||e.ctrlKey||e.metaKey)return;const message=a.href.match(/^steam:\/\/friends\/message\/(7656119\d{10})$/);
 if(message&&win.SteamClient?.BrowserView?.PostMessageToParent){e.preventDefault();e.stopImmediatePropagation();win.SteamClient.BrowserView.PostMessageToParent('GameHubProfileMessage',message[1]);return;}
 const destination=new URL(a.href,base);if(destination.origin===base.origin&&/^\/(?:profiles\/\d+|id\/[a-zA-Z0-9_-]+)\/?$/.test(destination.pathname)&&destination.pathname.replace(/\/$/,'')!==base.pathname.replace(/\/$/,'')&&win.SteamClient?.BrowserView?.PostMessageToParent){e.preventDefault();e.stopImmediatePropagation();win.SteamClient.BrowserView.PostMessageToParent('GameHubProfileOpen',JSON.stringify({url:destination.href,returnURL:location.href}));return;}
 let name,app;const idx=links.indexOf(a);if(idx>=0)name=names[idx];else if(a.closest('.ghp-trophy-overview'))name='Achievements';else {const u=new URL(a.href,base);if(u.origin===base.origin&&u.pathname.startsWith(base.pathname+'/')){const p=u.pathname.slice(base.pathname.length);name=/^\/friends\/?$/.test(p)?'Friends':/^\/groups\/?$/.test(p)?'Groups':/^\/games\/?$/.test(p)?'Games':/^\/recommended\/?$/.test(p)?'Reviews':/^\/inventory\/?$/.test(p)?'Inventory':null;const m=p.match(/^\/(?:achievements|stats)\/(\d+)\/?$/);if(m){name='Achievements';app=m[1];}}}if(!name)return;e.preventDefault();e.stopImmediatePropagation();route(name,app);};
 shell.addEventListener('click',click,true);
 const blocked=()=>doc.hidden||doc.activeElement?.matches('input:not([readonly]),textarea,select,[contenteditable="true"]')||[...doc.querySelectorAll('.newmodal,.modal_frame,[role="dialog"],.popup_menu,details[open]')].some(e=>e.getClientRects().length&&win.getComputedStyle(e).visibility!=='hidden');
 const down=e=>{if(blocked())return;const b=e.detail?.button,dir=b===5?-1:b===6?1:0;if(!dir)return;e.preventDefault();e.stopImmediatePropagation();if(held.has(b)||e.detail?.is_repeat)return;held.add(b);const controls=[...tabs.querySelectorAll('a,.btn_profile_action')].filter(el=>el.getClientRects().length&&!el.parentElement.closest('a,.btn_profile_action')).sort((a,b)=>a.getBoundingClientRect().left-b.getBoundingClientRect().left);
  const current=controls.includes(doc.activeElement)?doc.activeElement:links[names.indexOf(active)];
  const target=controls[Math.max(0,Math.min(controls.length-1,controls.indexOf(current)+dir))];
  if(!target){route(names[Math.max(0,Math.min(names.length-1,names.indexOf(active)+dir))]);return;}
  if(links.includes(target))route(names[links.indexOf(target)]);
  focus(target);};
 const up=e=>{if(e.detail?.button===5||e.detail?.button===6){held.delete(e.detail.button);if(!blocked()){e.preventDefault();e.stopImmediatePropagation();}}};
 let lastBack=-Infinity;
 const back=e=>{if(blocked()||(e.type==='keydown'&&e.key!=='Escape'))return;e.preventDefault();e.stopImmediatePropagation();if(e.repeat||e.detail?.is_repeat||Date.now()-lastBack<250)return;lastBack=Date.now();if(closeComparison){closeComparison();return;}if(detail){route(active);return;}if(content.contains(doc.activeElement)){focus(links[names.indexOf(active)]);return;}if(active!=='Overview')route('Overview');else if(win.SteamClient?.BrowserView?.PostMessageToParent){win.SteamClient.BrowserView.PostMessageToParent('GameHubProfileExit','{}');}else if(doc.referrer&&new URL(doc.referrer).origin===base.origin){history.back();}};
 const hash=()=>{const m=location.hash.match(/^#ghp-(overview|games|achievements|friends|groups|inventory|reviews)(?:-(\d+))?$/);show(m?names.find(n=>n.toLowerCase()===m[1]):'Overview',m?.[2]);};
 const blur=()=>held.clear();win.addEventListener('vgp_onbuttondown',down,true);win.addEventListener('vgp_onbuttonup',up,true);win.addEventListener('vgp_oncancel',back,true);win.addEventListener('keydown',back,true);win.addEventListener('popstate',hash);win.addEventListener('blur',blur);
 const overviewTotal=shell.querySelector('.ghp-overview-total');if(overviewTotal)read('/games/?tab=all').then(parsed=>{if(disposed)return;const games=gameHubProfileGames(parsed).all.filter(g=>g.progress?.achievable>0),earned=games.reduce((n,g)=>n+g.progress.unlocked,0);if(!games.length)return;overviewTotal.textContent=String(earned);overviewTotal.parentElement.firstChild.textContent='Achievements earned';const art=shell.querySelector('.ghp-trophy-overview .ghp-overview-art');text(art,'strong','ghp-overview-earned',String(earned));text(art,'small','ghp-overview-detail',games.filter(g=>g.progress.unlocked===g.progress.achievable).length+' completed games');}).catch(()=>{});
 const hint=make('span','ghp-bumper-hint','LB / RB');hint.setAttribute('aria-hidden','true');nav.prepend(hint);if(location.hash.startsWith('#ghp-'))hash();
 return ()=>{badgeObserver?.disconnect();releaseRequests.forEach(c=>c.abort());for(const type of ['click','vgp_onok'])win.removeEventListener(type,editComment,true);for(const name of ['vgp_onok','vgp_oncancel','vgp_ondirection','vgp_onbuttondown','vgp_onbuttonup','keydown'])win.removeEventListener(name,searchEvent,true);doc.removeEventListener('focusin',searchFocus,true);finishSearch();gems?.disconnect();doc.removeEventListener('visibilitychange',visibility);disposed=true;++generation;requests.forEach(c=>c.abort());cache.clear();shell.removeEventListener('click',click,true);win.removeEventListener('vgp_onbuttondown',down,true);win.removeEventListener('vgp_onbuttonup',up,true);win.removeEventListener('vgp_oncancel',back,true);win.removeEventListener('keydown',back,true);win.removeEventListener('popstate',hash);win.removeEventListener('blur',blur);overview.forEach(n=>n.hidden=false);if(remaining)remaining.hidden=false;pane.remove();overview.forEach(n=>shell.append(n));if(remainingMarker)remainingMarker.replaceWith(remaining);content.remove();hint.remove();};
}
