import {callable} from '@decky/api';

import {Focusable,Navigation} from '@decky/ui';

import {useEffect,useRef,useState,type ReactNode} from 'react';

import {MdEmojiEvents,MdSportsEsports,MdStorage,MdFavorite,MdShoppingBag,MdNewspaper,MdGroup,MdChat,MdAccessibility,MdPhotoLibrary} from 'react-icons/md';

import {focusControl} from '../navigation';

import {motionAllowed} from '../focus-motion';

import {Art,useFocusHook} from './upstream/components';

import {openStore,openDetails,openAchievements,heroUrls,portraitUrls,landscapeUrls,type App} from './upstream/steam';

import {defaults,sanitizeSettings,preset,insert,arrange,neighbor,firstWidget,WIDGETS,TITLES,rememberWelcome,welcomeReturn,type WidgetId,type WelcomeSettings,type Cell} from './welcome-layout';

import {useWelcomeData} from './welcome-data';

import {welcomeServices} from './welcome-services';

import {WelcomeBackground} from './WelcomeBackground';
import {welcomeCSS} from './welcome-style';

const getSettings=callable<[],WelcomeSettings>('welcome_settings'),saveSettings=callable<[settings:WelcomeSettings],boolean>('save_welcome_settings');

const icons:Record<WidgetId,ReactNode>={achievements:<MdEmojiEvents/>,controller:<MdSportsEsports/>,storage:<MdStorage/>,favorites:<MdPhotoLibrary/>,store:<MdShoppingBag/>,news:<MdNewspaper/>,friends:<MdGroup/>,wishlist:<MdFavorite/>,activity:<MdGroup/>,messages:<MdChat/>,accessibility:<MdAccessibility/>};

export function WelcomeIcon(){return <svg width="1em" height="1em" viewBox="0 0 80 80" aria-hidden="true" style={{width:'1em',height:'1em',flexShrink:0}}><g fill="currentColor"><rect x="9" y="11" width="27" height="27" rx="1"/><rect x="44" y="9" width="27" height="27" rx="1" transform="rotate(-13 57.5 22.5)"/><rect x="9" y="44" width="27" height="27" rx="1"/><rect x="44" y="44" width="27" height="27" rx="1"/></g><g fill="none" stroke="#202126" strokeWidth="3"><path d="M16 18h13v13H16Z"/><path d="m57 15 8 13H49Z"/><path d="m16 51 13 13m0-13L16 64"/><circle cx="57.5" cy="57.5" r="8"/></g></svg>;}

function Control({children,onClick,onFocus,className='',id}:{children:ReactNode;onClick:()=>void;onFocus?:(el:HTMLElement)=>void;className?:string;id?:string}){

 const ref=useFocusHook(onFocus);return <Focusable ref={ref} role="button" tabIndex={0} data-gh-control data-welcome-control={id} className={`ghw-control ${className}`} focusClassName="ghd-focused" noFocusRing onActivate={onClick} onClick={onClick} onFocus={e=>onFocus?.(e.currentTarget)}>{children}</Focusable>;

}

export function WelcomeHub({active,app,favorite,back,onSettings,initialSettings,backgroundManaged=false}:{active:boolean;app?:App;favorite?:App;back:()=>void;onSettings?:(settings:WelcomeSettings)=>void;initialSettings?:WelcomeSettings;backgroundManaged?:boolean}){

 const [settings,setSettings]=useState(()=>initialSettings??defaults()),[ready,setReady]=useState(!!initialSettings),[error,setError]=useState(''),[editing,setEditing]=useState(false),[moving,setMoving]=useState<WidgetId>(),[draft,setDraft]=useState<Cell[]>(),[selection,setSelection]=useState<WidgetId>(welcomeReturn??'achievements');

 const root=useRef<HTMLDivElement>(null),file=useRef<HTMLInputElement>(null),latest=useRef(settings),saving=useRef(Promise.resolve());latest.current=settings;

 const data=useWelcomeData(active,app),cells=draft??settings.cells;

 const connected=data.friends.kind==='ready',online=connected?data.friends.friends.filter(f=>f.state!=='offline'):[];

 const game=data.game,earned=game?.achievements.filter(a=>a.done).sort((a,b)=>b.unlocked-a.unlocked).slice(0,4)??[];

 const news=data.news[0],store=data.store[0];

 useEffect(()=>{if(initialSettings)return;let stopped=false;getSettings().then(raw=>{if(!stopped){const next=sanitizeSettings(raw);setSettings(next);onSettings?.(next);setReady(true);}}).catch(()=>{if(!stopped){setError('Welcome preferences could not load. Retry by reopening Welcome.');}});return()=>{stopped=true;};},[]);

 const persist=(next:WelcomeSettings)=>{if(!ready)return;next=sanitizeSettings(next);setSettings(next);onSettings?.(next);latest.current=next;setError('');saving.current=saving.current.then(async()=>{if(!await saveSettings(next))throw Error('Save failed');}).catch(()=>setError('Layout applies for this session; saving failed. Please try again.'));};

 const focus=(id:WidgetId)=>{setSelection(id);focusControl(root.current?.querySelector<HTMLElement>(`[data-widget="${id}"]`));};

 const reveal=(el:HTMLElement)=>{const view=root.current?.querySelector<HTMLElement>('.ghw-viewport');if(!view)return;const a=el.getBoundingClientRect(),b=view.getBoundingClientRect();if(a.left<b.left+8)view.scrollBy({left:a.left-b.left-8,behavior:motionAllowed(el)?'smooth':'auto'});else if(a.right>b.right-8)view.scrollBy({left:a.right-b.right+8,behavior:motionAllowed(el)?'smooth':'auto'});};

 const openEditor=()=>{if(!ready){setError('Welcome preferences are still loading.');return;}setEditing(true);requestAnimationFrame(()=>focusControl(root.current?.querySelector<HTMLElement>('.ghw-editor .ghw-control')));};

 const closeEditor=()=>{setEditing(false);setMoving(undefined);setDraft(undefined);requestAnimationFrame(()=>focus(latest.current.cells.some(c=>c.id===ref.current.selection)?ref.current.selection:latest.current.cells[0].id));};

 const go=(id:WidgetId)=>{rememberWelcome(id);try{

  const services=welcomeServices();switch(id){

   case 'friends':services?.actions.hub('Friends');break;

   case 'messages':services?.actions.hub('Messages');break;

   case 'activity':services?.actions.web('https://steamcommunity.com/my/home/');break;

   case 'controller':services?.actions.accessories();break;

   case 'storage':Navigation.Navigate('/settings/storage');break;

   case 'favorites':favorite?openDetails(favorite):services?.actions.games();break;

   case 'achievements':app?openAchievements(app):services?.actions.games();break;

   case 'store':store?services?.actions.web(`https://store.steampowered.com/app/${store.id}/`):openStore();break;

   case 'news':news?services?.actions.web(news.url):openStore();break;

   case 'wishlist':openStore('wishlist');break;

   case 'accessibility':openEditor();break;

  }

 }catch{setError('Steam could not open this destination. Try again once Steam is ready.');}};

 useEffect(()=>{if(!editing&&!moving)return;const doc=root.current?.ownerDocument;if(!doc)return;const blocked=Array.from(doc.querySelectorAll<HTMLElement>('.ghd-home-row,.ghd-topicons,.ghd-tabbar')).map(el=>({el,inert:el.inert}));for(const {el} of blocked)el.inert=true;return()=>{for(const {el,inert} of blocked)el.inert=inert;};},[editing,moving]);

 const ref=useRef({cells,selection,editing,moving,settings,back});ref.current={cells,selection,editing,moving,settings,back};

 useEffect(()=>{const el=root.current;if(!el||!active)return;const handle=(e:Event)=>{

  const state=ref.current;let target=e.target as HTMLElement;if(state.editing){if(target.closest('#game-hub-control-center'))return;target=(el.ownerDocument.activeElement?.closest('.ghw-editor')?el.ownerDocument.activeElement as HTMLElement:null)??el.querySelector<HTMLElement>('.ghw-editor .ghd-focused')??el.querySelector<HTMLElement>('.ghw-editor .ghw-control')??target;}else if(state.moving){if(target.closest('#game-hub-control-center'))return;target=el.querySelector<HTMLElement>(`[data-widget="${state.moving}"]`)??target;}else if(!target.closest('.gh-welcome'))return;const k=e as KeyboardEvent,d=(e as CustomEvent).detail;

  const direction=e.type==='vgp_ondirection'?d?.button:({ArrowUp:9,ArrowDown:10,ArrowLeft:11,ArrowRight:12} as Record<string,number>)[k.key];

  const cancel=e.type==='vgp_oncancel'||k.key==='Escape',menu=e.type==='gh-welcome-edit'||e.type==='vgp_onmenu'||k.key==='ContextMenu';

  const stop=()=>{e.preventDefault();e.stopImmediatePropagation();};

  if(menu){stop();if(!k.repeat&&!d?.is_repeat)openEditor();return;}

  if(cancel){stop();if(state.moving){setMoving(undefined);setDraft(undefined);setEditing(true);requestAnimationFrame(()=>focusControl(el.querySelector<HTMLElement>('.ghw-editor .ghw-control')));}else if(state.editing)closeEditor();else state.back();return;}

  if(state.editing&&!state.moving){if(e.type==='vgp_onok'||k.key==='Enter'){stop();if(!k.repeat&&!d?.is_repeat)target.closest<HTMLElement>('.ghw-control')?.click();return;}if(direction!==undefined){stop();const nodes=Array.from(el.querySelectorAll<HTMLElement>('.ghw-editor .ghw-control'));const current=target.closest<HTMLElement>('.ghw-control');if(!current)return;const a=current.getBoundingClientRect(),dx=direction===11?-1:direction===12?1:0,dy=direction===9?-1:direction===10?1:0;const candidates=nodes.filter(n=>n!==current).map(n=>({n,r:n.getBoundingClientRect()})).filter(({r})=>dx?(r.left+r.width/2-a.left-a.width/2)*dx>1:(r.top+r.height/2-a.top-a.height/2)*dy>1);const score=(r:DOMRect)=>{const x=Math.abs(r.left+r.width/2-a.left-a.width/2),y=Math.abs(r.top+r.height/2-a.top-a.height/2);return dx?x+y*5:y+x*3;};candidates.sort((b,c)=>score(b.r)-score(c.r));if(candidates[0]){focusControl(candidates[0].n);candidates[0].n.scrollIntoView({block:'nearest'});}}return;}

  if(state.moving&&(e.type==='vgp_onok'||k.key==='Enter')){stop();if(!k.repeat&&!d?.is_repeat){persist({...latest.current,preset:'Custom',cells:state.cells});setMoving(undefined);setDraft(undefined);}return;}
  if(direction===undefined)return;


  if(!target.closest('[data-widget]'))return;stop();

  const dx=direction===11?-1:direction===12?1:0,dy=direction===9?-1:direction===10?1:0;

  if(state.moving){const old=state.cells.find(c=>c.id===state.moving)!;const next=arrange(state.cells,old.id,{x:old.x+dx*4,y:old.y+dy});setDraft(next);setError('');requestAnimationFrame(()=>{const item=el.querySelector<HTMLElement>(`[data-widget="${old.id}"]`);if(item)reveal(item);});return;}
  const next=neighbor(state.cells,state.selection,dx,dy);if(next)focus(next);else if(direction===9)state.back();

 };for(const name of ['keydown','vgp_ondirection','vgp_oncancel','vgp_onmenu','vgp_onok','gh-welcome-edit'])el.ownerDocument.addEventListener(name,handle,true);return()=>{for(const name of ['keydown','vgp_ondirection','vgp_oncancel','vgp_onmenu','vgp_onok','gh-welcome-edit'])el.ownerDocument.removeEventListener(name,handle,true);};},[active,ready]);

 useEffect(()=>{if(!active||!ready||!welcomeReturn)return;const id=welcomeReturn;rememberWelcome(undefined);requestAnimationFrame(()=>focus(settings.cells.some(c=>c.id===id)?id:settings.cells[0].id));},[active,ready]);

 const resize=()=>{const c=settings.cells.find(c=>c.id===selection);if(!c)return;const h=c.h%3+1;persist({...settings,preset:'Custom',cells:arrange(settings.cells,c.id,{h,y:Math.min(c.y,3-h)})});};
 const beginMove=()=>{if(!settings.cells.some(c=>c.id===selection)){setError("Show this widget before moving it.");return;}setDraft(settings.cells);setMoving(selection);setEditing(false);requestAnimationFrame(()=>focus(latest.current.cells.some(c=>c.id===ref.current.selection)?ref.current.selection:latest.current.cells[0].id));};

 const artwork=(sources:string[])=> <Art className="ghw-art" sources={sources}/>;

 const content=(id:WidgetId):ReactNode=>{switch(id){

  case 'achievements':return <><div className="ghw-statline"><span>{app?.display_name??'Your Steam achievements'}</span><b>{game?.total!==undefined?`${game.done} / ${game.total}`:'Open achievements'}</b></div><div className="ghw-awards">{earned.length?earned.map(a=><div key={a.id} title={a.name}>{a.image?<img src={a.image} alt=""/>:<MdEmojiEvents/>}<span>{a.name}</span></div>):<div className="ghw-empty-awards"><MdEmojiEvents/><span>{game?.achievementState==='empty'?'No achievements in this game':game?.achievementState==='unavailable'?'Achievements temporarily unavailable':'Your recent game achievements'}</span></div>}</div>{!!game?.total&&<div className="ghw-completion"><span>{Math.round((game.done??0)/game.total*100)}% unlocked</span><progress max={game.total} value={game.done??0}/></div>}</>;

  case 'storage':return <div className="ghw-storage-content"><span>{data.system.storage?.label??'System storage'}</span><b>{data.system.storage?`${(data.system.storage.free/1073741824).toFixed(2)} GB free`:'Open storage'}</b>{data.system.storage&&<progress max={data.system.storage.total} value={data.system.storage.total-data.system.storage.free}/>}</div>;

  case 'controller':{const c=data.system.controllers?.[0];return <div className="ghw-accessory"><span className={`ghw-device ${c||data.controllers.length?'connected':''}`}><MdSportsEsports/></span><span>{c?`Controller ${c.index}`:data.controllers.length?'Controller connected':'Controller settings'}<small>{c?(c.wired?'Wired connection':c.level?`Battery: ${c.level}`:'Battery not reported'):data.controllers.length?'Battery not reported':'Connect a controller'}</small></span></div>;}

  case 'favorites':return <>{favorite&&artwork([...heroUrls(favorite),...portraitUrls(favorite)])}<div className="ghw-caption"><strong>{favorite?.display_name??'Your favorite games'}</strong></div></>;

  case 'store':return <>{store?.image&&artwork([store.image])}<div className="ghw-caption"><strong>{store?.name??'Discover your next game'}</strong><small>{store?.category??'Explore Steam'}</small></div></>;

  case 'news':return <div className="ghw-news-content">{news?.image&&<img src={news.image} alt=""/>}<strong>{news?.headline??'Steam game news'}</strong><small>{news?`${news.category}${news.date?' · '+news.date:''}`:'Releases and announcements'}</small></div>;

  case 'friends':return <><div className="ghw-friends-content">{online.slice(0,4).map(f=><span key={f.id} title={f.name}>{f.avatar?<img src={f.avatar} alt={f.name}/>:f.name.slice(0,1)}<i/></span>)}<b>{connected?`${online.length} online`:'Offline / unavailable'}</b></div>{online[0]&&<small>{online[0].name}{online[0].game?' · '+online[0].game:''}</small>}</>;

  case 'wishlist':return <><div className="ghw-wish-art"><MdFavorite/></div><div className="ghw-caption"><strong>Your Steam Wishlist</strong><small>Open your saved games and current prices</small></div></>;

  case 'activity':return <><div className="ghw-playing">{online.filter(f=>f.state==='playing').slice(0,(cells.find(c=>c.id==='activity')?.h??2)===3?3:2).map(f=><div key={f.id}>{f.avatar&&<img src={f.avatar} alt=""/>}<span><b>{f.name}</b><small>Playing {f.game??'a game'}</small></span></div>)}</div><div className="ghw-caption"><strong>Friends’ activity</strong><small>Open Steam for shared achievements, screenshots and updates</small></div></>;

  case 'messages':return <div className="ghw-news-content"><strong>{data.inbox?.connected?`${data.inbox.conversations.reduce((n,c)=>n+c.unread,0)} unread`:'Open conversations'}</strong><small>{data.inbox?.connected?data.inbox.conversations[0]?.name??'No recent conversations':'Steam chat unavailable'}</small></div>;

  case 'accessibility':return <div className="ghw-news-content"><strong>Make it yours</strong><small>Welcome motion, text size and contrast</small></div>;

 }};


 return <div ref={root} className="gh-welcome" data-motion={!settings.reducedMotion} data-large={settings.largeText} data-contrast={settings.contrast}>

  <style>{welcomeCSS}</style>{!backgroundManaged&&<WelcomeBackground settings={settings} app={app}/>}

  <div className="ghw-viewport" inert={editing}><div className="ghw-grid" style={{gridTemplateColumns:`repeat(${Math.max(12,...cells.map(c=>c.x+c.w))}, calc((27.3vw - 3 * 1.3vw) / 4))`}}>

  {cells.map(c=><Widget key={c.id} entry={c.id===firstWidget(cells)} cell={c} selected={selection===c.id} onFocus={el=>{setSelection(c.id);reveal(el);}} activate={()=>{if(moving){persist({...settings,preset:'Custom',cells});setMoving(undefined);setDraft(undefined);}else go(c.id);}}>{content(c.id)}</Widget>)}

  </div></div>

  {moving&&<div className="ghw-move-status" role="status">Move {TITLES[moving]} · D-pad to move (nearby widgets adjust automatically) · A to save · B to cancel</div>}

  {error&&<div className="ghw-error" role="status">{error}</div>}

  {editing&&<Focusable className="ghw-editor" role="dialog" aria-modal="true" aria-label="Edit Welcome widgets" flow-children="column"><h2>Customize Welcome</h2><div className="ghw-editor-scroll"><div className="ghw-editor-row">{['PS5 Reference Layout','Social','Gaming','Minimal','Custom'].map(p=><Control key={p} onClick={()=>{if(p==='Custom'&&!settings.custom){setError('Save a custom arrangement first.');return;}persist({...settings,preset:p,cells:p==='Custom'?settings.custom!:preset(p)});}}>{p}</Control>)}</div><p>{settings.preset} · Select a widget, then move, resize or hide it.</p><div className="ghw-editor-row">{WIDGETS.map(id=><Control key={id} className={selection===id?'ghw-chosen':''} onClick={()=>setSelection(id)}>{TITLES[id]}{settings.cells.some(c=>c.id===id)?' ✓':''}</Control>)}</div><div className="ghw-editor-row"><Control onClick={beginMove}>Move {TITLES[selection]}</Control><Control onClick={resize}>Resize</Control><Control onClick={()=>{const found=settings.cells.some(c=>c.id===selection);if(found&&settings.cells.length===1){setError('Keep at least one widget visible.');return;}persist({...settings,preset:'Custom',cells:found?settings.cells.filter(c=>c.id!==selection):insert(settings.cells,selection)});}}>Show / Hide</Control><Control onClick={()=>persist({...settings,preset:'Custom',custom:settings.cells.map(c=>({...c}))})}>Save custom arrangement</Control></div><h3>Background</h3><div className="ghw-editor-row">{(['abstract','existing','game'] as const).map(b=><Control key={b} onClick={()=>persist({...settings,background:b})}>{b==='abstract'?'Abstract sculpture':b==='game'?'Recent game artwork':'Existing Home background'}</Control>)}<Control onClick={()=>file.current?.click()}>Choose local image</Control></div><input ref={file} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>5_000_000||!['image/png','image/jpeg','image/webp'].includes(f.type)){setError('Choose a PNG, JPEG or WebP image under 5 MB.');return;}const reader=new FileReader();reader.onload=()=>persist({...latest.current,background:'local',image:String(reader.result)});reader.onerror=()=>setError('The image could not be read.');reader.readAsDataURL(f);}}/><h3>Wallpaper placement</h3><div className="ghw-editor-row">{(['welcome','home'] as const).map(scope=><Control key={scope} className={settings.wallpaperScope===scope?'ghw-chosen':''} onClick={()=>persist({...settings,wallpaperScope:scope})}>{scope==='welcome'?'Welcome only':'Welcome + entire Home screen'}{settings.wallpaperScope===scope?' (selected)':''}</Control>)}</div><h3>Welcome accessibility</h3><div className="ghw-editor-row"><Control onClick={()=>persist({...settings,largeText:!settings.largeText})}>Larger text: {settings.largeText?'On':'Off'}</Control><Control onClick={()=>persist({...settings,contrast:!settings.contrast})}>High contrast: {settings.contrast?'On':'Off'}</Control><Control onClick={()=>persist({...settings,reducedMotion:!settings.reducedMotion})}>Reduced motion: {settings.reducedMotion?'On':'Off'}</Control></div><p>Friend activity previews show current playing presence only. Shared achievements, acquisitions and wishlist events remain in Steam’s privacy-controlled Activity view.</p></div><Control onClick={closeEditor}>Done</Control></Focusable>}

 </div>;

}

function Widget({cell:c,entry,children,onFocus,activate,selected}:{cell:Cell;entry:boolean;children:ReactNode;onFocus:(el:HTMLElement)=>void;activate:()=>void;selected:boolean}){

 const ref=useFocusHook(onFocus);return <Focusable ref={ref} role="button" tabIndex={0} data-gh-control data-widget={c.id} data-welcome-entry={entry?true:undefined} preferredFocus={entry} aria-label={TITLES[c.id]} className={`ghw-widget ghw-${c.id}`} data-size={c.h} focusClassName="ghd-focused" noFocusRing style={{gridColumn:`${c.x+1} / span ${c.w}`,gridRow:`${c.y+1} / span ${c.h}`}} onActivate={activate} onClick={activate} onFocus={e=>onFocus(e.currentTarget)}><div className="ghw-title">{icons[c.id]}<span>{TITLES[c.id]}</span></div>{children}</Focusable>;

}

