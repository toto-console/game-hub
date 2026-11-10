import {socialCardCSS,revealSocialCard} from './social-card-style';
import {DockIcon,dockIconCSS,dockSelectionLeft} from './dock-icons';
import {GameNewsCard} from './GameNewsCard';
import {useDownloadsSnapshot} from './downloads-live';
import {readDockPresence,FriendsOnlineCounter,ProfilePresenceBadge,presenceCSS,type Presence} from './presence';
import {useFocusPresentation,focusMotionCSS,motionAllowed} from './focus-motion';
import {useCenterFooter} from './center-footer';
import {readDownloads,type DownloadHost} from './downloads';
import {MicrophoneMenu} from './MicrophoneMenu';
import {GameActivity,GameAsset,useGameActivity,gameActivityCSS} from './GameActivity';
import {Panel} from './Panel';
import {GameSwitcher} from './GameSwitcher';
import {Navigation,Router} from '@decky/ui';
import {MusicPage} from './MusicPage';
import {useMusic,pluginShortcuts} from './music-adapter';
import {decky} from './decky-adapter';
import {useProfileState,useProfileRef,useProfileFocus,returningFromProfile} from './profile-return';
import {ambientVariables} from './ambient-style';
import {QuickMenu} from './QuickMenu';
import {classMap} from '@decky/ui';
import {fullscreenCSS} from './fullscreen';
import {ModalRoot,showModal,type ShowModalResult} from '@decky/ui';
import type {NotificationStore,HubNotice} from './notification-store';
import {SystemMenu} from './SystemMenu';
import {DownloadsPage} from './DownloadsPage';
import {CenterSettings} from './CenterSettings';
import {Component,useEffect,useLayoutEffect,useRef,useState,useSyncExternalStore,type ReactNode} from 'react';
import {type Controls,type HubTab} from './Panel';
import {type SocialBridge,safeAvatar} from './model';
import {type Settings} from './settings';
import {type VoiceSnapshot} from './voice';
import {focusControl,focusNavigation} from './navigation';
import {type ControlCenterStore} from './control-center-entry';
import {controlCenterCSS} from './control-center-style';

type IconName='music'|'home'|'games'|'bell'|'people'|'download'|'sound'|'mic'|'controller'|'profile'|'power'|'message'|'headset';
const paths:Record<IconName,string>={music:'M9 18V5l12-3v13M9 9l12-3M9 18a3 3 0 1 1-3-3c2 0 3 1 3 3Zm12-3a3 3 0 1 1-3-3c2 0 3 1 3 3Z',home:'M3 11 12 3l9 8v10h-6v-7H9v7H3Z',games:'M5 7h16v14H5ZM3 3h14M9 11h8M9 15h5',bell:'M5 17h14l-2-4V9a5 5 0 0 0-10 0v4ZM10 21h4M12 2v2',people:'M8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-1a3 3 0 1 0 0-6M2 21v-3a6 6 0 0 1 12 0v3Zm14-7a6 6 0 0 1 6 6v1h-5',download:'M12 2v13m-5-5 5 5 5-5M3 15v6h18v-6',sound:'M3 9h4l5-5v16l-5-5H3Zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16',mic:'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8',controller:'M7 6h10c3 0 4 3 5 12 0 3-3 3-6-2H8c-3 5-6 5-6 2 1-9 2-12 5-12Zm0 4v4m-2-2h4m7-1h.01M19 13h.01',profile:'M8 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0ZM3 22v-3a9 9 0 0 1 18 0v3',power:'M12 2v10M6 5a9 9 0 1 0 12 0',message:'M21 11a9 8 0 0 1-13 7l-5 3 1-6A9 8 0 1 1 21 11ZM8 10h.01M12 10h.01M16 10h.01',headset:'M3 14V11a9 9 0 0 1 18 0v3M3 12h3v8H3Zm15 0h3v8h-3Zm3 8c0 2-4 2-7 2'};
function Icon({name}:{name:IconName}){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>;}
function ProfileIcon({avatar}:{avatar?:string}){
 const [failed,setFailed]=useState<string>();
 return avatar&&failed!==avatar?<img key={avatar} className="gcc-dock-avatar" src={avatar} alt="" referrerPolicy="no-referrer" draggable={false} onError={()=>setFailed(avatar)}/>:<Icon name="profile"/>;
}
class Boundary extends Component<{children:ReactNode;fail:()=>void},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}componentDidCatch(){this.props.fail();}render(){return this.state.failed?null:this.props.children;}}
export type CenterActions={web:(url:string)=>void;library:(id?:number)=>void;hub:(tab:HubTab,conversation?:string,friend?:string)=>void;home:()=>void;games:()=>void;notifications:()=>void;downloads:()=>void;sound:()=>void;accessories:()=>void;profile:()=>Promise<()=>void>;power:(anchor:HTMLElement,onCancel:()=>void)=>void;exitGame?:()=>void|Promise<void>;decky:()=>void;deckyPage:(page:'store'|'settings')=>void;steamSettings:()=>void;voiceSettings:()=>void;notificationSettings:()=>void};
type Props={beforeProfile:()=>void;store:ControlCenterStore;controls:Controls;bridge:SocialBridge;settings:Settings;notifications:NotificationStore;saveSettings:(s:Settings)=>void;actions:CenterActions};
export function ControlCenter(props:Props){return <Boundary fail={()=>props.store.fail()}><Host {...props}/></Boundary>;}
function Host(props:Props){
 const modal=useRef<ShowModalResult|undefined>(undefined);
 const [downloadRequest,setDownloadRequest]=useState<{appid:number;origin:HTMLElement|null;external:boolean;serial:number}>();
 const notices=useSyncExternalStore(props.notifications.subscribe,props.notifications.getSnapshot,props.notifications.getSnapshot);
 const marker=useRef<HTMLSpanElement>(null);const [main,setMain]=useState(false);
 const open=useSyncExternalStore(props.store.subscribe,props.store.getSnapshot,props.store.getSnapshot);
 useLayoutEffect(()=>{const doc=marker.current?.ownerDocument;if(!doc||!props.store.owns(doc))return;setMain(true);return props.store.mount(doc);},[props.store]);
 useEffect(()=>{const doc=marker.current?.ownerDocument;if(!doc||!props.store.owns(doc))return;return props.notifications.start(()=>props.store.getSnapshot()||!!doc.querySelector('.gbs-room'));},[props.notifications,props.store]);
 useEffect(()=>{if(main)props.notifications.refresh();},[main,open,props.settings,props.notifications]);
 useEffect(()=>{const doc=marker.current?.ownerDocument;if(!doc||!props.store.owns(doc))return;
  const receive=(event:Event)=>{const d=(event as CustomEvent).detail;if(!Number.isSafeInteger(d?.appid)||d.appid<=0)return;const external=!props.store.getSnapshot();if(external&&!props.store.show())return;event.preventDefault();setDownloadRequest({appid:d.appid,origin:d.origin,external,serial:Date.now()});};
  doc.addEventListener('game-hub:open-downloads',receive);return()=>doc.removeEventListener('game-hub:open-downloads',receive);
 },[props.store]);
 useEffect(()=>{if(!open)setDownloadRequest(undefined);},[open]);
 const modalContent=()=> <ModalRoot className="gbs-modal-owner" bAllowFullSize bHideCloseIcon bDisableBackgroundDismiss onCancel={()=>{const el=marker.current?.ownerDocument.querySelector<HTMLElement>('#game-hub-control-center .gq-root .gq-category, #game-hub-control-center .gcc-settings .gcc-utility');if(el){const EventClass=el.ownerDocument.defaultView?.KeyboardEvent;if(EventClass)el.dispatchEvent(new EventClass('keydown',{key:'Escape',bubbles:true,cancelable:true}));}else props.store.requestClose();}}><Boundary fail={()=>props.store.fail()}><Surface {...props} downloadRequest={downloadRequest} closeForProfile={()=>{props.beforeProfile();modal.current?.Close();props.store.close(false);}}/></Boundary></ModalRoot>;
 useLayoutEffect(()=>{if(!open||!main)return;try{const handle=showModal(modalContent(),marker.current!.ownerDocument.defaultView!,{bNeverPopOut:true,bHideActionIcons:true,strTitle:'Game Hub',fnOnClose:()=>props.store.close()});modal.current=handle;return()=>{modal.current=undefined;handle.Close();props.store.modalClosed();};}catch{props.store.fail();}},[open,main,props.store]);
 useEffect(()=>{modal.current?.Update(modalContent());},[props.settings,props.bridge,props.controls,downloadRequest]);
 return <><span ref={marker} hidden/> {main&&notices.toast&&(open||marker.current?.ownerDocument.querySelector('.gbs-room'))&&<div className="gbs-notice-toast" data-motion={props.settings.motion} role="status"><style>{controlCenterCSS}</style>{notices.toast.avatar&&<img src={notices.toast.avatar} alt=""/>}<div><strong>{notices.toast.kind} · {notices.toast.title}</strong><p>{notices.toast.detail}</p></div></div>}</>;
}
export function Surface({store,controls,bridge,settings,notifications,saveSettings,actions,closeForProfile,downloadRequest}:Props&{closeForProfile:()=>void;downloadRequest?:{appid:number;origin:HTMLElement|null;external:boolean;serial:number}}){
 const {Button,Group}=controls;
 const currentGame=useGameActivity(store.currentAppId);const [activityModal,setActivityModal]=useState(false);
 const [gamePanel,setGamePanel]=useProfileState<{tab:HubTab;serial:number;conversation?:string;friend?:string}>('center-overlay-panel');
 const notices=useSyncExternalStore(notifications.subscribe,notifications.getSnapshot,notifications.getSnapshot);
 const [systemMenu,setSystemMenu]=useProfileState<'Decky'|'Notifications'>("ControlCenter:[systemMenu,setSystemMenu]");
 const menuOpen=useRef(false);
 const [quickRequests,setQuickRequests]=useProfileState("ControlCenter:[quickRequests,setQuickRequests]",false);
 const [quick,setQuick]=useProfileState("ControlCenter:[quick,setQuick]",false);const quickOpen=useRef(false);quickOpen.current=quick;
 const [quickClosing,setQuickClosing]=useProfileState("ControlCenter:[quickClosing,setQuickClosing]",false);const quickTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 useEffect(()=>()=>clearTimeout(quickTimer.current),[]);
 const closeQuick=()=>{if(quickTimer.current)return;const finish=()=>{quickTimer.current=undefined;setQuickClosing(false);setQuick(false);setQuickRequests(false);requestAnimationFrame(()=>focus(0,3));};if(!settings.motion||root.current?.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}setQuickClosing(true);quickTimer.current=setTimeout(finish,110);};
 const [directDownload,setDirectDownload]=useState(downloadRequest);
 useEffect(()=>{if(downloadRequest){setDirectDownload(downloadRequest);setDownloadsOpen(true);}},[downloadRequest]);
 const [downloadsOpen,setDownloadsOpen]=useProfileState("ControlCenter:[downloadsOpen,setDownloadsOpen]",!!downloadRequest);
 const [settingsPreview,setSettingsPreview]=useProfileState("ControlCenter:[settingsPreview,setSettingsPreview]",false),[fullSettings,setFullSettings]=useProfileState("ControlCenter:[fullSettings,setFullSettings]",false);

 const [switcherOpen,setSwitcherOpen]=useProfileState('center-switcher',false);
 const [musicOpen,setMusicOpen]=useState(false);
 const [micOpen,setMicOpen]=useState(false);
 menuOpen.current=micOpen||fullSettings||!!systemMenu||downloadsOpen||musicOpen||switcherOpen;
 const profilePending=useRef(false);
 const root=useRef<HTMLDivElement>(null);useFocusPresentation(root);useCenterFooter(root,classMap);useProfileFocus(root,'center-focus');const selection=useRef({row:store.inGame?1:0,index:store.inGame?0:3}),dockIndex=useRef(store.inGame?1:3);const previewMemory=useRef(new Map<number,number>());
 const [dock,setDock]=useProfileState("ControlCenter:[dock,setDock]",store.inGame?1:3),[clock,setClock]=useProfileState("ControlCenter:[clock,setClock]",()=>new Date()),[error,setError]=useProfileState("ControlCenter:[error,setError]",'');
 const music=useMusic(musicOpen||dock===5);
 const [live,setLive]=useProfileState<{voice?:VoiceSnapshot;friends?:{id:string;name:string;avatar?:string;game?:string}[];online?:number;profilePresence?:Presence;unread?:number;selfAvatar?:string}>("ControlCenter:[live,setLive]",{});
 const controlsIn=(row:Element|null|undefined)=>Array.from(row?.querySelectorAll<HTMLElement>('.gcc-card,.gcc-dock-item,.gcc-utility')??[]).filter(e=>!e.closest('[inert]')&&!e.matches(':disabled')&&e.getAttribute('aria-disabled')!=='true');
 const focus=(row:number,index:number,navigation=false)=>{const nodes=controlsIn(root.current?.querySelector(`[data-cc-row="${row}"]:not([inert])`));if(!nodes?.length)return;const n=Math.max(0,Math.min(nodes.length-1,index));selection.current={row,index:n};if(row===0){dockIndex.current=n;setDock(n);}focusControl(nodes[n],navigation);revealSocialCard(nodes[n],motionAllowed(nodes[n]));const list=nodes[n].closest<HTMLElement>('.gcc-section-list');if(list){const a=nodes[n].getBoundingClientRect(),b=list.getBoundingClientRect();if(a.bottom>b.bottom)list.scrollTop+=a.bottom-b.bottom;else if(a.top<b.top)list.scrollTop-=b.top-a.top;}};
 useLayoutEffect(()=>{
  const el=root.current;if(!el)return;let frame=returningFromProfile()||downloadRequest?0:requestAnimationFrame(()=>focus(store.inGame?1:0,store.inGame?0:3));
  const cancel=(e:Event)=>{e.preventDefault();e.stopImmediatePropagation();};
  const focusNav=(row:number,index:number)=>focus(row,index,true);
  const handler=(e:Event)=>{
   const key=e as KeyboardEvent,detail=(e as CustomEvent).detail;
   if(e.type==='keydown'&&key.key==='F8'){cancel(e);if(!key.repeat)store.native();return;}
   if((e.target as HTMLElement)?.closest('.gq-root,.gbs-room,.gcc-game-zone'))return;
   if(e.type==='vgp_onmenu'&&selection.current.row===0&&dockIndex.current===3){cancel(e);if(!detail?.is_repeat){if(quickOpen.current)closeQuick();else setQuick(true);}return;}
   if(quickOpen.current){if(e.type==='vgp_oncancel'||key.key==='Escape'){cancel(e);closeQuick();return;}if(e.type==='vgp_ondirection'||e.type==='keydown'&&key.key.startsWith('Arrow')){cancel(e);focusNavigation(root.current?.querySelector<HTMLElement>('.gq-category'));return;}}
   if((e.target as HTMLElement)?.closest('.gcc-settings'))return;
   if(menuOpen.current){cancel(e);focusNavigation(root.current?.querySelector<HTMLElement>('.gcc-settings .gcc-utility'));return;}
   if(controls.keyboard?.visible())return;
   if((e.type==='vgp_oncancel'||e.type==='keydown'&&key.key==='Escape')&&(e.target as HTMLElement)?.closest('[data-news-expanded=true]')){cancel(e);if(!key.repeat&&!detail?.is_repeat){const news=(e.target as HTMLElement).closest('[data-news-expanded=true]')!;const E=news.ownerDocument.defaultView!.Event;news.dispatchEvent(new E('gcc_news_collapse'));}return;}
   if(e.type==='vgp_oncancel'||e.type==='keydown'&&key.key==='Escape'){cancel(e);if(!key.repeat&&!detail?.is_repeat){if(selection.current.row!==0){focusNav(0,dockIndex.current);setSettingsPreview(false);}else store.requestClose();}return;}
   const direction=e.type==='vgp_ondirection'?({9:'up',10:'down',11:'left',12:'right'} as Record<number,string>)[detail?.button]:({ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'} as Record<string,string>)[key.key];
   if(direction){cancel(e);const s=selection.current;if(s.row===1&&root.current?.querySelector('.gcc-preview[data-active=true] .gcc-section')){if(direction==='up'||direction==='down'){const next=s.index+(direction==='up'?-1:1),count=controlsIn(root.current?.querySelector('[data-cc-row="1"]:not([inert])')).length;if(next<0||next>=count)focusNav(0,dockIndex.current);else focusNav(1,next);}else if(direction==='left')focusNav(0,dockIndex.current);return;}if(direction==='left'||direction==='right')focusNav(s.row,s.index+(direction==='left'?-1:1));else if(direction==='up'){if(s.row===2)focusNav(0,dockIndex.current);else if(s.row===0)focusNav(1,previewMemory.current.get(dockIndex.current)??0);}else {if(s.row===1)focusNav(0,dockIndex.current);else if(s.row===0)focusNav(2,0);}return;}
   if(e.type==='keydown'&&key.key==='Tab'){cancel(e);const s=selection.current;focusNav(s.row,s.index+(key.shiftKey?-1:1));}
  };
  const track=(e:Event)=>{const target=(e.target as HTMLElement)?.closest<HTMLElement>('.gcc-card,.gcc-dock-item,.gcc-utility');const row=target?.closest<HTMLElement>('[data-cc-row]');if(!target||!row)return;const index=controlsIn(row).indexOf(target);const r=Number(row.dataset.ccRow);selection.current={row:r,index};if(r===1)previewMemory.current.set(dockIndex.current,index);if(r===0){dockIndex.current=index;setDock(index);setSettingsPreview(false);}};
  for(const type of ['keydown','vgp_ondirection','vgp_oncancel','vgp_onmenu'])el.addEventListener(type,handler,true);
  for(const type of ['focusin','vgp_onfocus'])el.addEventListener(type,track,true);
  return()=>{cancelAnimationFrame(frame);for(const type of ['keydown','vgp_ondirection','vgp_oncancel','vgp_onmenu'])el.removeEventListener(type,handler,true);for(const type of ['focusin','vgp_onfocus'])el.removeEventListener(type,track,true);};
 },[store,controls]);
 useEffect(()=>{const read=()=>{let voice:VoiceSnapshot|undefined,friends,online,unread,selfAvatar,profilePresence:Presence='unknown';let friendSnapshot;try{selfAvatar=safeAvatar((window as unknown as {g_FriendsUIApp?:{FriendStore?:{self?:{persona?:{avatar_url_medium?:string}}}}}).g_FriendsUIApp?.FriendStore?.self?.persona?.avatar_url_medium);}catch{}try{if(settings.party)voice=bridge.voice?.read();}catch{}try{if(settings.liveFriends){const f=bridge.readFriends();friendSnapshot=f;if(f.kind==='ready'){online=f.friends.filter(p=>p.state!=='offline').length;friends=f.friends.filter(p=>p.state!=='offline').slice(0,3);}}}catch{}try{if(settings.messages){const i=bridge.messages?.inbox();if(i?.connected)unread=i.conversations.reduce((n,c)=>n+c.unread,0);}}catch{}const presence=readDockPresence(window,friendSnapshot);online=presence.count;profilePresence=presence.profile;setLive({voice,friends,online,unread,selfAvatar,profilePresence});setClock(new Date());};read();const timer=setInterval(read,2000);return()=>clearInterval(timer);},[bridge,settings]);
 useEffect(()=>{const el=root.current;if(!el)return;const wheel=(e:WheelEvent)=>{let node=e.target instanceof Element?e.target as HTMLElement:null;while(node&&node!==el){if(node.scrollHeight>node.clientHeight&&((e.deltaY<0&&node.scrollTop>0)||(e.deltaY>0&&node.scrollTop+node.clientHeight<node.scrollHeight-1)))return;node=node.parentElement;}e.preventDefault();};el.addEventListener('wheel',wheel,{passive:false});return()=>el.removeEventListener('wheel',wheel);},[]);
 useLayoutEffect(()=>{
  const el=root.current;if(!el)return;let exiting=false;const animations:Animation[]=[];
  if(settings.motion&&motionAllowed(el)&&typeof el.animate==='function'){animations.push(el.animate([{opacity:0},{opacity:1}],{duration:280,easing:'ease-out'}));for(const node of Array.from(el.querySelectorAll<HTMLElement>('.gcc-bottom,.gcc-header'))){const animation=node.animate([{opacity:0,transform:'translateY(18px) scale(.99)'},{opacity:1,transform:'none'}],{duration:280,easing:'cubic-bezier(.2,.75,.25,1)'});animations.push(animation);}}
  const unregister=store.setExitTransition?.(restore=>{
   if(exiting)return;exiting=true;
   if(!settings.motion||!motionAllowed(el)||typeof el.animate!=='function'){store.close(restore);return;}
   animations.forEach(a=>a.cancel());
   const animation=el.animate([{opacity:1},{opacity:0}],{duration:260,easing:'ease-in',fill:'forwards'});animations.push(animation);
   for(const node of Array.from(el.querySelectorAll<HTMLElement>('.gcc-bottom,.gcc-header')))animations.push(node.animate([{transform:'none'},{transform:'translateY(18px) scale(.99)'}],{duration:260,easing:'ease-in',fill:'forwards'}));
   animation.finished.then(()=>store.close(restore),()=>{});
  });
  return()=>{unregister?.();animations.forEach(a=>a.cancel());};
 },[store,settings.motion]);
 const act=(fn:()=>void,leave=true)=>{clearTimeout(quickTimer.current);quickTimer.current=undefined;setQuickClosing(false);setQuick(false);setError('');try{fn();if(leave)store.close(false);}catch(e){setError(e instanceof Error?e.message:'Steam action unavailable. Use the native menu.');}};
 // Resolve the native destination before closing. Remove the modal from Steam's
 // manager before mounting its browser, whose hideForModals hook snapshots count.
 const profile=async()=>{if(profilePending.current)return;profilePending.current=true;setError('');try{
  const navigate=await actions.profile();
  if(!root.current?.isConnected||!store.getSnapshot())return;
  closeForProfile();navigate();
 }catch(e){setError(e instanceof Error?e.message:'Profile unavailable. Use Steam View Profile.');}finally{profilePending.current=false;}};
 const openHub=(tab:HubTab,conversation?:string,friend?:string)=>{if(store.inGame){setQuick(false);setSystemMenu(undefined);setFullSettings(false);setGamePanel({tab,conversation,friend,serial:Date.now()});}else act(()=>actions.hub(tab,conversation,friend));};
 const openNotice=(n:HubNotice)=>{if(n.requests){setSystemMenu(undefined);setQuickRequests(true);setQuick(true);}else if(n.conversation)openHub('Messages',n.conversation);else if(n.friend)openHub('Friends',undefined,n.friend);else if(n.party)openHub('Party');};
 const items:{name:string;icon:IconName;action:()=>void;stay?:boolean}[]=[
  {name:'Home',icon:'home',action:actions.home},{name:'Switcher / Games',icon:'games',action:()=>setSwitcherOpen(true),stay:true},{name:'Notifications',icon:'bell',action:()=>setSystemMenu('Notifications'),stay:true},{name:'Game Hub',icon:'people',action:()=>openHub('Friends'),stay:true},{name:'Downloads / Uploads',icon:'download',action:()=>setDownloadsOpen(true),stay:true},...pluginShortcuts.map(shortcut=>({name:shortcut.label,icon:'music' as const,action:()=>setMusicOpen(true),stay:true})),{name:'Sound',icon:'sound',action:actions.sound},{name:live.voice?.micMuted?'Microphone · Muted':'Microphone',icon:'mic',action:()=>setMicOpen(true),stay:true},{name:'Accessories / Controller',icon:'controller',action:actions.accessories},{name:'Profile',icon:'profile',action:()=>{void profile();},stay:true},{name:'Power',icon:'power',action:()=>{const anchor=root.current?.querySelector<HTMLElement>('[aria-label=Power]');if(!anchor)throw Error('Power menu is unavailable.');actions.power(anchor,()=>requestAnimationFrame(()=>focusControl(anchor)));},stay:true}];
 const avatars=(people:{id:string|number;name:string;avatar?:string}[])=> <div className="gcc-avatars">{people.map(p=><span key={p.id}>{safeAvatar(p.avatar)?<img src={safeAvatar(p.avatar)} alt={p.name} referrerPolicy="no-referrer" onError={e=>{e.currentTarget.style.visibility='hidden';}}/>:<Icon name="profile"/>}</span>)}</div>;
 if(gamePanel)return <div ref={root} id="game-hub-control-center" style={ambientVariables} data-ambient={settings.ambientLight}><style>{controlCenterCSS}{focusMotionCSS}{dockIconCSS}{socialCardCSS}{presenceCSS}{fullscreenCSS(classMap)}</style><Panel controls={controls} bridge={{...bridge,openProfile:id=>{closeForProfile();bridge.openProfile(id);}}} settings={settings} setSettings={saveSettings} initialTab={gamePanel.tab} entryRequest={gamePanel} onBack={()=>{setGamePanel(undefined);requestAnimationFrame(()=>focus(0,3));}}/></div>;
 return <div ref={root} id="game-hub-control-center" style={{...ambientVariables,"--ga-live-shade":"linear-gradient(180deg,rgba(4,13,24,.12),rgba(4,13,24,.18) 38%,rgba(4,13,24,.74) 100%)","--ga-cinematic-shade":"linear-gradient(180deg,rgba(5,19,33,.18),rgba(5,19,33,.15) 38%,rgba(4,16,27,.60) 75%,#06111ee8)"} as import('react').CSSProperties} data-game={!!store.currentAppId} data-live-game={store.inGame} className="gcc-overlay" data-quick={quick} data-motion={settings.motion} data-glass={settings.glassBlur} data-ambient={settings.ambientLight} role="dialog" aria-modal="true" aria-label="Game Hub Control Center"><style>{controlCenterCSS}{gameActivityCSS}{focusMotionCSS}{dockIconCSS}{socialCardCSS}{presenceCSS}{fullscreenCSS(classMap).replaceAll('body:has(.gbs-root.gbs-room)','body:has(#game-hub-control-center)')}</style><Group className="gcc-focus-root">
  {store.currentAppId&&<><GameAsset sources={currentGame.data?.heroes??[]} className="ga-background"/><div className="ga-background-shade"/></>}<header className="gcc-header"><time>{clock.toLocaleTimeString([], {hour:'numeric',minute:'2-digit',hour12:true})}</time></header>
  {!fullSettings&&!systemMenu&&!downloadsOpen&&!musicOpen&&!switcherOpen&&<div className="gcc-bottom" inert={micOpen}>
   <div className="gcc-cards" style={{visibility:quick?'hidden':undefined,opacity:quick?0:1}} inert={quick}>
    {store.currentAppId&&<div className="gcc-preview" data-preview="game" data-active={dock===1} data-cc-row="1" inert={dock!==1} aria-hidden={dock!==1}><GameActivity key={store.currentAppId} controls={controls} data={currentGame.data} error={currentGame.error} title={currentGame.data?.game.name??'Current game'} resume={()=>store.requestClose(false)} exitGame={actions.exitGame} toDock={()=>focus(0,1)} onModal={setActivityModal}/></div>}
    <div className="gcc-preview" data-preview="social" data-active={dock===3} data-cc-row="1" inert={dock!==3} aria-hidden={dock!==3}><Group horizontal className="gcc-card-row">
    <Button className="gcc-card" disabled={!settings.party} onClick={()=>openHub('Party')}><Icon name="headset"/><div className="gcc-card-center">{live.voice?.members.length?avatars(live.voice.members):<Icon name="headset"/>}{live.voice?.active&&<span className="gcc-pill">{live.voice.state==='connected'?'In Voice Chat':'Connecting'}</span>}</div><small>Party</small><strong>{live.voice?.active?live.voice.title:'Start a party'}</strong></Button>
    <Button className="gcc-card" onClick={()=>openHub('Friends')}><Icon name="people"/><div className="gcc-card-center">{live.friends?.length?avatars(live.friends):<Icon name="people"/>}</div><small>Friends</small><strong>{live.online===undefined?'Your people':`${live.online} online`}</strong></Button>
    <GameNewsCard controls={controls} active={dock===3&&!quick} open={url=>act(()=>actions.web(url))}/>
    <Button className="gcc-card" disabled={!settings.messages} onClick={()=>openHub('Messages')}><Icon name="bell"/><div className="gcc-card-center"><Icon name="message"/>{!!live.unread&&<span className="gcc-badge">{live.unread>99?'99+':live.unread}</span>}</div><small>Messages</small><strong>{live.unread===undefined?'Open conversations':live.unread?`${live.unread} Unread`:'All caught up'}</strong></Button>
   </Group></div>
    {items.map((item,i)=>i===3||i===1&&store.currentAppId?null:<div key={item.icon} className="gcc-preview" data-preview={item.icon} data-active={dock===i} data-cc-row="1" inert={dock!==i} aria-hidden={dock!==i}><div className="gcc-section">
     <h2>{item.name}</h2><div className="gcc-section-list"><Group>
      {i===2?<>{settings.notificationPreview?notices.rows.slice(0,3).map(row=><Button key={row.id} className="gcc-utility gcc-section-item" onClick={()=>{if(row.conversation||row.friend||row.party||row.requests)openNotice(row);else setSystemMenu('Notifications');}}>{row.title}<span>{row.kind} · {row.source}</span></Button>):<p>Notification previews are off.</p>}{settings.notificationPreview&&!notices.rows.length&&<p>{notices.status.startsWith('Partial')?'Some notification sources are unavailable':'No notifications from connected sources'}</p>}</>:
       i===4?<DownloadPreview controls={controls} active={dock===4} open={()=>setDownloadsOpen(true)}/>:
       <Button className="gcc-utility gcc-section-item" onClick={()=>act(item.action,!item.stay)}>{i===0?'Go to Home':i===1?'Recent games':i===5?music.player?.title||'Open music controls':i===6?'Open Steam audio settings':i===7?live.voice?.active?(live.voice.micMuted?'Microphone muted':'Microphone on'):'Microphone controls':i===8?'Open Steam controller settings':i===9?'View your Steam profile':'Open power options'}<span>{i===0?'Return to your Steam library home':i===1?'Choose a game or view its Game Hub':i===5?music.error||music.player?.artist||'Now Playing':i===6?'Volume and output device':i===7?live.voice?.active?live.voice.title:'No active Game Hub voice call':i===8?'Connected controllers and configuration':i===9?'Your signed-in Steam account':'Sleep, restart, shutdown and Steam options'}</span></Button>}
     </Group></div>{i===2&&<Button className="gcc-utility gcc-section-fallback" onClick={()=>setSystemMenu('Notifications')}>Open Notification Center</Button>}
    </div></div>)}
   </div>
   <div data-cc-row="0" className="gcc-dock" inert={activityModal}><span aria-hidden="true" className="gcc-dock-selection" style={{left:dockSelectionLeft(dock,items.length)}}/><Group horizontal className="gcc-dock-row">{items.map((item,i)=><Button key={item.icon} className={`gcc-dock-item${dock===i?' gcc-selected':''}`} aria-label={item.name} onClick={()=>act(item.action,!item.stay)}><span className="gcc-dock-label">{item.icon==='games'&&currentGame.data?currentGame.data.game.name:item.name}</span>{item.icon==='games'&&currentGame.data?<GameAsset sources={currentGame.data.covers} className="ga-dock-cover"/>:item.icon==='profile'?<ProfileIcon avatar={live.selfAvatar}/>:<DockIcon name={item.icon}/>} {item.icon==='people'&&<FriendsOnlineCounter count={live.online}/>} {item.icon==='profile'&&<ProfilePresenceBadge state={live.profilePresence??'unknown'}/>} {item.icon==='bell'&&notices.rows.some(n=>n.unread)&&<span className="gcc-dock-count">{notices.rows.filter(n=>n.unread).length}</span>}</Button>)}</Group></div>
   {store.currentAppId&&<div className="ga-options-hint" aria-hidden="true" data-label="Options"><svg viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="1" width="22" height="16" rx="3"/><path d="M5 5h14M5 9h14M5 13h14"/></svg></div>}<footer data-cc-row="2" inert={activityModal}><Group horizontal className="gcc-utilities"><Button className="gcc-utility" onClick={()=>{setQuick(false);setFullSettings(true);}}>Settings</Button><Button className="gcc-utility" onClick={()=>{setQuick(false);setSystemMenu('Decky');}}>Decky</Button><Button className="gcc-utility" onClick={()=>act(store.native)}>Open Original Steam Menu</Button></Group></footer>
  </div>}{micOpen&&<MicrophoneMenu controls={controls} voice={bridge.voice} close={()=>{setMicOpen(false);requestAnimationFrame(()=>focusControl(root.current?.querySelector<HTMLElement>('[aria-label^="Microphone"]')));}} party={()=>{setMicOpen(false);openHub('Party');}}/>}{quick&&<QuickMenu nativeSteamcord={()=>act(()=>{decky()?.deckyState.setActivePlugin('Steamcord');actions.decky();})} initialRequests={quickRequests} discoveryBridge={{...bridge,openProfile:id=>{closeForProfile();bridge.openProfile(id);},searchPlayersNative:query=>{closeForProfile();bridge.searchPlayersNative?.(query);}}} closing={quickClosing} bridge={{...bridge,openProfile:id=>{closeForProfile();bridge.openProfile(id);}}} controls={controls} settings={settings} close={closeQuick}/>}{switcherOpen&&<div inert={downloadsOpen} style={downloadsOpen?{visibility:"hidden"}:undefined}><GameSwitcher currentAppId={store.currentAppId} controls={controls} close={()=>{setSwitcherOpen(false);requestAnimationFrame(()=>focus(0,1));}} leave={()=>store.close(false)} library={id=>{closeForProfile();actions.library(id);}} external={url=>{closeForProfile();actions.web(url);}}/></div>}{musicOpen&&<MusicPage state={music} controls={controls} back={()=>{setMusicOpen(false);requestAnimationFrame(()=>focus(0,5));}} native={()=>act(()=>{decky()?.deckyState.setActivePlugin('Now Playing');actions.decky();})}/>}{downloadsOpen&&<DownloadsPage initialAppId={directDownload?.appid} controls={controls} motion={settings.motion} back={()=>{setDownloadsOpen(false);setDirectDownload(undefined);if(directDownload?.external)store.close();else requestAnimationFrame(()=>{if(directDownload?.origin?.isConnected)focusControl(directDownload.origin);else focus(0,4);});}} native={()=>act(actions.downloads)}/>}{fullSettings&&<CenterSettings controls={controls} settings={settings} save={saveSettings} close={()=>{setFullSettings(false);requestAnimationFrame(()=>focus(2,0));}} native={()=>act(actions.steamSettings)} notificationSettings={()=>act(actions.notificationSettings)} decky={()=>{setFullSettings(false);setSystemMenu('Decky');}} audio={()=>act(actions.voiceSettings)} controller={()=>act(actions.accessories)} hub={()=>openHub('Settings')}/>}{systemMenu&&<SystemMenu kind={systemMenu} controls={controls} notifications={notifications} close={()=>{setSystemMenu(undefined);requestAnimationFrame(()=>focus(selection.current.row,selection.current.index));}} native={()=>act(systemMenu==='Decky'?actions.decky:actions.notifications)} nativeDecky={()=>act(actions.decky)} nativePage={page=>act(()=>actions.deckyPage(page))} integrationSettings={()=>{setSystemMenu(undefined);setFullSettings(true);}} openNotice={openNotice}/>}{error&&<p className="gcc-error" role="alert">{error}</p>}
 </Group></div>;
}

function DownloadPreview({controls,active,open}:{controls:Controls;active:boolean;open:()=>void}){
 const {Button}=controls,snapshot=useDownloadsSnapshot(active);
 const transfer=snapshot.rows.find(r=>r.section==='active'||r.section==='uploads')??snapshot.rows[0];
 return <Button className="gcc-utility gcc-section-item" onClick={open}>{transfer?.title||'Downloads / Uploads'}<span>{transfer?`${transfer.status}${transfer.percent===undefined?'':` · ${Math.round(transfer.percent)}%`}`:snapshot.ready?'No transfers reported by Steam':'Open downloads to check Steam transfer status'}</span></Button>;
}
