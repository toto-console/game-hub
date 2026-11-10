import type {WebWindow} from './fullscreen-web';
import {compatibleSteamPage} from './fullscreen-web';
import type {Settings} from './settings';
import type {PatchFunction} from './social-entry';

export type StoreOptions={enabled:boolean;backgrounds:boolean;gloss:boolean;motion:boolean;subtle:boolean};
export type StoreResult={applied:boolean;reason:string};
export type StoreApply=(url:string,options:StoreOptions)=>Promise<StoreResult>;
export const nativeStoreOptions:StoreOptions={enabled:false,backgrounds:false,gloss:false,motion:false,subtle:false};
export function storeOptions(s:Settings):StoreOptions{return {enabled:s.enabled&&s.storeAppearance,backgrounds:s.storeBackgrounds,gloss:s.storeGloss,motion:s.motion&&!s.storeReducedMotion,subtle:s.storeSubtle};}
export function activityURL(raw:string){try{const u=new URL(raw);return u.origin==='https://steamcommunity.com'&&!u.username&&!u.password&&/^\/(?:my|id\/[a-zA-Z0-9_-]+|profiles\/\d+)\/home\/?$/.test(u.pathname)&&[...u.searchParams.keys()].every(k=>['l','snr'].includes(k));}catch{return false;}}
export function themedStoreURL(url:string){
 if(activityURL(url))return true;
 if(compatibleSteamPage(url)&&url.startsWith('https://store.steampowered.com/'))return true;
 try{const u=new URL(url);return u.origin==='https://store.steampowered.com'&&!u.username&&!u.password&&/^\/cart\/?$/.test(u.pathname)&&[...u.searchParams.keys()].every(k=>['snr','l','cc'].includes(k));}catch{return false;}
}

/** Subscribe to the existing browser and route lifecycle. No controller handlers or polling. */
export function connectStoreAppearance(main:WebWindow,settings:()=>Settings,apply:StoreApply,patch:PatchFunction,original:symbol,report:(result:StoreResult)=>void){
 let disposed=false,revision=0,secure='',loaded=false,blocked=false,last='';
 let browser:WebWindow['m_StoreBrowser'];let unbind=()=>{};
 const cleanups:(()=>void)[]=[];
 const send=(url:string,options:StoreOptions)=>{
  const key=JSON.stringify([url,options]);if(key===last)return;last=key;const current=++revision;
  void apply(url,options).then(result=>{if(!disposed&&current===revision)report(result);},()=>{if(!disposed&&current===revision){last='';report({applied:false,reason:'Store appearance unavailable; native Steam remains available'});}});
 };
 const refresh=()=>{
  if(disposed)return;
  try{
  const options=storeOptions(settings());
  const current=main.HeaderStore.GetCurrentBrowserAndBackstack();
  const eligible=options.enabled&&main.LocationPathName==='/steamweb'&&!blocked&&loaded&&browser&&current.browser===browser&&!current.bExternal&&!browser.BIsLoadingURL()&&!browser.LoadErrorCode&&browser.URL===browser.DisplayURL&&secure===browser.URL&&themedStoreURL(browser.URL);
  send(eligible?browser!.URL:'',eligible?options:nativeStoreOptions);
  }catch{send('',nativeStoreOptions);report({applied:false,reason:'Store browser state unavailable; reopen Store to retry'});}
 };
 const bind=(next:typeof browser)=>{
  if(next===browser)return;unbind();browser=next;secure='';loaded=false;blocked=false;
  if(!next)return;
  const view=next.GetBrowser(),handlers:[string,(...args:any[])=>void][]=[];
  const on=(name:string,fn:(...args:any[])=>void)=>{view.on(name,fn);handlers.push([name,fn]);};
  unbind=()=>{for(const [name,fn] of handlers)view.off(name,fn);};
  on('start-request',(url:string)=>{secure='';loaded=false;blocked=false;if(!themedStoreURL(url??''))refresh();});
  on('start-loading',()=>{loaded=false;});
  on('page-security',(url:string,s:{bIsSecure:boolean;bHasCertError:boolean})=>{secure=s?.bIsSecure===true&&s?.bHasCertError===false?url:'';if(!secure||loaded)refresh();});
  on('finished-request',()=>{loaded=true;last='';refresh();});
  on('history-changed',()=>{if(loaded)refresh();});
  for(const event of ['load-error','alert-dialog','confirm-dialog','blocked-request'])on(event,()=>{blocked=true;refresh();});
 };
 const dispose=()=>{if(disposed)return;disposed=true;++revision;unbind();for(const stop of cleanups.splice(0))stop();void apply('',nativeStoreOptions).catch(()=>{});};
 try{
  if(main.IsGamepadUIOverlayWindow()||main.IsAnyVRWindow())return {refresh(){},dispose(){}};
  bind(main.HeaderStore.GetCurrentBrowserAndBackstack().browser??main.m_StoreBrowser);
  const p=patch(main.HeaderStore,'SetCurrentBrowserAndBackstack',args=>{try{if(args[0])bind(args[0] as typeof browser);}catch{unbind();send('',nativeStoreOptions);}return original;});cleanups.push(()=>p.unpatch());
  cleanups.push(main.m_history.listen(()=>refresh()));
 }catch{dispose();report({applied:false,reason:'Store browser integration unavailable; native Steam remains available'});}
 return {refresh,dispose};
}
