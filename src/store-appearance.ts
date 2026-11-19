import type {WebWindow} from './fullscreen-web';
import {compatibleSteamPage} from './fullscreen-web';
import type {Settings} from './settings';
import type {PatchFunction} from './social-entry';

export type StoreOptions={enabled:boolean;backgrounds:boolean;gloss:boolean;motion:boolean;subtle:boolean;owner?:string};
export type StoreResult={applied:boolean;reason:string};
export type StoreApply=(url:string,options:StoreOptions)=>Promise<StoreResult>;
export const nativeStoreOptions:StoreOptions={enabled:false,backgrounds:false,gloss:false,motion:false,subtle:false};
export function storeOptions(s:Settings):StoreOptions{return {enabled:s.enabled&&s.storeAppearance,backgrounds:s.storeBackgrounds,gloss:s.storeGloss,motion:s.motion&&!s.storeReducedMotion,subtle:s.storeSubtle};}
export function activityURL(raw:string){try{const u=new URL(raw);return u.origin==='https://steamcommunity.com'&&!u.username&&!u.password&&/^\/(?:my|id\/[a-zA-Z0-9_-]+|profiles\/\d+)\/home\/?$/.test(u.pathname)&&[...u.searchParams.keys()].every(k=>['l','snr'].includes(k));}catch{return false;}}
export function profileOverviewURL(raw:string){try{const u=new URL(raw);return u.origin==='https://steamcommunity.com'&&!u.username&&!u.password&&/^\/(?:id\/[a-zA-Z0-9_-]+|profiles\/\d+)\/?$/.test(u.pathname)&&[...u.searchParams.keys()].every(k=>['l','snr','insideModal'].includes(k));}catch{return false;}}
const sameDocument=(a:string,b:string)=>{try{const x=new URL(a),y=new URL(b);x.hash='';y.hash='';return x.href===y.href;}catch{return false;}};
export function themedStoreURL(url:string){
 if(profileOverviewURL(url))return true;
 if(activityURL(url))return true;
 if(compatibleSteamPage(url)&&url.startsWith('https://store.steampowered.com/'))return true;
 try{const u=new URL(url);return u.origin==='https://store.steampowered.com'&&!u.username&&!u.password&&/^\/cart\/?$/.test(u.pathname)&&[...u.searchParams.keys()].every(k=>['snr','l','cc'].includes(k));}catch{return false;}
}

/** Subscribe to the existing browser and route lifecycle. No controller handlers or polling. */
export function connectStoreAppearance(main:WebWindow,settings:()=>Settings,apply:StoreApply,patch:PatchFunction,original:symbol,report:(result:StoreResult,url?:string)=>void){
 let disposed=false,revision=0,secure='',loaded=false,blocked=false,last='';
 let retry:ReturnType<typeof setTimeout>|undefined,retries=0;
 const cancelRetry=()=>{clearTimeout(retry);retry=undefined;};
 let browser:WebWindow['m_StoreBrowser'];let unbind=()=>{};
 const cleanups:(()=>void)[]=[];
 const send=(url:string,options:StoreOptions)=>{
  const key=JSON.stringify([url,options]);if(key===last)return;cancelRetry();last=key;const current=++revision;
  const complete=(result:StoreResult)=>{
   if(disposed||current!==revision)return;
   report(result,url);
   if(result.applied){retries=0;return;}
   if(options.enabled&&profileOverviewURL(url)&&retries<6){
    const delay=Math.min(250*2**retries++,2000);
    retry=setTimeout(()=>{retry=undefined;if(disposed||current!==revision||main.LocationPathName!=='/steamweb'||!browser||!sameDocument(browser.URL,url))return;last='';refresh();},delay);
   }
  };
  void apply(url,options).then(complete,()=>complete({applied:false,reason:'Profile renderer is not ready yet'}));
 };
 const refresh=()=>{
  if(disposed)return;
  if(main.LocationPathName!=='/steamweb')cancelRetry();
  try{
  const prefs=settings();const options=storeOptions(prefs);if(browser&&profileOverviewURL(browser.URL))options.enabled=prefs.enabled&&prefs.profileAppearance;
  // Retain an already-themed profile while its browser is hidden or changing tabs.
  // Reverting its DOM here made Steam paint the original profile on Back.
  if(prefs.enabled&&prefs.profileAppearance&&browser&&profileOverviewURL(browser.URL)&&!blocked&&(main.LocationPathName!=='/steamweb'||(!loaded&&browser.BIsLoadingURL())))return;
  const current=main.HeaderStore.GetCurrentBrowserAndBackstack();
  const eligible=options.enabled&&main.LocationPathName==='/steamweb'&&!blocked&&(loaded||browser&&profileOverviewURL(browser.URL)&&!browser.BIsLoadingURL())&&browser&&current.browser===browser&&!current.bExternal&&!browser.BIsLoadingURL()&&!browser.LoadErrorCode&&sameDocument(browser.URL,browser.DisplayURL)&&(sameDocument(secure,browser.URL)||!secure&&profileOverviewURL(browser.URL))&&themedStoreURL(browser.URL);
  if(!eligible&&prefs.enabled&&prefs.profileAppearance&&browser&&profileOverviewURL(browser.URL)&&!blocked)return;
  send(eligible?browser!.URL:'',eligible?options:nativeStoreOptions);
  }catch{send('',nativeStoreOptions);report({applied:false,reason:'Store browser state unavailable; reopen Store to retry'});}
 };
 const bind=(next:typeof browser)=>{
  if(next===browser)return;cancelRetry();retries=0;unbind();++revision;last='';browser=next;secure='';loaded=false;blocked=false;
  if(!next)return;
  const view=next.GetBrowser(),handlers:[string,(...args:any[])=>void][]=[];
  const on=(name:string,fn:(...args:any[])=>void)=>{view.on(name,fn);handlers.push([name,fn]);};
  unbind=()=>{for(const [name,fn] of handlers)view.off(name,fn);};
  on('start-request',(url:string)=>{cancelRetry();retries=0;++revision;last='';secure='';loaded=false;blocked=false;if(!themedStoreURL(url??''))refresh();});
  on('start-loading',(url:string,loading?:boolean)=>{if(loading===false&&profileOverviewURL(url)&&sameDocument(url,secure))return;loaded=false;});
  on('page-security',(url:string,s:{bIsSecure:boolean;bHasCertError:boolean})=>{secure=s?.bIsSecure===true&&s?.bHasCertError===false?url:'';if(s?.bHasCertError===true)blocked=true;if(!secure||loaded)refresh();});
  on('finished-request',()=>{loaded=true;last='';refresh();});
  on('history-changed',()=>{refresh();});
  for(const event of ['load-error','alert-dialog','confirm-dialog','blocked-request'])on(event,()=>{blocked=true;refresh();});
 };
 const dispose=()=>{if(disposed)return;disposed=true;cancelRetry();++revision;unbind();for(const stop of cleanups.splice(0))stop();void apply('',nativeStoreOptions).catch(()=>{});};
 try{
  if(main.IsAnyVRWindow())return {refresh(){},dispose(){}};
  bind(main.HeaderStore.GetCurrentBrowserAndBackstack().browser??main.m_StoreBrowser);
  const p=patch(main.HeaderStore,'SetCurrentBrowserAndBackstack',args=>{try{if(args[0]){bind(args[0] as typeof browser);queueMicrotask(()=>{if(!disposed)refresh();});}}catch{unbind();send('',nativeStoreOptions);}return original;});cleanups.push(()=>p.unpatch());
  cleanups.push(main.m_history.listen(()=>{if(main.LocationPathName==='/steamweb'&&browser&&profileOverviewURL(browser.URL))last='';refresh();}));
 }catch{dispose();report({applied:false,reason:'Store browser integration unavailable; native Steam remains available'});}
 return {refresh,dispose};
}
