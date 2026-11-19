import {registerCenterDiagnostic} from './center-diagnostics';
import {type PatchFunction,type PatchHandle} from './social-entry';
import {focusControl} from './navigation';

/** Each window’s existing native menu request is the boundary; no controller input hooks. */
export type CenterWindow = {BrowserWindow:Window;LocationPathName:string;MainRunningAppID?:number|string;params?:{appid?:number;gameid?:string;browserInfo?:{m_unPID?:number}};CompositionStateStore?:{AddMinimumCompositionStateRequest(mode:number,label:string):void;RemoveMinimumCompositionStateRequest(mode:number,label:string):void};BCanNavigate():boolean;IsAnyVRWindow?():boolean;IsGamepadUIOverlayWindow?():boolean;GetShowingGlobalModal?():unknown;MenuStore:{GetQuickAccessTab?():number;ToggleSideMenu?(n:number,open?:boolean):void;OpenSideMenu(n:number):void;CloseSideMenus():void;m_cSuppressRequests?:number}};
export function createControlCenter(candidate:unknown,patch:PatchFunction,original:symbol,enabled:()=>boolean,headers={css:"",selector:""},overlay?:{mode:number;subscribe:(fn:(pid:number,app:number,active:boolean,userInitiated:boolean)=>void)=>()=>void}){
 const main=candidate as CenterWindow|undefined;
 const listeners=new Set<()=>void>();
 let open=false,ready=false,disposed=false,bypass=0,origin:HTMLElement|null=null,handle:PatchHandle|undefined,owner:Document|undefined,restoreFrame=0;
 const inGame=!!main?.IsGamepadUIOverlayWindow?.();
 let focusHandle:PatchHandle|undefined,returningToGame=false,returnedAt=0;
 let compositionHeld=false,stopActivation:(()=>void)|undefined;
 const compositionLabel='Game Hub Control Center';
 const releaseComposition=()=>{if(!compositionHeld)return;compositionHeld=false;try{main?.CompositionStateStore?.RemoveMinimumCompositionStateRequest(overlay!.mode,compositionLabel);}catch(error){console.error('[Game Hub] Overlay composition release failed',error);}};
 let headerStyle:HTMLStyleElement|undefined,headerObserver:MutationObserver|undefined;
 const releaseHeader=()=>{
  if(open||!owner||owner.querySelector('.gbs-modal-owner')||!owner.documentElement.hasAttribute('data-game-hub-center'))return;
  // Commit Steam's restored opacity while theme transitions are still disabled.
  // Removing both guards together starts the theme's 400ms opacity fade on Home.
  owner.documentElement.setAttribute('data-game-hub-center','settling');
  if(headers.selector)for(const header of Array.from(owner.querySelectorAll(headers.selector))){
   void owner.defaultView?.getComputedStyle(header).opacity;
  }
  owner.documentElement.removeAttribute('data-game-hub-center');
 };
 const cleanupHeader=()=>{headerObserver?.disconnect();headerObserver=undefined;owner?.documentElement.removeAttribute('data-game-hub-center');headerStyle?.remove();headerStyle=undefined;};
 const emit=()=>listeners.forEach(fn=>fn());
 let exitTransition:((restore:boolean)=>void)|undefined;
 const requestClose=(restore=true)=>{if(open&&exitTransition)exitTransition(restore);else close(restore);};
 const close=(restore=true)=>{cancelAnimationFrame(restoreFrame);if(!open){queueMicrotask(releaseHeader);return;}open=false;if(inGame){returningToGame=true;returnedAt=Date.now();}emit();queueMicrotask(releaseHeader);const previous=origin;origin=null;if(restore&&!inGame&&previous?.isConnected)restoreFrame=requestAnimationFrame(()=>{if(!open)focusControl(previous);});};
 let activationFailed=false,lastAction='none',lastResult='none';
 const ensureActivation=()=>{if(disposed||!owner||!inGame||stopActivation)return;try{if(!overlay){activationFailed=true;return;}stopActivation=overlay.subscribe((pid,app,active,userInitiated)=>{if(userInitiated&&!active&&app===main?.params?.appid&&pid===main?.params?.browserInfo?.m_unPID)close(false);});activationFailed=false;}catch{activationFailed=true;}};
 const reason=(desktopHandoff=false):string=>{try{
  if(disposed)return 'disposed';if(!enabled())return 'disabled';if(!ready)return 'ui-not-mounted';
  if(!main||!owner||owner!==main.BrowserWindow.document)return 'window-unavailable';
  if(!main.BCanNavigate())return 'navigation-unavailable';if(main.IsAnyVRWindow?.())return 'vr-unsupported';
  if(inGame){
   if(!overlay||activationFailed||!stopActivation)return 'overlay-activation-unavailable';
   if(!main.params?.appid)return 'overlay-app-context-unavailable';
   if(!main.CompositionStateStore?.AddMinimumCompositionStateRequest||!main.CompositionStateStore?.RemoveMinimumCompositionStateRequest)return 'overlay-composition-unavailable';
   if(!/^\/(apprunning|appoverlay)(\/|$)/.test(main.LocationPathName))return 'overlay-route-unsupported';
  }else if(!(desktopHandoff&&owner.hasFocus())&&(main.MainRunningAppID||main.LocationPathName==='/apprunning'))return 'game-running-in-main-window';
  if(!open&&main.GetShowingGlobalModal?.())return 'another-modal-active';if(main.MenuStore.m_cSuppressRequests)return 'steam-menu-suppressed';
  return 'ready';
 }catch{return 'steam-interface-unavailable';}};
 const supported=(desktopHandoff=false)=>reason(desktopHandoff)==='ready';
 const show=(desktopHandoff=false)=>{lastAction=desktopHandoff?'desktop-handoff':'open';ensureActivation();lastResult=reason(desktopHandoff);if(lastResult!=='ready')return false;if(open){lastResult='opened';return true;}
  try{returningToGame=false;cancelAnimationFrame(restoreFrame);origin=owner!.activeElement as HTMLElement|null;owner!.documentElement.setAttribute('data-game-hub-center','open');if(inGame&&!compositionHeld){main!.CompositionStateStore!.AddMinimumCompositionStateRequest(overlay!.mode,compositionLabel);compositionHeld=true;}main!.MenuStore.CloseSideMenus();open=true;emit();lastResult='opened';return true;}
  catch{open=false;lastResult='open-failed';releaseComposition();releaseHeader();return false;}
 };
 const diagnostic=()=>({context:inGame?'in-game':'home',mounted:ready,hooked:!!handle,enabled:enabled(),open,reason:reason(),lastAction,lastResult,activationSubscribed:!!stopActivation});
 const unregisterDiagnostic=registerCenterDiagnostic(diagnostic);

 const native=()=>{close(false);returningToGame=false;if(!main?.MenuStore?.OpenSideMenu)throw Error('Steam menu is unavailable. Disable Control Center in Decky.');bypass++;try{main.MenuStore.OpenSideMenu(1);}finally{bypass--;}};
 try{
  const menu=main?.MenuStore;
  if(menu&&typeof menu.OpenSideMenu==='function'&&typeof menu.CloseSideMenus==='function'){
   let p:object|null=menu;while(p&&!Object.hasOwn(p,'OpenSideMenu'))p=Object.getPrototypeOf(p);
   const descriptor=p&&Object.getOwnPropertyDescriptor(p,'OpenSideMenu');
   if(descriptor?.writable&&(p===menu||Object.isExtensible(menu))){
    const hadOwn=Object.hasOwn(menu,'OpenSideMenu'),before=menu.OpenSideMenu;
    const h=patch(menu,'OpenSideMenu',args=>{
     if(disposed||bypass)return original;
     lastAction='native-menu-request';ensureActivation();lastResult=reason();
     if(!enabled()||!ready)return original;
     // Explicit plugin and Friends calls retain their own adapters/recovery.
     // GetQuickAccessTab is optional on older Steam clients.
     if(args[0]===2&&[999,3].includes(menu.GetQuickAccessTab?.()??-1)){close(false);return original;}
     if(args[0]!==1&&args[0]!==2){close(false);return original;}
     if(!open&&!supported())return original;
     try{if(open)requestClose();else if(!show()){lastAction='native-menu-request';return original;}lastAction='native-menu-request';return;}catch{close(false);releaseComposition();return original;}
    });
    handle={unpatch(){h.unpatch();if(!hadOwn&&menu.OpenSideMenu===before)Reflect.deleteProperty(menu,'OpenSideMenu');}};
    // Steam's native sidebar focus restoration calls ToggleSideMenu(Main, true).
    // That is not a new Guide press (which omits the second argument). Don't
    // reopen the center when our modal returns focus to that native nav tree.
    if(inGame&&typeof menu.ToggleSideMenu==='function'){
     const ownToggle=Object.hasOwn(menu,'ToggleSideMenu'),beforeToggle=menu.ToggleSideMenu;
     const f=patch(menu,'ToggleSideMenu',args=>{
      if(disposed||bypass||!ready||!enabled())return original;
      if(args[0]===1){
       if(returningToGame&&Date.now()-returnedAt>=500)returningToGame=false;
       if(args[1]===true&&(open||returningToGame))return;
       if(args[1]===undefined)returningToGame=false;
      }
      return original;
     });
     focusHandle={unpatch(){f.unpatch();if(!ownToggle&&menu.ToggleSideMenu===beforeToggle)Reflect.deleteProperty(menu,'ToggleSideMenu');}};
    }

   }
  }
 }catch{/* Native menu remains authoritative if the interface changes. */}
 return {
  diagnostic,
  subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};},getSnapshot:()=>open,
  get connected(){return !!handle;},get inGame(){return inGame;},get currentAppId(){return inGame?main?.params?.appid:undefined;},show,showDesktopFallback:()=>show(true),close,requestClose,native,
  runNative<T>(run:()=>T):T{bypass++;try{return run();}finally{bypass--;}} ,
  setExitTransition(fn:(restore:boolean)=>void){exitTransition=fn;return()=>{if(exitTransition===fn)exitTransition=undefined;};},
  modalClosed(){if(!open)releaseComposition();},
  owns:(doc:Document)=>!!main&&doc===main.BrowserWindow?.document,
  mount(doc:Document){if(!main||doc!==main.BrowserWindow?.document)return()=>{};owner=doc;headerStyle=doc.createElement('style');headerStyle.textContent=headers.css;doc.head.append(headerStyle);const Observer=doc.defaultView?.MutationObserver;if(Observer){headerObserver=new Observer(releaseHeader);headerObserver.observe(doc.body,{childList:true,subtree:true});}ensureActivation();ready=true;return()=>{ready=false;close(false);try{stopActivation?.();}catch(error){console.error('[Game Hub] Overlay subscription cleanup failed',error);}stopActivation=undefined;releaseComposition();cleanupHeader();owner=undefined;};},
  fail(){lastResult='render-failed';ready=false;close(false);releaseComposition();try{native();}catch{/* Decky remains available. */}},
  dispose(){unregisterDiagnostic();disposed=true;ready=false;close();try{stopActivation?.();}catch(error){console.error('[Game Hub] Overlay subscription cleanup failed',error);}stopActivation=undefined;releaseComposition();cleanupHeader();focusHandle?.unpatch();focusHandle=undefined;handle?.unpatch();handle=undefined;listeners.clear();}
 };
}
export type ControlCenterStore=ReturnType<typeof createControlCenter>;

