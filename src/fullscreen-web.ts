import {resolveSteamUI,classSelector} from './steam-ui-compat';
import {controlCenterHeaders} from './fullscreen';
import {footerSelector} from './center-footer';
import type {PatchFunction} from './social-entry';

type Bounds={x:number;y:number;width:number;height:number};
type Events={GoBack?:()=>void;GetBounds?:()=>Bounds;SetBounds?:(x:number,y:number,width:number,height:number)=>void;SetVisible?:(visible:boolean)=>void;on:(name:string,fn:(...args:any[])=>void)=>void;off:(name:string,fn:(...args:any[])=>void)=>void};
type Browser={History?:{index:number;entries:{url:string}[]};LoadURL?:(url:string)=>void;m_refKeyboard?:{ShowVirtualKeyboard:()=>void};URL:string;DisplayURL:string;LoadErrorCode?:number|null;BIsLoadingURL:()=>boolean;GetBrowser:()=>Events};
type Header={IncrementHideHeader:()=>void;DecrementHideHeader:()=>void;GetCurrentBrowserAndBackstack:()=>{browser?:Browser;bExternal?:boolean};SetCurrentBrowserAndBackstack:(...args:any[])=>void};
export type WebWindow={NavigateToSteamWeb?:(url:string)=>void;VirtualKeyboardManager?:{IsShowingVirtualKeyboard?:{Value:boolean}};BrowserWindow:Window;LocationPathName:string;HeaderStore:Header;m_StoreBrowser?:Browser;IsGamepadUIOverlayWindow:()=>boolean;IsAnyVRWindow:()=>boolean;GetShowingGlobalModal:()=>unknown;MenuStore:{GetOpenSideMenu:()=>number};m_history:{location?:{state?:{initialIndex?:number}};goBack?:()=>void;listen:(fn:(location:{pathname:string})=>void)=>()=>void}};
type Adapter={appearance:(url:string,applied:boolean)=>void;begin:(url?:string)=>void;refresh:()=>void;original:()=>void;dispose:()=>void};
const adapters=new WeakMap<object,Adapter>();
let owner:()=>object|undefined=()=>undefined;
export function setWebOwnerResolver(resolve:()=>object|undefined){owner=resolve;return()=>{owner=()=>undefined;};}
export function openGameHubWeb(url:string,navigate:(url:string)=>unknown,windowOwner=owner()){
 const adapter=windowOwner&&adapters.get(windowOwner);adapter?.begin(url);
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
export function connectFullscreenWeb(main:WebWindow,enabled:()=>boolean,patch:PatchFunction,original:symbol,modules:unknown,profileEnabled:()=>boolean=()=>false,openMessage?:(id:string)=>void):Adapter{
 let connected=false,session=false,recovery=false,entered=false,deadline=0,held=false,disposed=false,failed=false;
 let pendingProfile='',profileTarget='',profileReady=false,profileFailed=false;
 // Steam retains one MainBrowser across Store and Community sessions.
 let storeEntry: string | undefined;
 let closingStoreView: Events | undefined;
 let storeBackPending=false;
 const storeSession=()=>!!storeEntry&&enabled()&&!disposed&&!recovery;
 const profileParents:string[]=[];let lastExit=-Infinity;
 const exitProfile=()=>{if(Date.now()-lastExit<300)return;lastExit=Date.now();const parent=profileParents.pop();if(parent&&browser?.LoadURL){adapter.begin(parent);browser.LoadURL(parent);}else main.m_history.goBack?.();};
 const doc=main.BrowserWindow.document;let profileStyle:HTMLStyleElement|undefined,cover:HTMLDivElement|undefined;
 let sizedView:Events|undefined,savedBounds:Bounds|undefined,lastBounds='',restoringVisibility=false;
 const hiddenViews=new Set<Events>();
 // A hidden CEF view can be detached during Back and reused later by Store.
 // Keep ownership until that exact surface is current and actually restored.
 const revealBrowser=()=>{
  if(main.LocationPathName!=='/steamweb')return;
  const view=main.HeaderStore.GetCurrentBrowserAndBackstack().browser?.GetBrowser();
  if(!view||!hiddenViews.has(view))return;
  restoringVisibility=true;
  try{view.SetVisible?.(true);hiddenViews.delete(view);}finally{restoringVisibility=false;}
 };
 const clearProfile=()=>{try{revealBrowser();if(sizedView&&savedBounds)sizedView.SetBounds?.(savedBounds.x,savedBounds.y,savedBounds.width,savedBounds.height);}catch{/* Steam owns destroyed browser cleanup. */}sizedView=undefined;savedBounds=undefined;lastBounds='';doc.documentElement.removeAttribute('data-gh-profile-fullscreen');profileStyle?.remove();profileStyle=undefined;cover?.remove();cover=undefined;};
 const profileLayout=(active:boolean,waiting:boolean)=>{
  if(!active){clearProfile();return;}
  doc.documentElement.setAttribute('data-gh-profile-fullscreen','');
  if(!profileStyle){const classes=browserClasses!;const selector=classSelector;
   profileStyle=doc.createElement('style');profileStyle.textContent=`html[data-gh-profile-fullscreen] .BasicUI{--basicui-header-height:0px!important;--gamepadui-current-footer-height:0px!important}html[data-gh-profile-fullscreen] ${selector(classes.MainBrowserContainer)}{position:fixed!important;inset:0!important;height:100vh!important;width:100vw!important}html[data-gh-profile-fullscreen] ${selector(classes.BrowserContainer)}{height:100%!important}`;profileStyle.textContent+=footerSelector(modules).split(',').filter(Boolean).map(s=>`html[data-gh-profile-fullscreen] ${s}{display:none!important}`).join('');doc.head.append(profileStyle);}
  if(waiting&&!cover){cover=doc.createElement('div');cover.id='game-hub-profile-loading';cover.setAttribute('role','status');cover.setAttribute('aria-live','polite');cover.textContent='Loading GameHub profile…';cover.style.cssText='position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:radial-gradient(ellipse at top,#183455,#071326 65%);color:#e5f2ff;font:24px sans-serif;pointer-events:none';doc.body.append(cover);}
  else if(!waiting){cover?.remove();cover=undefined;}
  // Steam's BrowserView is a separate CEF surface: CSS alone changes the host
  // rectangle but not its native viewport. Match Steam's own SetBounds contract.
  const view=browser?.GetBrowser();const classes=browserClasses;
  const host=classes&&doc.getElementsByClassName(classes.MainBrowserContainer)[0];
  if(view&&host&&view.GetBounds&&view.SetBounds){const measured=host.getBoundingClientRect(),r={x:measured.x,y:measured.y,width:measured.width,height:main.VirtualKeyboardManager?.IsShowingVirtualKeyboard?.Value?Math.min(measured.height,doc.documentElement.clientHeight*.66):measured.height},key=[r.x,r.y,r.width,r.height].join(',');if(r.width>0&&r.height>0&&key!==lastBounds){if(!sizedView){savedBounds=view.GetBounds();sizedView=view;}view.SetBounds(r.x,r.y,r.width,r.height);lastBounds=key;}}
  // Hide only the owned CEF surface while the parent shows the loading cover.
  if(waiting&&view?.SetVisible){view.SetVisible(false);hiddenViews.add(view);}else if(!waiting)revealBrowser();
 };
 const profile=(raw:string)=>{try{const u=new URL(raw);return u.origin==='https://steamcommunity.com'&&/^\/(?:profiles\/\d+|id\/[a-zA-Z0-9_-]+)\/?$/.test(u.pathname)&&compatibleSteamPage(raw);}catch{return false;}};
 let browser:Browser|undefined,secureURL='',loaded=false,blocked=false;
 let timer:ReturnType<typeof setInterval>|undefined;
 const stopWatch=()=>{clearInterval(timer);timer=undefined;};
 const cleanups:(()=>void)[]=[];let releaseBrowser=()=>{};
 const header=main.HeaderStore;
 const browserClasses=resolveSteamUI(modules,'browser'),headerClasses=resolveSteamUI(modules,'header');
 const valid=!!browserClasses&&!!headerClasses&&!!classSelector(headerClasses.Header);
 // Route ownership must hide native chrome before React mounts the destination.
 const syncOwnedRoute=()=>{if(!valid)return;const path=main.LocationPathName;const owned=!disposed&&enabled()&&(path==='/game-base-social'||/^\/game-hub(?:\/|$)/.test(path));doc.documentElement.toggleAttribute('data-gh-owned-route',owned);doc.documentElement.toggleAttribute('data-gh-store-route',!disposed&&enabled()&&!recovery&&/^\/store(?:\/|$)/.test(path));};
 const release=()=>{doc.documentElement.removeAttribute('data-gh-store-web');clearProfile();if(held){held=false;try{header.DecrementHideHeader();}catch{failed=true;}}};
 const refresh=()=>{
  if(!valid||!connected||disposed)return;
  syncOwnedRoute();
  try{
   if(!disposed&&!failed&&(session||profileEnabled()&&profile(browser?.URL||''))&&!recovery&&enabled()){if(!timer)timer=setInterval(()=>{if(!entered&&Date.now()>deadline)session=false;refresh();},100);}else stopWatch();
   const active=header.GetCurrentBrowserAndBackstack();
   const hide=!disposed&&!failed&&valid&&(session||profileEnabled()&&profile(browser?.URL||''))&&!recovery&&enabled()&&main.LocationPathName==='/steamweb'&&!main.IsAnyVRWindow()&&!main.GetShowingGlobalModal()&&main.MenuStore.GetOpenSideMenu()===0&&active.browser===browser&&!active.bExternal&&!!browser&&!blocked&&!browser.LoadErrorCode&&(((loaded||profileEnabled()&&profile(browser.URL))&&!browser.BIsLoadingURL()&&compatibleSteamPage(browser.URL)&&(samePage(secureURL,browser.URL)||!secureURL&&profileEnabled()&&profile(browser.URL))&&samePage(browser.DisplayURL,browser.URL))||(pendingProfile&&profile(pendingProfile)));
   if(hide&&!held){header.IncrementHideHeader();held=true;}else if(!hide)release();
   const full=!!hide&&!storeSession()&&profileEnabled()&&profile(profileTarget||browser?.URL||'');
   profileLayout(full,full&&!profileReady);
   doc.documentElement.toggleAttribute('data-gh-store-web',!!hide&&browser?.URL.startsWith('https://store.steampowered.com/')===true);
   if(cover&&Date.now()>=deadline)cover.textContent='Profile is taking longer to load. Press B to go back.';
  }catch{failed=true;release();}
 };
 const bind=(next:Browser|undefined)=>{
  if(next===browser)return;
  if(!pendingProfile)release();releaseBrowser();browser=next;secureURL='';loaded=false;blocked=false;
  if(!next)return;
  if(!storeSession()&&profileEnabled()&&profile(next.URL)){session=true;pendingProfile=next.URL;profileTarget=next.URL;profileReady=false;profileFailed=false;deadline=Date.now()+8000;}
  const view=next.GetBrowser();if(!view||typeof view.on!=='function'||typeof view.off!=='function'){browser=undefined;return;}
  const listeners:[string,(...args:any[])=>void][]=[];
  const visibilityPatch=typeof view.SetVisible==='function'?patch(view,'SetVisible',args=>{
   if(args[0]===true&&!storeSession()&&!restoringVisibility&&!disposed&&!recovery&&enabled()&&profileEnabled()&&!profileReady&&(!!pendingProfile||profile(next.URL))&&main.LocationPathName==='/steamweb'&&!blocked&&!main.GetShowingGlobalModal()){hiddenViews.add(view);return undefined;}
   return original;
  }):undefined;
  const backPatch=typeof view.GoBack==='function'?patch(view,'GoBack',()=>{
   if(closingStoreView===view||storeSession()&&storeBackPending)return undefined;
   if(!storeSession()||header.GetCurrentBrowserAndBackstack().browser!==next||main.LocationPathName!=='/steamweb')return original;
   const history=next.History, first=main.m_history.location?.state?.initialIndex;
   const atEntry=history&&typeof first==='number'?history.index<=first:samePage(next.URL,storeEntry!);
   if(!atEntry||!main.m_history.goBack)return original;
   main.m_history.goBack();
   return undefined;
  }):undefined;
  releaseBrowser=()=>{backPatch?.unpatch();visibilityPatch?.unpatch();for(const [event,fn] of listeners)view.off(event,fn);listeners.length=0;};
  const listen=(event:string,fn:(...args:any[])=>void)=>{view.on(event,fn);listeners.push([event,fn]);};
  const start=(url:string)=>{if(storeSession()&&profile(url)&&!next.URL.startsWith('https://store.steampowered.com/'))return;if(profile(url)&&next.URL.startsWith('https://store.steampowered.com/'))storeEntry=undefined;const keep=(held||!!pendingProfile||profileEnabled())&&profile(url);pendingProfile=keep?url:'';profileTarget=profile(url)?url:'';profileReady=false;profileFailed=false;if(keep)deadline=Date.now()+8000;secureURL='';loaded=false;blocked=false;if(!keep)release();else {view.SetVisible?.(false);hiddenViews.add(view);refresh();}};
  listen('message',(channel:string,payload?:string)=>{
   if(main.LocationPathName!=='/steamweb'||!profileEnabled()||!profile(next.URL)||header.GetCurrentBrowserAndBackstack().browser!==next)return;
   if(channel==='GameHubProfileReady'&&!blocked&&typeof payload==='string'&&samePage(payload,next.URL)){profileTarget=next.URL;profileReady=true;profileFailed=false;pendingProfile='';refresh();return;}
   if(channel==='GameHubProfileMessage'&&typeof payload==='string'&&/^7656119\d{10}$/.test(payload)){openMessage?.(payload);return;}
   if(channel==='GameHubProfileOpen'&&next.LoadURL&&typeof payload==='string'){try{const request=JSON.parse(payload);if(!profile(request.url)||!profile(request.returnURL)||!samePage(request.returnURL,next.URL)||samePage(request.url,next.URL))return;profileParents.push(request.returnURL);if(profileParents.length>30)profileParents.shift();adapter.begin(request.url);next.LoadURL(request.url);}catch{/* Ignore malformed navigation requests. */}return;}
   if(channel==='GameHubProfileKeyboard'){next.m_refKeyboard?.ShowVirtualKeyboard();refresh();return;}
   if(channel==='GameHubProfileExit'){exitProfile();}
  });
  listen('start-request',start);listen('start-loading',(url:string,loading?:boolean)=>{if(loading===false){loaded=true;refresh();return;}loaded=false;if(profileEnabled()&&profile(url)){start(url);}else if(!pendingProfile)release();});
  listen('history-changed',()=>refresh());
  listen('page-security',(url:string,security:{bIsSecure?:boolean;bHasCertError?:boolean})=>{secureURL=security?.bIsSecure===true&&security?.bHasCertError===false?url:'';if(security?.bHasCertError===true){pendingProfile='';blocked=true;}refresh();});
  listen('finished-request',()=>{pendingProfile='';loaded=true;refresh();});
  for(const event of ['load-error','alert-dialog','confirm-dialog','blocked-request'])listen(event,()=>{pendingProfile='';blocked=true;release();});
 };
 const adapter:Adapter={appearance(url,applied){if(profileTarget&&samePage(url,profileTarget)){if(applied)profileReady=true;profileFailed=!applied&&!profileReady;refresh();}},begin(url){storeBackPending=false;storeEntry=url?.startsWith('https://store.steampowered.com/')?url:undefined;if(storeEntry)profileParents.length=0;profileTarget=profile(url||'')?url!:'';profileReady=false;profileFailed=false;pendingProfile=profile(url||'')?url!:'';if(!pendingProfile)release();secureURL='';loaded=false;session=true;recovery=false;entered=main.LocationPathName==='/steamweb';deadline=Date.now()+8000;refresh();},refresh,original(){recovery=true;stopWatch();release();},dispose(){if(disposed)return;disposed=true;stopWatch();release();releaseBrowser();for(const stop of cleanups.splice(0))stop();adapters.delete(main);}};
 try{
  if(!valid||main.IsAnyVRWindow()||typeof header.IncrementHideHeader!=='function'||typeof header.DecrementHideHeader!=='function'||typeof header.GetCurrentBrowserAndBackstack!=='function'||typeof header.SetCurrentBrowserAndBackstack!=='function')return adapter;
  connected=true;
  // Steam's root Back schedules router.goBack(), then immediately calls CEF
  // GoBack as well, before the asynchronous route change is observable.
  if(typeof main.m_history.goBack==='function'){
   const routeBack=patch(main.m_history,'goBack',()=>{
    if(storeSession()&&main.LocationPathName==='/steamweb'){
     if(storeBackPending)return undefined;
     storeBackPending=true;
    }
    return original;
   });
   cleanups.push(()=>routeBack.unpatch());
  }
  const routeStyle=doc.createElement('style');routeStyle.id='game-hub-route-chrome';
  routeStyle.textContent=controlCenterHeaders(modules).selector.split(',').filter(Boolean).map(selector=>`html[data-gh-owned-route] ${selector},html[data-gh-profile-fullscreen] ${selector}{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;transition:none!important;animation:none!important}`).join('')+'html[data-gh-owned-route] .BasicUI{--basicui-header-height:0px!important}';
  const footer = footerSelector(modules);
  if (footer) {
   const surfaces = ':is(html[data-gh-store-web],html[data-gh-store-route],html[data-gh-owned-route],html[data-gh-profile-fullscreen],html:has(.gbs-root.gbs-room,.gh-home-module,.gha-root,#game-hub-control-center,.gh-music-settings))';
   routeStyle.textContent += `${surfaces} ${footer}{display:none!important}${surfaces} .BasicUI{--gamepadui-current-footer-height:0px!important}`;
  }
  doc.head.append(routeStyle);syncOwnedRoute();cleanups.push(()=>{routeStyle.remove();doc.documentElement.removeAttribute('data-gh-owned-route');doc.documentElement.removeAttribute('data-gh-store-route');});
  const patched=patch(header,'SetCurrentBrowserAndBackstack',args=>{try{if(args[0]){bind(args[0] as Browser);if(!storeSession()&&profileEnabled()&&profile(browser?.URL||'')&&!profileReady){const view=browser?.GetBrowser();if(view){view.SetVisible?.(false);hiddenViews.add(view);}}queueMicrotask(()=>{if(!disposed)refresh();});}else release();}catch{failed=true;release();}return original;});cleanups.push(()=>patched.unpatch());
  bind(header.GetCurrentBrowserAndBackstack().browser??main.m_StoreBrowser);
  cleanups.push(main.m_history.listen(location=>{syncOwnedRoute();if(location.pathname==='/steamweb'){if(session)entered=true;}else if(entered){if(storeSession()){closingStoreView=browser?.GetBrowser();queueMicrotask(()=>{closingStoreView=undefined;});}storeBackPending=false;storeEntry=undefined;session=false;recovery=false;entered=false;stopWatch();}if(location.pathname!=='/steamweb'){profileParents.length=0;release();}else refresh();}));
  // While CEF is hidden, Back belongs to the shell, not the invisible document.
  const cancelLoading=(event:Event)=>{if(!cover||main.LocationPathName!=='/steamweb')return;if(event.type==='keydown'&&(event as KeyboardEvent).key!=='Escape')return;event.preventDefault();event.stopImmediatePropagation();exitProfile();};
  for(const name of ['keydown','vgp_oncancel']){doc.addEventListener(name,cancelLoading,true);cleanups.push(()=>doc.removeEventListener(name,cancelLoading,true));}
  // Events revoke suppression immediately; this watchdog covers route/modal changes and API failures.
  cleanups.push(stopWatch);
  adapters.set(main,adapter);
 }catch{connected=false;failed=true;release();releaseBrowser();for(const stop of cleanups.splice(0))stop();}
 return adapter;
}

