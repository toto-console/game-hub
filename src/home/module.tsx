import {ConsoleStore} from './ConsoleStore';
import {setHomeIntegration} from '../center-diagnostics';
import {TrailerSettings,TRAILER_SETTINGS} from './HomeTrailer';
import {AchievementsRoute,ACHIEVEMENTS_ROUTE} from '../AchievementsPage';
import {T} from '../i18n';
import {homeHeaderCSS,controlCenterHeaders} from '../fullscreen';
import {footerSelector} from '../center-footer';
import {NATIVE_LIBRARY_RECOVERY,GAME_HUB_HOME,GAME_HUB_LIBRARY,openNativeLibraryRecovery} from './native-library';
import {callable,routerHook} from '@decky/api';
import {Navigation,classMap} from '@decky/ui';
import {useSyncExternalStore,type CSSProperties,createElement,type ReactNode} from 'react';
import {Ps5Shell} from './upstream/Shell';
import {Fallback} from './upstream/components';
import {DEFAULT_SETTINGS,withDefaults,setCurrentSettings,accentColor,type Settings} from './upstream/settings';
import type {Controls} from '../Panel';
import {PostGameRoute,POST_GAME_ROUTE} from './PostGame';
import {watchPostGame} from './post-game-return';
import {Router} from '@decky/ui';
import {bindWhenReady,loadWhenReady} from '../startup-ready';

const PREVIEW='/game-hub/home/preview',LIBRARY=GAME_HUB_LIBRARY,HOME='/library/home';
type Config={active:boolean;dashboard:Settings;motion:boolean;tileScale:number;gap:number};
const initial:Config={active:false,dashboard:{...DEFAULT_SETTINGS,palette:false,controlCenter:false},motion:true,tileScale:1,gap:2};
let config=initial,status='Loading dashboard preferences...',disposed=true;
const listeners=new Set<()=>void>();
const emit=()=>listeners.forEach(fn=>fn());
const subscribe=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
const getSettings=callable<[],Partial<Config>>('get_settings');
const save=callable<[settings:Config],boolean>('set_settings');
let patch:ReturnType<typeof routerHook.addPatch>|undefined;
const DETAILS='/library/app/:appid';
let detailPatch:ReturnType<typeof routerHook.addPatch>|undefined;
let libraryPatch:ReturnType<typeof routerHook.addPatch>|undefined,nativeLibraryBypass=false;
export function originalDashboardActive(){try{return (window as any).DeckyPluginLoader?.plugins?.some((p:any)=>p.name==='PS5 Dashboard'&&typeof p.onDismount==='function')===true;}catch{return true;}}
function screen(tab:'games'|'library',fallback?:import('react').ReactNode){return <Fallback fallback={fallback??<button onClick={openNativeLibraryRecovery}>Open Steam Library</button>}><Dashboard tab={tab}/></Fallback>;}
function Dashboard({tab}:{tab:'games'|'library'}){
 const c=useSyncExternalStore(subscribe,()=>config),d=c.dashboard;
 const dashboardFooterCSS=footerSelector(classMap).split(',').filter(Boolean).map(selector=>`body:has(.gh-home-module) ${selector}{display:none!important}`).join('\n');
 const vars={'--ghd-accent':accentColor(d.accent),'--ghd-focus':d.focus==='white'?'#fff':accentColor(d.accent),'--ghd-radius':`${d.radius}px`,'--ghd-user-scale':c.tileScale,'--ghd-user-gap':`${c.gap}vh`} as CSSProperties;
 return <div className="gh-home-module" data-motion={c.motion} data-background={d.background} style={vars}><style>{dashboardFooterCSS}{homeHeaderCSS(classMap)}</style><style>{`.gh-home-module{position:absolute;inset:0}.gh-home-module .ghd-root{font-family:inherit}.gh-home-module .ghd-row-anchor{--ghd-gap:var(--ghd-user-gap);--ghd-slot:calc(10vh * var(--ghd-user-scale));--ghd-big:calc(15.5vh * var(--ghd-user-scale))}.gh-home-module[data-background=gradient] .ghd-backdrop,.gh-home-module[data-background=dark] .ghd-backdrop{display:none}.gh-home-module[data-background=dark] .ghd-root{background:#04060c}.gh-home-module[data-motion=false] *{animation:none!important;transition:none!important}@media(prefers-reduced-motion:reduce){.gh-home-module *{animation:none!important;transition:none!important}}`}</style><Ps5Shell initialTab={tab}/></div>;
}
function StoreRoute(){
 const motion=useSyncExternalStore(subscribe,()=>config.motion);
 return <ConsoleStore motion={motion}/>;
}
function HomeChrome(){
 const hide=useSyncExternalStore(subscribe,()=>config.active&&config.dashboard.enabled&&config.dashboard.ps5Home&&!nativeLibraryBypass&&!originalDashboardActive());
 if(!hide)return null;
 // Global mounting keeps the native chrome suppressed through route replacement commits.
 return <style>{controlCenterHeaders(classMap).selector.split(',').filter(Boolean).map(s=>`body:has(.gh-home-module) ${s}{display:none!important;visibility:hidden!important;pointer-events:none!important;transition:none!important}`).join('')}</style>;
}
function RouteGate({tab,native}:{tab:'games'|'library'|'details';native:ReactNode}){
 useSyncExternalStore(subscribe,()=>config);
 const want=!disposed&&config.active&&config.dashboard.enabled&&config.dashboard.ps5Home&&!originalDashboardActive();
 if(tab==='details')return want&&!nativeLibraryBypass?<PostGameRoute/>:<>{native}</>;
 return want&&(tab==='games'||!nativeLibraryBypass)?screen(tab,native):<>{native}</>;
}
function patchRoute(tab:'games'|'library'|'details'){
 return (props:any)=>{
  const native=props.children??(props.component?createElement(props.component,props):props.render?.(props));
  return {...props,children:<RouteGate tab={tab} native={native}/>,component:undefined,render:undefined};
 };
}
function sync(){
 setHomeIntegration(disposed?'disposed':originalDashboardActive()?'conflict':config.active&&config.dashboard.enabled&&config.dashboard.ps5Home?'enabled':'disabled');
 setCurrentSettings({...config.dashboard,palette:false,controlCenter:false});
 // Install once before asynchronous settings. The mounted gate subscribes to
 // preferences instead of waiting for a future Steam route reconstruction.
 if(!disposed&&!patch)patch=routerHook.addPatch(HOME,patchRoute('games'));
 if(!disposed&&!libraryPatch)libraryPatch=routerHook.addPatch('/library',patchRoute('library'));
 if(!disposed&&!detailPatch)detailPatch=routerHook.addPatch(DETAILS,patchRoute('details'));
 if(disposed&&detailPatch){routerHook.removePatch(DETAILS,detailPatch);detailPatch=undefined;}
 if(disposed&&libraryPatch){routerHook.removePatch('/library',libraryPatch);libraryPatch=undefined;}
 if(disposed&&patch){routerHook.removePatch(HOME,patch);patch=undefined;}
}
async function update(next:Config){
 if(next.active&&originalDashboardActive()){status='Disable the separate PS5 Dashboard in Decky before enabling integrated Home. Your original plugin is retained.';emit();return;}
 try{if(!await save(next))throw Error('Save failed');config=next;sync();status='Dashboard preferences saved.';}catch{status='Dashboard preferences could not be saved. Existing Home is unchanged.';}emit();
}
export function startHomeModule(){
 disposed=false;nativeLibraryBypass=false;config=initial;sync();routerHook.addGlobalComponent('GameHubHomeChrome',HomeChrome);routerHook.addRoute(TRAILER_SETTINGS+"/:appid?",TrailerSettings,{exact:true});routerHook.addRoute(ACHIEVEMENTS_ROUTE,AchievementsRoute,{exact:true});routerHook.addRoute(GAME_HUB_HOME,()=>screen('games'),{exact:true});routerHook.addRoute(PREVIEW,()=>screen('games'),{exact:true});routerHook.addRoute(LIBRARY,()=>screen('library'),{exact:true});
 routerHook.addRoute("/game-hub/store/:product?",StoreRoute,{exact:true});
 routerHook.addRoute(POST_GAME_ROUTE,PostGameRoute,{exact:true});
 const stopPostGame=bindWhenReady(()=>Router.WindowStore?.GamepadUIMainWindowInstance,main=>{
   const sessions=(window as any).SteamClient?.GameSessions;
   if(!sessions?.RegisterForAppLifetimeNotifications||!(main as any).m_history)return false;
   return watchPostGame(main,sessions,()=>config.active&&config.dashboard.enabled&&config.dashboard.ps5Home&&!nativeLibraryBypass&&!originalDashboardActive());
 });
 const recoverLibrary=()=>{nativeLibraryBypass=true;config={...config};sync();emit();};window.addEventListener(NATIVE_LIBRARY_RECOVERY,recoverLibrary);
 // Steam can finish mounting its initial Home before Decky installs the route patch.
 let settingsReady=false;
 const stopStartupHome=bindWhenReady(()=>Router.WindowStore?.GamepadUIMainWindowInstance,main=>{
   const history=(main as any).m_history,doc=main.BrowserWindow?.document;
   if(!settingsReady||!history?.location?.pathname||!doc?.body)return false;
   if(history.location.pathname===HOME&&config.active&&config.dashboard.enabled&&config.dashboard.ps5Home
     &&!nativeLibraryBypass&&!originalDashboardActive()&&!doc.querySelector('.gh-home-module')){
     history.replace(GAME_HUB_HOME);
   }
 });
 const stopLoading=loadWhenReady(getSettings,raw=>{config={...initial,...raw,active:raw.active===true,dashboard:withDefaults(raw.dashboard)};config.tileScale=Math.max(.8,Math.min(1.2,Number(config.tileScale)||1));config.gap=Math.max(1,Math.min(4,Number(config.gap)||2));settingsReady=true;sync();status=originalDashboardActive()?'Original PS5 Dashboard remains active. Preview the integrated module before migration.':'Integrated Home is available; enable it after testing the preview.';emit();},()=>{status='Waiting for dashboard preferences. Retrying automatically...';emit();});
 // Decky emits lifecycle changes through its existing state bus; never disable another plugin automatically.
 const bus=(window as any).DeckyPluginLoader?.deckyState?.eventBus;
 const changed=()=>{config={...config};sync();emit();};bus?.addEventListener?.('update',changed);
 return()=>{stopStartupHome();stopPostGame();routerHook.removeRoute("/game-hub/store/:product?");routerHook.removeRoute(POST_GAME_ROUTE);stopLoading();window.removeEventListener(NATIVE_LIBRARY_RECOVERY,recoverLibrary);disposed=true;routerHook.removeGlobalComponent('GameHubHomeChrome');sync();bus?.removeEventListener?.('update',changed);routerHook.removeRoute(TRAILER_SETTINGS+"/:appid?");routerHook.removeRoute(ACHIEVEMENTS_ROUTE);routerHook.removeRoute(GAME_HUB_HOME);routerHook.removeRoute(PREVIEW);routerHook.removeRoute(LIBRARY);listeners.clear();};
}
export function HomePreferences({controls,close}:{controls:Controls;close?:()=>void}){
 const c=useSyncExternalStore(subscribe,()=>config),message=useSyncExternalStore(subscribe,()=>status),{Button}=controls;
 const set=(key:keyof Settings,value:any)=>void update({...c,dashboard:{...c.dashboard,[key]:value}});
 const row=(label:string,run:()=>void)=><Button key={label.split(':')[0]} className="gcc-utility gcc-setting-row" onClick={run}><T text={label}/></Button>;
 return <><p>{message}</p>
 {row('Preview integrated Home',()=>{close?.();Navigation.Navigate(PREVIEW);})}
 {row('Preview integrated Library',()=>{close?.();Navigation.Navigate(LIBRARY);})}
 {row(`Integrated Steam Home: ${c.active?'On':'Off'}`,()=>void update({...c,active:!c.active}))}
 {row('Restore native Steam Home',()=>void update({...c,active:false}))}
 {row(`Background: ${c.dashboard.background}`,()=>set('background',c.dashboard.background==='art'?'gradient':c.dashboard.background==='gradient'?'dark':'art'))}
 {row(`Game tile scale: ${c.tileScale.toFixed(1)}`,()=>void update({...c,tileScale:c.tileScale>=1.2?.8:Number((c.tileScale+.1).toFixed(1))}))}
 {row(`Tile spacing: ${c.gap}`,()=>void update({...c,gap:c.gap>=4?1:c.gap+1}))}
 {row(`Info cards: ${c.dashboard.infoCards?'On':'Off'}`,()=>set('infoCards',!c.dashboard.infoCards))}
 {row(`HowLongToBeat: ${c.dashboard.hltb?'On':'Off'}`,()=>set('hltb',!c.dashboard.hltb))}
 {row('Open native Steam Library (recovery)',()=>{close?.();openNativeLibraryRecovery();})}
 {row('Use Game Hub for Steam Library',()=>{nativeLibraryBypass=false;config={...config};sync();emit();close?.();Navigation.Navigate('/library');})}
 {row(`Reduced motion: ${c.motion?'Off':'On'}`,()=>void update({...c,motion:!c.motion}))}
 {row(`Focus style: ${c.dashboard.focus}`,()=>set('focus',c.dashboard.focus==='white'?'accent':'white'))}
 {row('Restore dashboard defaults',()=>void update({...initial,active:c.active}))}
 </>;
}
