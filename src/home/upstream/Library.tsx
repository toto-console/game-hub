import {useDownloadsSnapshot} from '../../downloads-live';
import {openNativeLibraryRecovery} from '../native-library';
import {GameDetail} from '../GameDetail';
import {useSoundtrackScope} from '../../themedeck-adapter';
import {Focusable,GamepadButton,Navigation} from '@decky/ui';
import {memo,useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {MdSort} from 'react-icons/md';
import {GameTile,FOCUSED_CLASS} from './components';
import {readLibrary,isInstalled,lastPlayed,SHORTCUT,type LibraryApp} from '../../library-data';
import {useLibraryRevision} from '../../library-live';
import {type Transfer} from '../../downloads';
import {focusControl,focusNavigation} from '../../navigation';

type Sort='recent'|'az'|'za'|'playtime'|'installed'|'added';
const sorts:{id:Sort;name:string}[]=[{id:'recent',name:'Recently Played'},{id:'az',name:'Name A–Z'},{id:'za',name:'Name Z–A'},{id:'playtime',name:'Playtime'},{id:'installed',name:'Install Status'}];
const memories=new Map<string,{id?:number;top:number}>();
let detailAppId:number|undefined;
const preferenceKey='game-hub.library.view.v1';
function preferences(){try{return JSON.parse(sessionStorage.getItem(preferenceKey)??'{}');}catch{return {};}}
const LibraryTile=memo(function LibraryTile({app,first,progress,onOpen}:{onOpen:(app:LibraryApp)=>void;app:LibraryApp;first:boolean;progress?:Transfer;revision:number}){
 return <div className="ghl-cell" data-library-id={app.appid}><GameTile app={app} size="small" preferredFocus={first} onActivate={()=>onOpen(app)}/>{progress&&<div className="ghl-progress"><span>{progress.status}{progress.percent!==undefined?` · ${Math.round(progress.percent)}%`:''}</span><progress max={100} value={progress.percent} aria-label={progress.status}/></div>}</div>;
});
function Control({children,active,onActivate,className=''}:{children:React.ReactNode;active?:boolean;onActivate:()=>void;className?:string}){
 return <Focusable className={`ghl-control ${className} ${active?'ghl-active':''}`} focusClassName={FOCUSED_CLASS} noFocusRing onActivate={onActivate}>{children}</Focusable>;
}
export function LibraryTab({initialView='installed',back}:{initialView?:string;back:()=>void}){
 const [selectedGame,setSelectedGame]=useState<LibraryApp|undefined>(()=>detailAppId?(window as any).appStore?.GetAppOverviewByAppID(detailAppId):undefined);
 useSoundtrackScope("library",!selectedGame);
 const revision=useLibraryRevision(!selectedGame),snapshot=useMemo(()=>readLibrary(window as any),[revision]);
 const [tab,setTab]=useState<'installed'|'collection'>(()=>initialView==='installed'?(preferences().tab==='collection'?'collection':'installed'):'collection');
 const [filter,setFilter]=useState<string>(()=>['apps','favorites','nonsteam'].includes(initialView)?initialView:preferences().filter??'all');
 const [sort,setSort]=useState<Sort>(()=>sorts.some(s=>s.id===preferences().sort)?preferences().sort:'recent');
 const [menu,setMenu]=useState(false);const root=useRef<HTMLDivElement>(null),grid=useRef<HTMLDivElement>(null);
 const filters=[{id:'all',name:'All Games & Apps'},{id:'games',name:'Games'},{id:'installed',name:'Installed'},{id:'uninstalled',name:'Not Installed'},{id:'favorites',name:'Favorites'},{id:'nonsteam',name:'Non-Steam'},{id:'steam',name:'Steam Games'},{id:'apps',name:'Applications'},...snapshot.collections.map(c=>({id:'c:'+c.id,name:c.name}))];
 const effective=filters.some(f=>f.id===filter)?filter:'all';
 const list=useMemo(()=>{
  const ids=effective==='favorites'?new Set(snapshot.favorites.map(a=>a.appid)):effective.startsWith('c:')?new Set(snapshot.collections.find(c=>c.id===effective.slice(2))?.apps.map(a=>a.appid)??[]):undefined;
  return snapshot.entries.filter(a=>(tab!=='installed'||isInstalled(a))&&(!ids||ids.has(a.appid))&&(effective!=='games'||a.app_type!==2)&&(effective!=='installed'||isInstalled(a))&&(effective!=='uninstalled'||!isInstalled(a))&&(effective!=='nonsteam'||a.app_type===SHORTCUT)&&(effective!=='steam'||a.app_type===1)&&(effective!=='apps'||a.app_type===2)).sort((a,b)=>{
   const name=a.display_name.localeCompare(b.display_name,undefined,{sensitivity:'base'});
   return sort==='az'?name:sort==='za'?-name:sort==='playtime'?(b.minutes_playtime_forever??0)-(a.minutes_playtime_forever??0)||name:sort==='installed'?Number(isInstalled(b))-Number(isInstalled(a))||name:sort==='added'?(b.rt_purchased_time??0)-(a.rt_purchased_time??0)||name:lastPlayed(b)-lastPlayed(a)||name;
  });
 },[snapshot,tab,effective,sort]);
 const downloads=useDownloadsSnapshot(!selectedGame);
 const transfers=useMemo(()=>new Map(downloads.rows.filter(r=>r.section!=='completed'&&r.section!=='uploads').map(r=>[r.appid,r])),[downloads]);
 const key=`${tab}:${effective}:${sort}`;
 const state=useRef({menu,key,list,tab});state.current={menu,key,list,tab};
 const remember=useCallback(()=>{const g=grid.current;if(!g)return;const previous=memories.get(state.current.key);const selected=g.querySelector<HTMLElement>('.ghd-focused')?.closest<HTMLElement>('[data-library-id]');memories.set(state.current.key,{id:selected?Number(selected.dataset.libraryId):previous?.id,top:g.scrollTop});},[]);
 const openGame=useCallback((a:LibraryApp)=>{remember();detailAppId=a.appid;setSelectedGame(a);},[remember]);
 useEffect(()=>{try{sessionStorage.setItem(preferenceKey,JSON.stringify({filter,sort,tab}));}catch{}},[filter,sort,tab]);
 useLayoutEffect(()=>{
  if(selectedGame)return;
  const frame=requestAnimationFrame(()=>{const r=root.current;if(!r)return;if(menu){focusControl(r.querySelector<HTMLElement>('.ghl-menu .ghl-control'));return;}
   const saved=memories.get(key);const target=saved?.id?r.querySelector<HTMLElement>(`[data-library-id="${saved.id}"] .ghd-tile`):null;
   focusControl(target??r.querySelector<HTMLElement>('.ghl-grid .ghd-tile')??r.querySelector<HTMLElement>('.ghl-tabs .ghl-control'));
   if(grid.current&&saved)grid.current.scrollTop=saved.top;
  });return()=>cancelAnimationFrame(frame);
 },[key,menu,selectedGame]);
 useEffect(()=>{
  const r=root.current;if(!r)return;
  const stop=(e:Event)=>{e.preventDefault();e.stopImmediatePropagation();};
  const close=()=>{if(state.current.menu)setMenu(false);else{remember();back();}};
  const handler=(e:Event)=>{
   const t=e.target as HTMLElement;if(!r.contains(t))return;
   const b=(e as CustomEvent).detail?.button,k=(e as KeyboardEvent).key;
   if(k==='Escape'){stop(e);if(!(e as KeyboardEvent).repeat)close();return;}
   if(e.type==='vgp_onbuttondown'&&(b===GamepadButton.BUMPER_LEFT||b===GamepadButton.BUMPER_RIGHT)){stop(e);if(!state.current.menu&&!(e as CustomEvent).detail?.is_repeat){remember();setTab(state.current.tab==='installed'?'collection':'installed');}return;}
   if(e.type==='vgp_onbuttondown')return;
   const delta=b===9||k==='ArrowUp'?-5:b===10||k==='ArrowDown'?5:b===11||k==='ArrowLeft'?-1:b===12||k==='ArrowRight'?1:0;
   if(!delta)return;
   // Every directional repeat belongs to this screen, including its outer edges.
   stop(e);
   if(state.current.menu){const nodes=Array.from(r.querySelectorAll<HTMLElement>('.ghl-menu .ghl-control')),i=nodes.findIndex(n=>n.contains(t));if(i>=0){stop(e);focusNavigation(nodes[Math.max(0,Math.min(nodes.length-1,i+(delta<0?-1:1)))]);}return;}
   const nodes=Array.from(r.querySelectorAll<HTMLElement>('.ghl-grid .ghd-tile'));const i=nodes.findIndex(n=>n.contains(t));
   if(i>=0){stop(e);remember();if(delta===-5&&i<5)focusNavigation(r.querySelector<HTMLElement>(`.ghl-tabs .ghl-control:nth-child(${state.current.tab==='installed'?1:2})`));else if(delta===-1&&i%5===0)focusNavigation(r.querySelector<HTMLElement>('.ghl-sort'));else if(delta===1&&i%5===4)return;else focusNavigation(nodes[Math.max(0,Math.min(nodes.length-1,i+delta))]);return;}
   const tabs=Array.from(r.querySelectorAll<HTMLElement>('.ghl-tabs .ghl-control'));
   const activeTab=tabs[state.current.tab==='installed'?0:1];
   const saved=memories.get(state.current.key);
   const savedTile=nodes.find(n=>Number(n.closest<HTMLElement>('[data-library-id]')?.dataset.libraryId)===saved?.id)??nodes[0];
   if(t.closest('.ghl-sort')){if(delta===-5)focusNavigation(activeTab);else if(delta===1||delta===5)focusNavigation(savedTile??activeTab);return;}
   if(t.closest('.ghl-tabs')){const index=tabs.findIndex(n=>n.contains(t));if(delta===5)focusNavigation(savedTile??r.querySelector<HTMLElement>('.ghl-sort'));else if(delta===-1||delta===1)focusNavigation(tabs[Math.max(0,Math.min(tabs.length-1,index+delta))]);return;}
   focusNavigation(savedTile??activeTab);

  };
  const focus=(e:Event)=>{const t=e.target as HTMLElement;const menuItem=t.closest<HTMLElement>('.ghl-menu .ghl-control');if(menuItem){menuItem.scrollIntoView({block:'nearest'});return;}if(!t.closest('.ghl-grid'))return;const g=grid.current,item=t.closest<HTMLElement>('[data-library-id]');if(g&&item){const a=g.getBoundingClientRect(),b=item.getBoundingClientRect();if(b.top<a.top+5)g.scrollTop+=b.top-a.top-5;else if(b.bottom>a.bottom-5)g.scrollTop+=b.bottom-a.bottom+5;memories.set(state.current.key,{id:Number(item.dataset.libraryId),top:g.scrollTop});}};
  for(const ev of ['keydown','vgp_ondirection','vgp_onbuttondown'])r.addEventListener(ev,handler,true);
  for(const ev of ['focusin','vgp_onfocus'])r.addEventListener(ev,focus,true);
  return()=>{remember();for(const ev of ['keydown','vgp_ondirection','vgp_onbuttondown'])r.removeEventListener(ev,handler,true);for(const ev of ['focusin','vgp_onfocus'])r.removeEventListener(ev,focus,true);};
 },[back]);
 return <><div hidden={!!selectedGame}><Focusable ref={root} className="ghl-root" flow-children="column" onCancelButton={(e:any)=>{e?.stopPropagation?.();e?.preventDefault?.();if(menu)setMenu(false);else{remember();back();}}}>
  <header className="ghl-header"><span className="ghl-library-icon"><svg viewBox="0 0 32 32" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M3 3h6v6H3zm8 0h6v6h-6zm8 0h6v6h-6zM3 11h6v6H3zm8 0h6v6h-6zm8 0h6v4h-6zM3 19h6v6H3z"/><path d="M15 18c-3 0-4 2-5 6l-1 5c0 2 2 2 3 1l3-3h10l3 3c1 1 3 1 3-1l-1-5c-1-4-2-6-5-6z"/><path d="M15 21v5m-2.5-2.5h5" stroke="#111318" strokeWidth="1.8"/><circle cx="25" cy="22" r="1.2" fill="#111318"/><circle cx="27" cy="25" r="1.2" fill="#111318"/></svg></span><h1>Game Library</h1></header>
  <Focusable className="ghl-tabs" flow-children="row" style={menu?{visibility:'hidden'}:undefined}>
   <Control active={tab==='installed'} onActivate={()=>{remember();setTab('installed');}}>Installed</Control><Control active={tab==='collection'} onActivate={()=>{remember();setTab('collection');}}>Your Collection</Control>
  </Focusable>
  {!menu&&<><Control className="ghl-sort" onActivate={()=>{remember();setMenu(true);}}><MdSort/></Control><div className="ghl-count">{filters.find(f=>f.id===effective)?.name} · {list.length} {tab==='installed'?'installed':'in collection'}</div>
  {!snapshot.ready?<div className="ghl-empty">Steam library is unavailable. Open Sort & Filters for native Steam recovery.</div>:list.length===0?<div className="ghl-empty">No games match these filters.</div>:<Focusable ref={grid} className="ghl-grid ghd-grid" flow-children="grid" onScroll={remember}>{list.map((app,i)=><LibraryTile key={app.appid} app={app} onOpen={openGame} revision={revision} first={i===0} progress={transfers.get(app.appid)}/>)}</Focusable>}</>}
  {menu&&<Focusable className="ghl-menu" flow-children="column"><h2>Sort & Filters</h2>{[...sorts,...(snapshot.entries.some(a=>(a.rt_purchased_time??0)>0)?[{id:'added' as Sort,name:'Purchase date (Steam metadata)'}]:[])].map(s=><Control key={s.id} active={sort===s.id} onActivate={()=>{setSort(s.id);setMenu(false);}}>{s.name}</Control>)}<h3>Filter</h3>{filters.map(f=><Control key={f.id} active={effective===f.id} onActivate={()=>{setFilter(f.id);setMenu(false);}}>{f.name}</Control>)}<Control onActivate={openNativeLibraryRecovery}>Open native Steam Library</Control><Control onActivate={()=>setMenu(false)}>Back</Control></Focusable>}
 </Focusable></div>{selectedGame&&<GameDetail app={selectedGame} back={()=>{detailAppId=undefined;setSelectedGame(undefined);}}/>}</>;
}
