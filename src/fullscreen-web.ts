import type {PatchFunction} from './social-entry';

type Events={on:(name:string,fn:(...args:any[])=>void)=>void;off:(name:string,fn:(...args:any[])=>void)=>void};
type Browser={URL:string;DisplayURL:string;LoadErrorCode?:number|null;BIsLoadingURL:()=>boolean;GetBrowser:()=>Events};
type Header={IncrementHideHeader:()=>void;DecrementHideHeader:()=>void;GetCurrentBrowserAndBackstack:()=>{browser?:Browser;bExternal?:boolean};SetCurrentBrowserAndBackstack:(...args:any[])=>void};
export type WebWindow={BrowserWindow:Window;LocationPathName:string;HeaderStore:Header;m_StoreBrowser?:Browser;IsGamepadUIOverlayWindow:()=>boolean;IsAnyVRWindow:()=>boolean;GetShowingGlobalModal:()=>unknown;MenuStore:{GetOpenSideMenu:()=>number};m_history:{listen:(fn:(location:{pathname:string})=>void)=>()=>void}};
type Adapter={begin:()=>void;refresh:()=>void;original:()=>void;dispose:()=>void};
const adapters=new WeakMap<object,Adapter>();
let owner:()=>object|undefined=()=>undefined;
export function setWebOwnerResolver(resolve:()=>object|undefined){owner=resolve;return()=>{owner=()=>undefined;};}
export function openGameHubWeb(url:string,navigate:(url:string)=>unknown,windowOwner=owner()){
 const adapter=windowOwner&&adapters.get(windowOwner);adapter?.begin();
 try{return navigate(url);}catch(e){adapter?.original();throw e;}
}
export function restoreOriginalWeb(windowOwner:object|undefined){if(windowOwner)adapters.get(windowOwner)?.original();}
/** Public browsing routes only. Unknown paths, query redirects and all account flows stay native. */
export function compatibleSteamPage(raw:unknown):boolean{
 if(typeof raw!=='string')return false;
 try{
  const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.port)return false;
  const path=decodeURIComponent(u.pathname).toLowerCase();
  if(/(?:login|logout|checkout|cart|account|payment|purchase|authorize|oauth|openid|steamguard|security|twofactor|agecheck|agegate|parental|warning|error|redirect|linkfilter|tradeoffer|\/edit)(?:[^a-z]|$)/.test(path))return false;
  for(const [key,value] of u.searchParams)if(/redirect|return|login|auth|token|url|checkout|payment/i.test(key)||/https?:|steam:/i.test(value))return false;
  if(u.hostname==='store.steampowered.com')return /^\/$/.test(path)||/^\/(app|sub|bundle)\/\d+(?:\/[^/]*)?\/?$/.test(path)||/^\/(search|genre|category|tags|specials|explore|wishlist|news)(\/|$)/.test(path);
  if(u.hostname==='steamcommunity.com')return /^\/$/.test(path)||/^\/(profiles\/\d+|id\/[a-z0-9_-]+)(\/(?:home|screenshots|images|videos|myworkshopfiles|allactivity|friends|games|stats|recommended)(?:\/[^/]*)*)?\/?$/.test(path)||/^\/(app|games|ogg|discussions|sharedfiles|workshop|search|groups)(\/|$)/.test(path);
  return false;
 }catch{return false;}
}
const samePage=(a:string,b:string)=>{try{const x=new URL(a),y=new URL(b);x.hash='';y.hash='';return x.href===y.href;}catch{return false;}};
/** Main Big Picture shell only; never reaches into the Store/Community document. */
export function connectFullscreenWeb(main:WebWindow,enabled:()=>boolean,patch:PatchFunction,original:symbol,modules:unknown):Adapter{
 let session=false,recovery=false,entered=false,deadline=0,held=false,disposed=false,failed=false;
 let browser:Browser|undefined,secureURL='',loaded=false,blocked=false;
 let timer:ReturnType<typeof setInterval>|undefined;
 const stopWatch=()=>{clearInterval(timer);timer=undefined;};
 const cleanups:(()=>void)[]=[];let releaseBrowser=()=>{};
 const header=main.HeaderStore;
 const valid=Array.isArray(modules)&&modules.some(m=>m?.MainBrowserContainer&&m?.BrowserContainer&&m?.URLBar)&&modules.some(m=>m?.Header&&m?.DashboardBar&&m?.Clock&&m?.CurrentUserAvatar);
 const release=()=>{if(held){held=false;try{header.DecrementHideHeader();}catch{failed=true;}}};
 const refresh=()=>{
  try{
   if(!disposed&&!failed&&session&&!recovery&&enabled()){if(!timer)timer=setInterval(()=>{if(!entered&&Date.now()>deadline)session=false;refresh();},100);}else stopWatch();
   const active=header.GetCurrentBrowserAndBackstack();
   const hide=!disposed&&!failed&&valid&&session&&!recovery&&enabled()&&main.LocationPathName==='/steamweb'&&!main.IsGamepadUIOverlayWindow()&&!main.IsAnyVRWindow()&&!main.GetShowingGlobalModal()&&main.MenuStore.GetOpenSideMenu()===0&&active.browser===browser&&!active.bExternal&&!!browser&&loaded&&!blocked&&!browser.BIsLoadingURL()&&!browser.LoadErrorCode&&compatibleSteamPage(browser.URL)&&samePage(secureURL,browser.URL)&&samePage(browser.DisplayURL,browser.URL);
   if(hide&&!held){header.IncrementHideHeader();held=true;}else if(!hide)release();
  }catch{failed=true;release();}
 };
 const bind=(next:Browser|undefined)=>{
  if(next===browser)return;
  release();releaseBrowser();browser=next;secureURL='';loaded=false;blocked=false;
  if(!next)return;
  const view=next.GetBrowser();if(!view||typeof view.on!=='function'||typeof view.off!=='function'){browser=undefined;return;}
  const listeners:[string,(...args:any[])=>void][]=[];
  releaseBrowser=()=>{for(const [event,fn] of listeners)view.off(event,fn);listeners.length=0;};
  const listen=(event:string,fn:(...args:any[])=>void)=>{view.on(event,fn);listeners.push([event,fn]);};
  const start=()=>{secureURL='';loaded=false;blocked=false;release();};
  listen('start-request',start);listen('start-loading',()=>{loaded=false;release();});
  listen('page-security',(url:string,security:{bIsSecure?:boolean;bHasCertError?:boolean})=>{secureURL=security?.bIsSecure===true&&security?.bHasCertError===false?url:'';refresh();});
  listen('finished-request',()=>{loaded=true;refresh();});
  for(const event of ['load-error','alert-dialog','confirm-dialog','blocked-request'])listen(event,()=>{blocked=true;release();});
 };
 const adapter:Adapter={begin(){release();secureURL='';loaded=false;session=true;recovery=false;entered=main.LocationPathName==='/steamweb';deadline=Date.now()+5000;refresh();},refresh,original(){recovery=true;stopWatch();release();},dispose(){if(disposed)return;disposed=true;stopWatch();release();releaseBrowser();for(const stop of cleanups.splice(0))stop();adapters.delete(main);}};
 try{
  if(!valid||main.IsGamepadUIOverlayWindow()||main.IsAnyVRWindow()||typeof header.IncrementHideHeader!=='function'||typeof header.DecrementHideHeader!=='function'||typeof header.GetCurrentBrowserAndBackstack!=='function'||typeof header.SetCurrentBrowserAndBackstack!=='function')return adapter;
  const patched=patch(header,'SetCurrentBrowserAndBackstack',args=>{try{if(args[0])bind(args[0] as Browser);else release();}catch{failed=true;release();}return original;});cleanups.push(()=>patched.unpatch());
  bind(header.GetCurrentBrowserAndBackstack().browser??main.m_StoreBrowser);
  cleanups.push(main.m_history.listen(location=>{if(location.pathname==='/steamweb'){if(session)entered=true;}else if(entered){session=false;recovery=false;entered=false;stopWatch();}release();}));
  // Events revoke suppression immediately; this watchdog covers route/modal changes and API failures.
  cleanups.push(stopWatch);
  adapters.set(main,adapter);
 }catch{failed=true;release();releaseBrowser();for(const stop of cleanups.splice(0))stop();}
 return adapter;
}
