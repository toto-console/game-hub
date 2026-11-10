import {useEffect,useMemo,useRef,useState} from 'react';
import {DialogButton,Focusable,ModalRoot,Navigation,TextField,showModal} from '@decky/ui';
import {readLibrary,SHORTCUT,isInstalled} from './library-data';
import {useLibraryRevision} from './library-live';
import {artworkURL,loadMediaPins,saveMediaPins,moveMediaPin,useMediaPins,MediaPin} from './media-pins';
import {focusControl} from './navigation';
import {openGameMenu} from './home/upstream/steam';
export function openMediaManager(initial:'all'|'choose'|'manage'='all',id?:number){const anchor=document.activeElement as HTMLElement|null;let handle:ReturnType<typeof showModal>;const close=()=>{handle?.Close();requestAnimationFrame(()=>focusControl(anchor?.isConnected?anchor:document.querySelector<HTMLElement>('.gh-media-picked')));};handle=showModal(<ModalRoot bHideCloseIcon bDisableBackgroundDismiss onCancel={close}><MediaManager initial={initial} initialId={id} close={close}/></ModalRoot>,window,{bNeverPopOut:true,bHideActionIcons:true,strTitle:'Media Apps'});}
export function MediaManager({initial='all',initialId,close}:{initial?:'all'|'choose'|'manage';initialId?:number;close:()=>void}){
 const [page,setPage]=useState<string>(initialId?'edit':initial),[id,setId]=useState(initialId),[query,setQuery]=useState(''),[error,setError]=useState(''),[tick,setTick]=useState(0);
 const pins=useMediaPins(),revision=useLibraryRevision(),root=useRef<HTMLDivElement>(null);
 const apps=useMemo(()=>readLibrary(window as any).entries,[revision,tick]);
 const app=apps.find(a=>a.appid===id),pin=pins.find(p=>p.id===id);
 const [label,setLabel]=useState(''),[icon,setIcon]=useState(''),[background,setBackground]=useState('');
 useEffect(()=>{setLabel(pin?.label??'');setIcon(pin?.icon??'');setBackground(pin?.background??'');},[id,page]);
 useEffect(()=>{const frame=requestAnimationFrame(()=>focusControl(root.current?.querySelector<HTMLElement>('button,input')));return()=>cancelAnimationFrame(frame);},[page,id]);
 const back=()=>{if(page==='all')close();else if(page==='edit'||page==='confirm')setPage(page==='edit'?'manage':'choose');else setPage('all');};
 const run=(fn:()=>void)=>{try{fn();setError('');}catch(e){setError(e instanceof Error?e.message:'Could not save your Media preferences.');}};
 const button=(text:string,fn:()=>void)=><DialogButton key={text} className="gh-media-control" onClick={()=>run(fn)}>{text}</DialogButton>;
 return <Focusable ref={root} className="gh-media-manager" flow-children="column" onCancelButton={e=>{e.stopPropagation();back();}}><style>{`.gh-media-manager{background:linear-gradient(125deg,#152639,#080e18);color:white;padding:28px;border-radius:20px;max-height:80vh;overflow:auto;min-width:55vw;display:flex;flex-direction:column;gap:12px}.gh-media-control{border-radius:12px!important;text-align:left!important;background:#ffffff12!important;color:white!important;min-height:44px}.gh-media-control.gpfocus,.gh-media-control:focus{outline:2px solid white}.gh-media-manager label{display:block;margin-top:10px}`}</style>
 <h2>{page==='choose'?'Choose from Steam Library':page==='edit'?'App Settings':page==='manage'?'Manage Apps':page==='confirm'?'Add to Media Home':'Media Apps'}</h2>
 {error&&<p role="alert">{error}</p>}
 {page==='all'&&<>{button('+ Add App',()=>setPage('add'))}{button('Manage Apps',()=>setPage('manage'))}</>}
 {page==='add'&&<>{button('Choose from Steam Library',()=>setPage('choose'))}{button('Add Non-Steam Application',()=>setPage('nonsteam'))}{button('Manage Media Shortcuts',()=>setPage('manage'))}</>}
 {page==='nonsteam'&&<><p>In Steam desktop, select Games → Add a Non-Steam Game to My Library. Select your installed application or Browse, then confirm Add Selected Programs. Return here and choose your new shortcut. For UWP or special launchers, use their supported Steam setup instructions.</p>{button('Open official Steam instructions',()=>Navigation.NavigateToExternalWeb('https://help.steampowered.com/en/faqs/view/4B8B-9697-2338-40EC'))}{button('Refresh and choose shortcut',()=>{setTick(n=>n+1);setPage('choose');})}</>}
 {page==='choose'&&<><TextField value={query} label="Search apps and shortcuts" onChange={e=>setQuery(e.target.value)}/>{button('Refresh App List',()=>setTick(n=>n+1))}{apps.filter(a=>a.display_name.toLowerCase().includes(query.toLowerCase())).map(a=>button(`${a.display_name} · ${a.app_type===SHORTCUT?'Non-Steam':isInstalled(a)?'Installed':'Not installed'}${pins.some(p=>p.id===a.appid)?' · Pinned':''}`,()=>{setId(a.appid);setPage('confirm');}))}{!apps.length&&<p>Steam’s library is not ready. Return to Steam and try Refresh App List.</p>}</>}
 {page==='confirm'&&<><p>{app?.display_name??'Shortcut unavailable'}</p>{app&&button('Add to Media Home',()=>{const current=loadMediaPins();if(!current.some(p=>p.id===id))saveMediaPins([...current,{id:app.appid}]);setPage('manage');})}</>}
 {page==='manage'&&<>{button('+ Add App',()=>setPage('add'))}{pins.map(p=>button(p.label||apps.find(a=>a.appid===p.id)?.display_name||`Unavailable shortcut (${p.id})`,()=>{setId(p.id);setPage('edit');}))}{!pins.length&&<p>Add your favorite streaming apps and media shortcuts.</p>}</>}
 {page==='edit'&&pin&&<><p>{app?.display_name??'Unavailable in Steam. Your pin is preserved.'}</p><TextField label="Display label (blank uses Steam name)" value={label} onChange={e=>setLabel(e.target.value)}/><TextField label="Change Icon · HTTPS image URL (blank uses Steam artwork)" value={icon} onChange={e=>setIcon(e.target.value)}/><TextField label="Change Background · HTTPS image URL" value={background} onChange={e=>setBackground(e.target.value)}/><p>These overrides affect only Media. Existing Steam and SteamGridDB artwork is preserved.</p>{button('Save appearance',()=>{const updated:MediaPin={id:pin.id,label:label.trim(),icon:artworkURL(icon),background:artworkURL(background)};saveMediaPins(loadMediaPins().map(p=>p.id===id?updated:p));setPage('manage');})}{button('Move Left',()=>saveMediaPins(moveMediaPin(loadMediaPins(),pin.id,-1)))}{button('Move Right',()=>saveMediaPins(moveMediaPin(loadMediaPins(),pin.id,1)))}{app&&button('Open Steam shortcut options',()=>{close();openGameMenu(app);})}{button('Remove from Media Home',()=>{saveMediaPins(loadMediaPins().filter(p=>p.id!==id));setPage('manage');})}</>}
 {button('Back',back)}
 </Focusable>;
}
