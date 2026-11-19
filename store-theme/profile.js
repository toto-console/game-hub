/* Profile presentation over the signed-in Steam document. Never reconstruct account actions. */
function isGameHubProfileURL(raw){try{const u=new URL(raw);return u.origin==='https://steamcommunity.com'&&!u.username&&!u.password&&/^\/(?:id\/[a-zA-Z0-9_-]+|profiles\/\d+)\/?$/.test(u.pathname)&&[...u.searchParams.keys()].every(k=>['l','snr','insideModal'].includes(k));}catch{return false;}}
function installGameHubProfile(options,css){
 const doc=document,win=window,root=doc.documentElement,version=123,originalURL=location.href,previous=win.__gameHubStoreAppearance;
 if(!options.enabled||!isGameHubProfileURL(originalURL)||!root.classList.contains('GamepadMode')){previous?.dispose();return {applied:false,reason:'Native Steam profile'};}
 if(win.__gameHubStoreOriginalURL===originalURL)return {applied:false,reason:'Original Steam profile selected for this visit'};
 const ready=()=>{try{win.SteamClient?.BrowserView?.PostMessageToParent?.('GameHubProfileReady',location.href);}catch{}};
 if(previous?.version===version){previous.update(options,css);ready();return {applied:true,reason:'Console profile active'};}
 previous?.dispose();
 const page=doc.querySelector('.responsive_page_template_content > .profile_page'),header=page?.querySelector('.profile_header_content'),persona=header?.querySelector('.actual_persona_name'),avatar=header?.querySelector('.playerAvatar');
 if(!page||!header||!persona||!avatar)return {applied:false,reason:'Profile is private or its layout is not recognized; native Steam remains available'};
 const base=new URL(originalURL);base.search='';base.hash='';base.pathname=base.pathname.replace(/\/$/,'');
 const moved=[],attributes=[],cleanups=[],created=[];let disposed=false;
 try {
 const make=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
 const attr=(n,key,value)=>{if(!n)return;attributes.push([n,key,n.getAttribute(key)]);n.setAttribute(key,value);};
 const move=(node,parent)=>{if(!node)return;const marker=doc.createComment('Game Hub profile return');node.before(marker);moved.push([node,marker]);parent.append(node);};
 const focusable=n=>{if(n){attr(n,'data-ghp-focus','');if(!n.hasAttribute('data-panel'))attr(n,'data-panel',JSON.stringify({focusable:true,noFocusRing:true}));if(!n.isConnected&&win.$J)win.$J(n).data('panel',{focusable:true,noFocusRing:true,fnScrollIntoViewHandler:()=>true});if(!n.matches('a,button,summary,input,select,textarea'))attr(n,'tabindex','0');}return n;};
 const link=(label,path,cls='ghp-tab')=>{const a=make('a',cls,label);a.href=base.href+path;focusable(a);return a;};
 const icons={award:'M12 2l8 5v10l-8 5-8-5V7ZM12 6l1.2 2.5 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4ZM10 15v3l2-1 2 1v-3',search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',bell:'M5 17h14l-2-4V9a5 5 0 0 0-10 0v4ZM10 21h4',settings:'M9 2h6l1 4 4 1 2 5-3 3 1 4-5 3-3-3-4 1-3-5 3-3ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',inventory:'M3 7l9-5 9 5v11l-9 5-9-5ZM3 7l9 6 9-6M12 13v10',trophy:'M7 3h10v6a5 5 0 0 1-10 0ZM7 5H3v3a5 5 0 0 0 5 5M17 5h4v3a5 5 0 0 1-5 5M12 14v6m-5 1h10'};
 const icon=name=>{const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');const p=doc.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',icons[name]);svg.append(p);return svg;};
 const shell=make('section','ghp-shell');shell.setAttribute('aria-label','Steam profile overview');page.prepend(shell);created.push(shell);
 const nav=make('nav','ghp-nav');nav.setAttribute('aria-label','Profile');shell.append(nav);
 const tabs=make('div','ghp-tabs');nav.append(tabs);
 const overview=link('Overview','');overview.setAttribute('aria-current','page');overview.addEventListener('click',e=>{e.preventDefault();shell.scrollIntoView({block:'start'});});tabs.append(overview);
 tabs.append(link('Games','/games/?tab=all'));
 const achievementTab=link('Achievements','#ghp-achievements');tabs.append(achievementTab);
 for(const [title,path] of [['Friends','/friends/'],['Groups','/groups/'],['Inventory','/inventory/'],['Reviews','/recommended/']])tabs.append(link(title,path));
 const tools=make('div','ghp-tools');nav.append(tools);
 const search=link('','/','ghp-icon');search.href='https://steamcommunity.com/search/users/';search.setAttribute('aria-label','Search Steam players');search.title='Search Steam players';search.append(icon('search'));tools.append(search);
 const notifications=link('','/','ghp-icon');notifications.href='https://steamcommunity.com/my/commentnotifications/';notifications.setAttribute('aria-label','Steam comment notifications');notifications.title='Steam comment notifications';notifications.append(icon('bell'));tools.append(notifications);
 const settings=make('details','ghp-options'),summary=focusable(make('summary','ghp-icon'));summary.setAttribute('aria-label','Profile display settings');summary.title='Profile display settings';summary.append(icon('settings'));settings.append(summary);tools.append(settings);
 const restore=focusable(make('button','ghp-original','Use original Steam profile'));restore.type='button';restore.addEventListener('click',()=>win.__gameHubStoreAppearance?.original());settings.append(restore);
 const hero=make('div','ghp-hero'),identity=make('div','ghp-identity');shell.insertBefore(hero,nav);move(avatar,hero);hero.append(identity);
 move(header.querySelector('.profile_header_centered_col'),identity);
 const accent=make('span','ghp-accent');accent.setAttribute('aria-hidden','true');persona.after(accent);created.push(accent);
 const status=page.querySelector('.responsive_status_info');move(status,identity);
 // Keep the actual name/location and native summary. No inferred country, language or membership.
 const actions=header.querySelector('.profile_header_actions');move(actions,tabs);actions?.querySelectorAll('a,.btn_profile_action').forEach(focusable);
 const stats=make('div','ghp-stats');shell.append(stats);
 const card=(kind)=>{const c=focusable(make('div','ghp-stat ghp-'+kind));c.setAttribute('data-ghp-card','');c.setAttribute('role','button');c.setAttribute('aria-label',kind==='collection'?'Games':kind[0].toUpperCase()+kind.slice(1));c.addEventListener('click',e=>{if(e.target===c){const a=c.querySelector('.profile_count_link,a');a?.click();}});stats.append(c);return c;};
 const levelLink=header.querySelector('.persona_level_btn');
 if(levelLink){move(levelLink,persona.parentElement);persona.after(levelLink);attr(levelLink,'class',levelLink.className+' ghp-name-level');attr(levelLink,'aria-label','Steam level '+(levelLink.querySelector('.friendPlayerLevelNum')?.textContent.trim()||levelLink.textContent.trim()));focusable(levelLink);}

 const badges=page.querySelector('.profile_badges');if(badges){move(badges,identity);attr(badges,'class',badges.className+' ghp-header-badges');badges.querySelectorAll('a').forEach(focusable);}
 if(status){move(status,persona.parentElement);attr(status,'class',status.className+' ghp-name-status');}
 for(const [kind,selector] of [['friends','.profile_friend_links'],['groups','.profile_group_links']]){
  const node=page.querySelector(selector),c=card(kind);if(node){move(node,c);node.querySelectorAll('a').forEach(focusable);}else c.append(link(kind[0].toUpperCase()+kind.slice(1),'/' + (kind==='badges'?'badges':kind) + '/'));
 }
 const friendCard=stats.querySelector('.ghp-friends'),friends=friendCard.querySelectorAll('.friendBlock');
 if(friends.length>3){const count=Number(friendCard.querySelector('.profile_count_link_total')?.textContent.trim());const more=link(Number.isFinite(count)&&count>3?'+'+(count-3):'More','/friends/','ghp-friend-more');friendCard.querySelector('.profile_topfriends')?.append(more);created.push(more);}
 const inventory=card('inventory'),inventoryLink=link('Inventory','/inventory/','ghp-inventory-link');inventoryLink.prepend(icon('inventory'));inventory.append(inventoryLink);
 // Four tall overview cards mirror the reference, using actual Steam data.
 const secondary=make('div','ghp-secondary');shell.append(secondary);
 secondary.append(stats.querySelector('.ghp-groups'),inventory);
 const collection=card('collection'),collectionLink=link('','/games/?tab=all','ghp-collection-link'),covers=make('div','ghp-collection-covers');collection.append(collectionLink);collectionLink.append(covers);
 const gameCountSource=page.querySelector('.profile_item_links a[href*="/games"] .profile_count_link_total');
 const collectionLabel=make('span','ghp-card-caption','Games');collectionLink.append(collectionLabel);
 if(gameCountSource?.textContent.trim())collectionLabel.append(make('strong','',gameCountSource.textContent.trim()));
 const originalRecent=page.querySelector('.recent_games');
 for(const image of [...originalRecent?.querySelectorAll('.game_capsule')||[]].slice(0,3)){const copy=make('img');const gameId=image.closest('a')?.href.match(/\/app\/(\d+)/)?.[1];copy.src=gameId?`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${gameId}/library_600x900.jpg`:image.src;copy.alt='';copy.addEventListener('error',()=>{copy.src=image.src;},{once:true});covers.append(copy);}
 stats.insertBefore(collection,friendCard);
 const trophies=card('trophy-overview'),trophyLink=link('','#ghp-achievements','ghp-overview-link');trophies.setAttribute('aria-label','Achievements');trophies.append(trophyLink);const trophyTop=make('div','ghp-overview-art');trophyTop.append(icon('trophy'));trophyLink.append(trophyTop);const trophyCaption=make('span','ghp-card-caption','Achievements');trophyCaption.append(make('strong','ghp-overview-total','View progress'));trophyLink.append(trophyCaption);stats.prepend(trophies);
 const awards=card('awards'),awardsNode=page.querySelector('.profile_awards');awards.setAttribute('aria-label','Profile Awards');if(awardsNode){move(awardsNode,awards);awardsNode.querySelectorAll('a').forEach(focusable);}else{const awardsLink=link('','/awards/','ghp-overview-link'),art=make('div','ghp-overview-art');art.append(icon('award'));awardsLink.append(art,make('span','ghp-card-caption','No profile awards displayed'));awards.append(awardsLink);}stats.insertBefore(awards,collection);
 const about=make('section','ghp-about');about.append(make('h2','','About'));
 const biography=[...identity.querySelectorAll('.profile_summary:not(.mobile),.profile_header_summary:not(.mobile)')].find(n=>n.textContent.trim());
 if(biography){move(biography,about);shell.insertBefore(about,secondary);}
 const recent=make('section','ghp-recent');recent.append(make('h2','','Recently Played'));shell.append(recent);
 const games=page.querySelector('.recent_games');if(games)move(games,recent);else recent.append(make('p','ghp-empty','Recent games are not shared on this profile.'));
 const strip=make('section','ghp-achievements');strip.id='ghp-achievements';strip.setAttribute('aria-label','Game achievements');shell.append(strip);
 const stripTitle=make('div','ghp-achievement-title');stripTitle.append(icon('trophy'));const titleText=make('div');titleText.append(make('strong','','Achievements'));const gameLabel=make('small');titleText.append(gameLabel);stripTitle.append(titleText);strip.append(stripTitle);
 const stripContent=make('div','ghp-achievement-content');strip.append(stripContent);
 const originalStats=new Map();let selected;
 function selectGame(game){
  if(selected===game)return;selected?.classList.remove('ghp-selected');selected=game;game.classList.add('ghp-selected');
  stripContent.replaceChildren();const detailGame=originalStats.get(game)?.querySelector('.game_info_achievement_summary')?game:recentGames.find(g=>originalStats.get(g)?.querySelector('.game_info_achievement_summary'))||game;const native=originalStats.get(detailGame);if(native){stripContent.append(native);native.querySelectorAll('a,[role="button"]').forEach(n=>{if(!n.hasAttribute('data-ghp-focus'))focusable(n);});}
  else stripContent.append(make('p','ghp-empty','No achievement progress shared for this game.'));
  gameLabel.textContent=detailGame.querySelector('.game_name')?.textContent.trim()||'';
  const summary=native?.querySelector('.game_info_achievement_summary a')?.textContent.match(/([\d,]+)\s*\/\s*([\d,]+)/);
  if(summary){const earned=Number(summary[1].replaceAll(',','')),total=Number(summary[2].replaceAll(',',''));if(total>0&&earned<=total)stripContent.append(make('span','ghp-percentage',Math.floor(100*earned/total)+'%'));}
 }
 const recentGames=[...games?.querySelectorAll('.recent_game')||[]];
 for(const game of recentGames){
  focusable(game);attr(game,'data-ghp-card','');attr(game,'role','button');const activate=e=>{if(e.target===game)game.querySelector('.game_info_cap a,.game_name a')?.click();};game.addEventListener('click',activate);cleanups.push(()=>game.removeEventListener('click',activate));
  const native=game.querySelector('.game_info_stats');if(native){const holder=make('div');move(native,holder);originalStats.set(game,native);}
  const target=game.querySelector('.game_info_cap a')||game.querySelector('.game_name a');if(target){focusable(target);attr(target,'aria-label',game.querySelector('.game_name')?.textContent.trim()||'Open game');}
  const image=game.querySelector('.game_capsule'),match=target?.href.match(/^https:\/\/steamcommunity\.com\/app\/(\d+)(?:\/|$)/);
  if(image&&match){const original=image.getAttribute('src');attr(image,'src',`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${match[1]}/header.jpg`);const fallback=()=>{if(original)image.src=original;};image.addEventListener('error',fallback,{once:true});cleanups.push(()=>image.removeEventListener('error',fallback));}
  const focus=()=>selectGame(game);game.addEventListener('focusin',focus);game.addEventListener('pointerenter',focus);cleanups.push(()=>{game.removeEventListener('focusin',focus);game.removeEventListener('pointerenter',focus);game.classList.remove('ghp-selected');});
 }
 if(recentGames.length)selectGame(recentGames[0]);else stripContent.append(make('p','ghp-empty','Achievement progress is not shared on this profile.'));
 const jump=e=>{e.preventDefault();const first=strip.querySelector('[data-ghp-focus]');(first||strip).scrollIntoView({block:'nearest'});first?.focus({preventScroll:true});};achievementTab.addEventListener('click',jump);
 const remaining=page.querySelector('.profile_content');if(remaining)attr(remaining,'data-ghp-remaining','');
 const style=make('style');style.id='game-hub-profile-theme';style.textContent=css;doc.head.append(style);created.push(style);
 root.dataset.ghProfile='console';root.dataset.ghProfileMotion=String(options.motion);
 const pausedByTheme=new Set(),media=win.matchMedia?.('(prefers-reduced-motion: reduce)');
 const syncMedia=()=>{for(const video of page.querySelectorAll('.profile_animated_background video')){
  if(!options.motion||media?.matches||doc.hidden){if(!video.paused){pausedByTheme.add(video);video.pause();}}
  else if(pausedByTheme.delete(video)){video.play()?.catch(()=>{});}
 }};
 doc.addEventListener('visibilitychange',syncMedia);media?.addEventListener('change',syncMedia);syncMedia();
 cleanups.push(()=>{doc.removeEventListener('visibilitychange',syncMedia);media?.removeEventListener('change',syncMedia);for(const v of pausedByTheme){if(!doc.hidden)v.play()?.catch(()=>{});}pausedByTheme.clear();});
 const stopNavigation=connectActivityNavigation(doc,()=>!disposed&&isGameHubProfileURL(location.href),{region:'.ghp-shell,[data-ghp-remaining]',targets:'[data-ghp-focus],[data-ghp-remaining] a[href],[data-ghp-remaining] button,[data-ghp-remaining] textarea,[data-ghp-remaining] [contenteditable=true],[data-ghp-remaining] [role="button"]',focusClass:'ghp-focus',gridNavigation:true,cardSelector:'[data-ghp-card]'});
 // Profile cards own their reflection; do not layer the floating feed outline over them.
 const stopGloss=()=>{};
 cleanups.push(stopNavigation,stopGloss);
 const before={pushState:history.pushState,replaceState:history.replaceState},wrapped={};
 const sameProfile=raw=>{try{const u=new URL(raw,location.href);return isGameHubProfileURL(u.href)&&u.pathname.replace(/\/$/,'')===base.pathname;}catch{return false;}};
 const changed=()=>{if(!sameProfile(location.href))dispose();};
 // Keep the themed document in the browser back-forward cache; disposal restores native nodes only on explicit disable.
 const hide=()=>{};
 const dispose=()=>{if(disposed)return;disposed=true;for(const fn of cleanups)fn();
  for(const [node,marker] of moved.reverse()){if(marker.parentNode)marker.replaceWith(node);}
  for(const [node,key,value] of attributes.reverse()){if(value===null)node.removeAttribute(key);else node.setAttribute(key,value);}
  for(const node of created)node.remove();delete root.dataset.ghProfile;delete root.dataset.ghProfileMotion;
  win.removeEventListener('pagehide',hide);win.removeEventListener('popstate',changed);win.removeEventListener('pageshow',changed);
  for(const key of Object.keys(before))if(history[key]===wrapped[key])history[key]=before[key];
  delete win.__gameHubStoreAppearance;
 };
 for(const key of Object.keys(before)){wrapped[key]=function(...args){if(args[2]!=null&&!sameProfile(args[2]))dispose();return before[key].apply(this,args);};history[key]=wrapped[key];}
 win.addEventListener('pagehide',hide);win.addEventListener('popstate',changed);win.addEventListener('pageshow',changed);
 if(typeof connectGameHubProfileTabs==='function')cleanups.push(connectGameHubProfileTabs({doc,win,shell,nav,tabs,base,make,focusable,options:()=>options}));
 win.__gameHubStoreAppearance={version,dispose,update(next,nextCSS){options=next;style.textContent=nextCSS;syncMedia();root.dataset.ghProfileMotion=String(next.motion);},original(){win.__gameHubStoreOriginalURL=location.href;dispose();}};
 ready();return {applied:true,reason:'Steam profile overview with console layout'};
 }catch{
  disposed=true;for(const stop of cleanups){try{stop();}catch{}}
  for(const [node,marker] of moved.reverse()){if(marker.parentNode)marker.replaceWith(node);}
  for(const [node,key,value] of attributes.reverse()){if(value===null)node.removeAttribute(key);else node.setAttribute(key,value);}
  for(const node of created)node.remove();delete root.dataset.ghProfile;delete root.dataset.ghProfileMotion;
  return {applied:false,reason:'Profile layout unavailable; original Steam profile restored'};
 }
}
