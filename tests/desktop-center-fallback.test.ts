import {afterEach,expect,it,vi} from 'vitest';
import {connectDesktopCenterFallback} from '../src/desktop-center-fallback';
let stop=()=>{};
afterEach(()=>{stop();vi.restoreAllMocks();});
function setup(){
 vi.spyOn(document,'hasFocus').mockReturnValue(true);
 const options={enabled:()=>true,running:()=>[{appid:42,display_name:'Roblox'}],isShortcut:()=>true,overlays:vi.fn(async()=>[] as {appID:number}[]),open:vi.fn(()=>true),isOpen:()=>false};
 stop=connectDesktopCenterFallback(window,options);return options;
}
const focus=async()=>{window.dispatchEvent(new Event('focus'));await new Promise(r=>setTimeout(r,0));};
it('opens only after a desktop focus handoff without a Roblox overlay',async()=>{
 const o=setup();expect(o.open).not.toHaveBeenCalled();await focus();expect(o.open).toHaveBeenCalledOnce();
 o.overlays.mockResolvedValue([{appID:42}]);await focus();expect(o.open).toHaveBeenCalledOnce();
});
it('does not intercept other games, disabled settings, or an already open center',async()=>{
 const o=setup();o.running=()=>[{appid:7,display_name:'Other game'}];await focus();expect(o.overlays).not.toHaveBeenCalled();
 o.running=()=>[{appid:42,display_name:'Roblox'}];o.enabled=()=>false;await focus();expect(o.open).not.toHaveBeenCalled();
 o.enabled=()=>true;o.isOpen=()=>true;await focus();expect(o.open).not.toHaveBeenCalled();
});
it('invalidates pending work on blur, game exit and disposal',async()=>{
 const o=setup();let resolve!:(x:{appID:number}[])=>void;o.overlays.mockImplementation(()=>new Promise(r=>{resolve=r;}));
 window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('blur'));resolve([]);await focus();
 o.running=()=>[];resolve([]);await Promise.resolve();expect(o.open).not.toHaveBeenCalled();
 stop();window.dispatchEvent(new Event('focus'));expect(o.open).not.toHaveBeenCalled();
});
it('fails safely and ignores descendant focus events',async()=>{
 const o=setup();document.body.dispatchEvent(new Event('focus',{bubbles:true}));expect(o.overlays).not.toHaveBeenCalled();
 o.overlays.mockRejectedValue(Error('offline'));await focus();expect(o.open).not.toHaveBeenCalled();
});
