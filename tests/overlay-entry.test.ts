import {afterEach,expect,it,vi} from 'vitest';
import {createControlCenter,type CenterWindow} from '../src/control-center-entry';
import type {PatchFunction} from '../src/social-entry';
const original=Symbol('original');
const patch:PatchFunction=(target,key,fn)=>{const object=target as Record<string,Function>,before=object[key];object[key]=function(...args:unknown[]){const result=fn(args);return result===original?before.apply(this,args):result;};return {unpatch(){object[key]=before;}};};
const stores:ReturnType<typeof createControlCenter>[]=[];
function setup(overlay=true){
 const native=vi.fn(),add=vi.fn(),remove=vi.fn(),unsubscribe=vi.fn();let activated:((pid:number,app:number,active:boolean,userInitiated:boolean)=>void)|undefined;
 const windowInstance:CenterWindow={BrowserWindow:window,LocationPathName:overlay?'/apprunning':'/library/home',params:{appid:750920,browserInfo:{m_unPID:42}},MainRunningAppID:overlay?750920:undefined,BCanNavigate:()=>true,IsGamepadUIOverlayWindow:()=>overlay,MenuStore:{OpenSideMenu:native,CloseSideMenus:vi.fn()},CompositionStateStore:{AddMinimumCompositionStateRequest:add,RemoveMinimumCompositionStateRequest:remove}};
 windowInstance.MenuStore.ToggleSideMenu=function(n,force){if(force!==false)this.OpenSideMenu(n);};
 const store=createControlCenter(windowInstance,patch,original,()=>true,undefined,overlay?{mode:2,subscribe:fn=>{activated=fn;return unsubscribe;}}:undefined);stores.push(store);store.mount(document);
 return {store,windowInstance,native,add,remove,unsubscribe,activate:(pid:number,app:number,active:boolean,userInitiated=true)=>activated?.(pid,app,active,userInitiated)};
}
afterEach(()=>{stores.splice(0).forEach(s=>s.dispose());document.head.innerHTML='';document.body.innerHTML='';vi.restoreAllMocks();});
it('permits a foreground desktop fallback without acquiring overlay composition',()=>{
 const x=setup(false);x.windowInstance.MainRunningAppID=42;x.windowInstance.LocationPathName='/apprunning';
 vi.spyOn(document,'hasFocus').mockReturnValue(false);expect(x.store.showDesktopFallback()).toBe(false);
 vi.mocked(document.hasFocus).mockReturnValue(true);expect(x.store.show()).toBe(false);expect(x.store.showDesktopFallback()).toBe(true);expect(x.add).not.toHaveBeenCalled();
});
it('toggles the same menu request and releases composition only after modal removal',()=>{
 const x=setup();x.windowInstance.MenuStore.OpenSideMenu(1);expect(x.store.getSnapshot()).toBe(true);expect(x.native).not.toHaveBeenCalled();x.store.show();expect(x.add).toHaveBeenCalledTimes(1);
 x.windowInstance.MenuStore.OpenSideMenu(1);expect(x.store.getSnapshot()).toBe(false);expect(x.remove).not.toHaveBeenCalled();x.store.modalClosed();x.store.modalClosed();expect(x.remove).toHaveBeenCalledTimes(1);
});
it('keeps the explicit native recovery and restores the instance method on unload',()=>{
 const x=setup();x.store.show();x.store.native();expect(x.native).toHaveBeenCalledWith(1);x.store.modalClosed();x.store.show();x.store.dispose();expect(x.remove).toHaveBeenCalledTimes(2);expect(x.unsubscribe).toHaveBeenCalledTimes(1);expect(x.windowInstance.MenuStore.OpenSideMenu).toBe(x.native);
});
it('ignores other games and closes only its own deactivated overlay',()=>{
 const x=setup();x.store.show();x.activate(42,750920,false,false);expect(x.store.getSnapshot()).toBe(true);x.activate(43,750920,false);expect(x.store.getSnapshot()).toBe(true);x.activate(42,750920,false);expect(x.store.getSnapshot()).toBe(false);x.store.modalClosed();expect(x.remove).toHaveBeenCalledTimes(1);
});
it('leaves unsupported routes native and preserves the main-window path',()=>{
 const x=setup();x.windowInstance.LocationPathName='/steamweb';x.windowInstance.MenuStore.OpenSideMenu(1);expect(x.native).toHaveBeenCalledWith(1);expect(x.add).not.toHaveBeenCalled();x.store.dispose();const main=setup(false);main.windowInstance.MenuStore.OpenSideMenu(1);expect(main.store.getSnapshot()).toBe(true);expect(main.add).not.toHaveBeenCalled();expect(main.store.owns(document.implementation.createHTMLDocument())).toBe(false);
});

it('ignores native forced-open focus restoration while allowing the next Guide toggle',()=>{
 const x=setup();x.windowInstance.MenuStore.ToggleSideMenu!(1);
 expect(x.store.getSnapshot()).toBe(true);
 x.windowInstance.MenuStore.ToggleSideMenu!(1,true);
 expect(x.store.getSnapshot()).toBe(true);
 x.windowInstance.MenuStore.ToggleSideMenu!(1);
 expect(x.store.getSnapshot()).toBe(false);x.store.modalClosed();
 x.windowInstance.MenuStore.ToggleSideMenu!(1,true);
 expect(x.store.getSnapshot()).toBe(false);
 x.windowInstance.MenuStore.ToggleSideMenu!(1);
 expect(x.store.getSnapshot()).toBe(true);expect(x.native).not.toHaveBeenCalled();
});

it('retains modal/composition ownership until the registered exit transition completes',()=>{
 const x=setup(),exit=vi.fn();const stop=x.store.setExitTransition(exit);x.store.show();x.windowInstance.MenuStore.OpenSideMenu(1);
 expect(exit).toHaveBeenCalledWith(true);expect(x.store.getSnapshot()).toBe(true);expect(x.remove).not.toHaveBeenCalled();
 x.store.close();expect(x.remove).not.toHaveBeenCalled();x.store.modalClosed();expect(x.remove).toHaveBeenCalledTimes(1);stop();
});
it('native handoff bypasses decorative closing motion',()=>{
 const x=setup(),exit=vi.fn();x.store.setExitTransition(exit);x.store.show();x.store.native();expect(exit).not.toHaveBeenCalled();expect(x.store.getSnapshot()).toBe(false);expect(x.native).toHaveBeenCalledOnce();
});

it('expires close restoration suppression so later native open requests work',()=>{
 vi.useFakeTimers();try{
  const x=setup();x.store.show();x.store.close();x.store.modalClosed();
  x.windowInstance.MenuStore.ToggleSideMenu!(1,true);expect(x.store.getSnapshot()).toBe(false);
  vi.advanceTimersByTime(750);
  x.windowInstance.MenuStore.ToggleSideMenu!(1,true);expect(x.store.getSnapshot()).toBe(true);
 }finally{vi.useRealTimers();}
});
