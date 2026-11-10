import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest';
import {replacePatch,callOriginal} from '../node_modules/@decky/ui/dist/utils/patcher.js';
import {connectSocialEntry,HUB_ROUTE} from '../src/social-entry';
beforeEach(()=>vi.spyOn(console,'debug').mockImplementation(()=>{}));
afterEach(()=>vi.restoreAllMocks());
function fixture(){
 const paths:unknown[][]=[];const menus:unknown[][]=[];
 const target={LocationPathName:'/library/home',BCanNavigate:()=>true,
   Navigate(...args:unknown[]){expect(this).toBe(target);paths.push(args);this.LocationPathName=args[0] as string;return 'navigated';},
   MenuStore:{OpenQuickAccessMenu(...args:unknown[]){expect(this).toBe(target.MenuStore);menus.push(args);return 'native-menu';},CloseSideMenus:vi.fn()}};
 const originals={navigate:target.Navigate,menu:target.MenuStore.OpenQuickAccessMenu};
 let enabled=true;
 const entry=connectSocialEntry(target,replacePatch,callOriginal,()=>enabled);
 return {target,paths,menus,entry,originals,disable:()=>{enabled=false;}};
}
describe('Friends & Chat entry',()=>{
 it('handles the real locked Steam action via its writable side-menu caller',()=>{
   const f=fixture();f.entry.dispose();let tab=4;const opened:unknown[]=[];
   const prototype={OpenSideMenu(value:unknown){opened.push(value);},GetQuickAccessTab(){return tab;}};
   const menu=Object.create(prototype);
   menu.CloseSideMenus=vi.fn();
   Object.defineProperty(menu,'OpenQuickAccessMenu',{value:function(value:number,open=true){tab=value;if(open)this.OpenSideMenu(2);},writable:false,configurable:false});
   f.target.MenuStore=menu;
   const entry=connectSocialEntry(f.target,replacePatch,callOriginal,()=>true);
   expect(entry.connected).toBe(true);
   menu.OpenQuickAccessMenu(3,true);expect(f.paths).toEqual([[HUB_ROUTE]]);expect(opened).toEqual([]);
   menu.OpenQuickAccessMenu(4,true);expect(opened).toEqual([2]);
   menu.OpenQuickAccessMenu(3,false);expect(opened).toEqual([2]);
   menu.OpenSideMenu(1);expect(opened).toEqual([2,1]);
   entry.openNative();expect(f.paths.at(-1)).toEqual([HUB_ROUTE]);expect(opened).toEqual([2,1,2]);
   entry.dispose();expect(Object.hasOwn(menu,'OpenSideMenu')).toBe(false);
   expect(Object.getOwnPropertyDescriptor(menu,'OpenQuickAccessMenu')).toMatchObject({writable:false,configurable:false});
   menu.OpenQuickAccessMenu(3,true);expect(opened).toEqual([2,1,2,2]);
 });
 it('redirects the exact native route in one history operation',()=>{const f=fixture();expect(f.entry.connected).toBe(true);expect(f.target.Navigate('/chat',false,true)).toBe('navigated');expect(f.paths).toEqual([[HUB_ROUTE,false,true]]);f.entry.dispose();});
 it('redirects Windows Friends QAM opening without flashing native QAM',()=>{const f=fixture();f.target.MenuStore.OpenQuickAccessMenu(3,true);expect(f.paths).toEqual([[HUB_ROUTE]]);expect(f.menus).toEqual([]);expect(f.target.MenuStore.CloseSideMenus).toHaveBeenCalledOnce();f.entry.dispose();});
 it('leaves all unrelated routes, targeted chats and background tab selection untouched',()=>{const f=fixture();for(const path of ['/library/home','/library','/store','/settings','/downloads','/chat/123','/chat?friend=123'])f.target.Navigate(path);f.target.Navigate('/chat',false,false,{target:'friend'});const location={pathname:'/chat',state:{target:'friend'}};f.target.Navigate(location);for(const args of [[0],[2],[4],[999],[3,false]])expect(f.target.MenuStore.OpenQuickAccessMenu(...args)).toBe('native-menu');expect(f.paths[7]).toEqual(['/chat',false,false,{target:'friend'}]);expect(f.paths[8][0]).toBe(location);expect(f.paths.flat()).not.toContain(HUB_ROUTE);expect(f.menus).toEqual([[0],[2],[4],[999],[3,false]]);f.entry.dispose();});
 it('does not add duplicate hub history entries on repeated clicks',()=>{const f=fixture();f.target.MenuStore.OpenQuickAccessMenu(3);f.target.MenuStore.OpenQuickAccessMenu(3);f.target.Navigate('/chat');expect(f.paths).toEqual([[HUB_ROUTE]]);f.entry.dispose();});
 it('opens native chat without a redirect loop and restores the next shortcut',()=>{const f=fixture();f.entry.openNative();expect(f.paths).toEqual([['/chat']]);f.target.MenuStore.OpenQuickAccessMenu(3);expect(f.paths[1]).toEqual([HUB_ROUTE]);f.entry.dispose();});
 it('passes through when disabled or unable to navigate',()=>{const f=fixture();f.disable();f.target.Navigate('/chat');expect(f.paths).toEqual([['/chat']]);f.entry.dispose();const g=fixture();g.target.BCanNavigate=()=>false;g.target.MenuStore.OpenQuickAccessMenu(3);expect(g.menus).toEqual([[3]]);g.entry.dispose();});
 it('restores exact functions on unload and allows repeated cleanup',()=>{const f=fixture();f.entry.dispose();f.entry.dispose();expect(f.target.Navigate).toBe(f.originals.navigate);expect(f.target.MenuStore.OpenQuickAccessMenu).toBe(f.originals.menu);});
 it('keeps a later Decky-compatible plugin patch intact on cleanup',()=>{const f=fixture();const later=replacePatch(f.target,'Navigate',()=>callOriginal);f.entry.dispose();expect(f.target.Navigate).toBe(later.patchedFunction);f.target.Navigate('/chat');expect(f.paths).toEqual([['/chat']]);later.unpatch();expect(f.target.Navigate).toBe(f.originals.navigate);});
 it('fails closed on missing and changed instances',()=>{for(const v of [null,{}, {Navigate:()=>{}},{get Navigate(){throw Error();}}])expect(connectSocialEntry(v,replacePatch,callOriginal,()=>true).connected).toBe(false);});
 it('rolls back the first hook if the second hook cannot be installed',()=>{const f=fixture();f.entry.dispose();Object.freeze(f.target.MenuStore);const entry=connectSocialEntry(f.target,replacePatch,callOriginal,()=>true);expect(entry.connected).toBe(false);expect(f.target.Navigate).toBe(f.originals.navigate);});
 it('falls back to the native QAM if hub navigation throws',()=>{const f=fixture();f.entry.dispose();f.target.Navigate=()=>{throw Error('navigation failed');};const entry=connectSocialEntry(f.target,replacePatch,callOriginal,()=>true);expect(f.target.MenuStore.OpenQuickAccessMenu(3)).toBe('native-menu');entry.dispose();});
});
