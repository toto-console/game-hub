import {afterEach,expect,it,vi} from 'vitest';
import {compatibleSteamPage,connectFullscreenWeb,openGameHubWeb,restoreOriginalWeb,type WebWindow} from '../src/fullscreen-web';
import type {PatchFunction} from '../src/social-entry';
import {defaults,loadSettings,saveSettings} from '../src/settings';
const original=Symbol();
const patch:PatchFunction=(target,key,fn)=>{const o=target as any,before=o[key];o[key]=function(...args:unknown[]){const r=fn(args);return r===original?before.apply(this,args):r;};return {unpatch(){o[key]=before;}};};
const modules=[{MainBrowserContainer:'browser',BrowserContainer:'container',URLBar:'url'},{Header:'header',DashboardBar:'bar',Clock:'clock',CurrentUserAvatar:'avatar'}];
const stops:(()=>void)[]=[];
afterEach(()=>{stops.splice(0).forEach(stop=>stop());vi.useRealTimers();});
it.each(['https://store.steampowered.com/','https://store.steampowered.com/app/42/Game/','https://store.steampowered.com/search/?term=game','https://steamcommunity.com/profiles/76561190000000000/screenshots/','https://steamcommunity.com/id/friend/','https://steamcommunity.com/games/42/announcements/detail/1','https://steamcommunity.com/sharedfiles/filedetails/?id=42'])('supports public Steam page %s',url=>expect(compatibleSteamPage(url)).toBe(true));
it.each(['https://store.steampowered.com/cart/','https://checkout.steampowered.com/','https://store.steampowered.com/login/','https://steamcommunity.com/openid/login','https://steamcommunity.com/id/friend/edit','https://steamcommunity.com/linkfilter/?url=https://example.com','https://steamcommunity.com/groups/test/login','https://store.steampowered.com/?return_to=https://example.com','https://steamcommunity.com/id/friend/?token=secret','https://store.steampowered.com.evil.test/','https://user@store.steampowered.com/','http://store.steampowered.com/','https://store.steampowered.com:444/','https://store.steampowered.com/unknown/','https://store.steampowered.com/agecheck/app/42/'])('retains native controls for %s',url=>expect(compatibleSteamPage(url)).toBe(false));
function setup(supported=true,profile=false,overlay=false){
 vi.useFakeTimers();const listeners=new Map<string,Set<(...args:any[])=>void>>();
 const visible=vi.fn();const view={SetVisible:visible,on:vi.fn((event:string,fn:(...args:any[])=>void)=>{if(!listeners.has(event))listeners.set(event,new Set());listeners.get(event)!.add(fn);}),off:vi.fn((event:string,fn:(...args:any[])=>void)=>listeners.get(event)?.delete(fn))};
 let loading=false,enabled=true,routeListener:(location:{pathname:string})=>void=()=>{};
 const browser={URL:'https://store.steampowered.com/',DisplayURL:'https://store.steampowered.com/',LoadErrorCode:null as number|null,BIsLoadingURL:()=>loading,GetBrowser:()=>view};
 let current:typeof browser|undefined=browser;
 const header={IncrementHideHeader:vi.fn(),DecrementHideHeader:vi.fn(),GetCurrentBrowserAndBackstack:()=>({browser:current,bExternal:false}),SetCurrentBrowserAndBackstack:(next:typeof browser|undefined)=>{current=next;}};
 const main:WebWindow={BrowserWindow:window,LocationPathName:'/library/home',HeaderStore:header,m_StoreBrowser:browser,IsGamepadUIOverlayWindow:()=>overlay,IsAnyVRWindow:()=>false,GetShowingGlobalModal:()=>false,MenuStore:{GetOpenSideMenu:()=>0},m_history:{listen:fn=>{routeListener=fn;return vi.fn();}}};
 const adapter=connectFullscreenWeb(main,()=>enabled,patch,original,supported?modules:[],()=>profile);stops.push(adapter.dispose);
 const emit=(event:string,...args:any[])=>{for(const fn of listeners.get(event)??[])fn(...args);};
 const route=(pathname:string)=>{main.LocationPathName=pathname;routeListener({pathname});};
 const begin=()=>openGameHubWeb(browser.URL,()=>route('/steamweb'),main);
 const load=(secure=true)=>{loading=true;emit('start-request',browser.URL);emit('start-loading',browser.URL,true);emit('page-security',browser.URL,{bIsSecure:true,bHasCertError:!secure});loading=false;emit('finished-request',browser.URL,'Title');};
 return {main,browser,header,adapter,emit,route,begin,load,listeners,view,visible,enabled:(v:boolean)=>{enabled=v;adapter.refresh();}};
}
it('hides only after an owned navigation has matching successful certificate and load events',()=>{const x=setup();x.route('/steamweb');x.load();expect(x.header.IncrementHideHeader).not.toHaveBeenCalled();x.begin();x.load();expect(x.header.IncrementHideHeader).toHaveBeenCalledOnce();x.adapter.refresh();expect(x.header.IncrementHideHeader).toHaveBeenCalledOnce();x.emit('start-request',x.browser.URL);expect(x.header.DecrementHideHeader).toHaveBeenCalledOnce();});
it('restores immediately on security/load errors, external redirects and prompts',()=>{const x=setup();x.begin();x.load();x.emit('page-security',x.browser.URL,{bIsSecure:true,bHasCertError:true});expect(x.header.DecrementHideHeader).toHaveBeenCalledOnce();x.load();x.emit('alert-dialog','warning');expect(x.header.DecrementHideHeader).toHaveBeenCalledTimes(2);x.load();x.emit('load-error',-1);expect(x.header.DecrementHideHeader).toHaveBeenCalledTimes(3);x.browser.URL=x.browser.DisplayURL='https://example.com/';x.load();expect(x.header.IncrementHideHeader).toHaveBeenCalledTimes(3);});
it('fails open without security evidence or when the certificate belongs to another URL',()=>{const x=setup();x.begin();x.emit('finished-request');x.adapter.refresh();expect(x.header.IncrementHideHeader).not.toHaveBeenCalled();x.emit('page-security','https://steamcommunity.com/',{bIsSecure:true,bHasCertError:false});expect(x.header.IncrementHideHeader).not.toHaveBeenCalled();});
it('toggle, original browser recovery and leaving the web route restore the header',()=>{const x=setup();x.begin();x.load();x.enabled(false);expect(x.header.DecrementHideHeader).toHaveBeenCalledOnce();x.enabled(true);expect(x.header.IncrementHideHeader).toHaveBeenCalledTimes(2);restoreOriginalWeb(x.main);x.adapter.refresh();expect(x.header.DecrementHideHeader).toHaveBeenCalledTimes(2);expect(x.header.IncrementHideHeader).toHaveBeenCalledTimes(2);x.begin();x.load();x.route('/library/home');x.adapter.refresh();expect(x.header.DecrementHideHeader).toHaveBeenCalledTimes(3);});
it('releases on unload and removes all listeners, patches and watchdogs',()=>{const x=setup();x.begin();x.load();x.adapter.dispose();x.adapter.dispose();expect(x.header.DecrementHideHeader).toHaveBeenCalledOnce();expect([...x.listeners.values()].every(s=>s.size===0)).toBe(true);expect(vi.getTimerCount()).toBe(0);});
it('does not hide on an unsupported shell or in-game overlay',()=>{const x=setup(false);x.begin();x.load();expect(x.header.IncrementHideHeader).not.toHaveBeenCalled();expect(x.listeners.size).toBe(0);});
it('restores while native menus or global modals are open',()=>{const x=setup();x.begin();x.load();x.main.GetShowingGlobalModal=()=>true;vi.advanceTimersByTime(100);expect(x.header.DecrementHideHeader).toHaveBeenCalledOnce();});
it('persists the optional preference without dropping existing preferences',()=>{const values=new Map<string,string>();const storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);}};saveSettings({...defaults,fullscreenWeb:false,motion:false},storage);expect(loadSettings(storage)).toMatchObject({fullscreenWeb:false,motion:false});});

it('does no watchdog polling outside an owned web visit',()=>{const x=setup();expect(vi.getTimerCount()).toBe(0);x.begin();expect(vi.getTimerCount()).toBe(1);x.route('/library/home');expect(vi.getTimerCount()).toBe(0);});
it('keeps the header hidden through owned profile transitions and releases on error',()=>{const x=setup();x.browser.URL=x.browser.DisplayURL='https://steamcommunity.com/id/example';x.begin();x.load();x.header.DecrementHideHeader.mockClear();x.emit('start-request',x.browser.URL);x.emit('start-loading');x.adapter.refresh();expect(x.header.DecrementHideHeader).not.toHaveBeenCalled();x.emit('page-security',x.browser.URL,{bIsSecure:true,bHasCertError:true});expect(x.header.DecrementHideHeader).toHaveBeenCalledOnce();});

it('covers the native profile until its layout is applied and fills the browser viewport',()=>{
 const x=setup(true,true);x.browser.URL=x.browser.DisplayURL='https://steamcommunity.com/id/example';x.begin();
 expect(document.getElementById('game-hub-profile-loading')).not.toBeNull();expect(document.documentElement.hasAttribute('data-gh-profile-fullscreen')).toBe(true);
 x.load();expect(document.getElementById('game-hub-profile-loading')).not.toBeNull();
 x.adapter.appearance('https://steamcommunity.com/id/different',true);expect(document.getElementById('game-hub-profile-loading')).not.toBeNull();
 x.adapter.appearance(x.browser.URL,true);expect(document.getElementById('game-hub-profile-loading')).toBeNull();expect(document.documentElement.hasAttribute('data-gh-profile-fullscreen')).toBe(true);
 x.route('/game-base-social');expect(document.documentElement.hasAttribute('data-gh-profile-fullscreen')).toBe(false);
});
it('keeps incomplete profiles covered on timeout and failure, but releases for recovery and modals',()=>{
 const x=setup(true,true);x.browser.URL=x.browser.DisplayURL='https://steamcommunity.com/id/example';x.begin();x.load();vi.advanceTimersByTime(8100);expect(document.getElementById('game-hub-profile-loading')?.textContent).toContain('Press B');
 x.begin();x.adapter.appearance(x.browser.URL,false);expect(document.getElementById('game-hub-profile-loading')).not.toBeNull();
 x.begin();x.main.GetShowingGlobalModal=()=>true;x.adapter.refresh();expect(document.getElementById('game-hub-profile-loading')).toBeNull();
 x.main.GetShowingGlobalModal=()=>false;x.begin();restoreOriginalWeb(x.main);expect(document.documentElement.hasAttribute('data-gh-profile-fullscreen')).toBe(false);
});
it('never covers a profile when the profile appearance setting is disabled',()=>{
 const x=setup(true,false);x.browser.URL=x.browser.DisplayURL='https://steamcommunity.com/id/example';x.begin();x.load();expect(document.getElementById('game-hub-profile-loading')).toBeNull();expect(document.documentElement.hasAttribute('data-gh-profile-fullscreen')).toBe(false);
});

it('resizes the native CEF surface and hides it until the themed profile is ready',()=>{
 const x=setup(true,true),view=x.view as any;const old={x:0,y:40,width:1200,height:700};view.GetBounds=()=>old;view.SetBounds=vi.fn();view.SetVisible=vi.fn();
 const host=document.createElement('div');host.className='browser';host.getBoundingClientRect=()=>({x:0,y:0,width:1200,height:760} as DOMRect);document.body.append(host);
 x.browser.URL=x.browser.DisplayURL='https://steamcommunity.com/id/example';x.begin();expect(view.SetBounds).toHaveBeenCalledWith(0,0,1200,760);expect(view.SetVisible).toHaveBeenLastCalledWith(false);
 x.load();x.adapter.appearance(x.browser.URL,true);expect(view.SetVisible).toHaveBeenLastCalledWith(true);
 x.adapter.original();expect(view.SetBounds).toHaveBeenLastCalledWith(0,40,1200,700);host.remove();
});

it('retains fullscreen when Steam reports a non-loading hash navigation between profile tabs',()=>{
 const x=setup(true,true);x.browser.URL=x.browser.DisplayURL='https://steamcommunity.com/id/example';x.begin();x.load();x.adapter.appearance(x.browser.URL,true);x.header.DecrementHideHeader.mockClear();
 x.browser.URL=x.browser.DisplayURL+='#ghp-games';x.emit('start-loading',x.browser.URL,false);x.emit('history-changed');x.adapter.refresh();expect(x.header.DecrementHideHeader).not.toHaveBeenCalled();expect(document.documentElement.hasAttribute('data-gh-profile-fullscreen')).toBe(true);
});

it('hides a reloading profile immediately and keeps enforcing the cover until appearance is ready',()=>{
 const x=setup(true,true),view=x.view as any;view.SetVisible=vi.fn();
 x.browser.URL=x.browser.DisplayURL='https://steamcommunity.com/id/example';x.begin();x.load();x.adapter.appearance(x.browser.URL,true);
 view.SetVisible.mockClear();x.emit('start-request',x.browser.URL);
 expect(view.SetVisible).toHaveBeenLastCalledWith(false);
 expect(document.getElementById('game-hub-profile-loading')).not.toBeNull();
 view.SetVisible(true);x.adapter.refresh();expect(view.SetVisible).toHaveBeenLastCalledWith(false);
 x.load();x.adapter.appearance(x.browser.URL,true);expect(view.SetVisible).toHaveBeenLastCalledWith(true);
});

it('keeps the profile header suppressed until Back changes the route',()=>{
 const x=setup(true,true);x.browser.URL=x.browser.DisplayURL='https://steamcommunity.com/id/example';x.begin();x.load();x.adapter.appearance(x.browser.URL,true);
 x.header.DecrementHideHeader.mockClear();
 x.main.m_history.goBack=vi.fn(()=>{expect(x.header.DecrementHideHeader).not.toHaveBeenCalled();expect(document.documentElement.hasAttribute('data-gh-profile-fullscreen')).toBe(true);x.route('/game-base-social');});
 x.emit('message','GameHubProfileExit');expect(x.main.m_history.goBack).toHaveBeenCalledOnce();expect(x.header.DecrementHideHeader).toHaveBeenCalledOnce();
});

it('suppresses native chrome on the destination route before the Friends component mounts',()=>{
 const x=setup(true,true);x.browser.URL=x.browser.DisplayURL='https://steamcommunity.com/id/example';x.begin();x.load();x.adapter.appearance(x.browser.URL,true);
 x.route('/game-base-social');expect(document.querySelector('.gbs-root')).toBeNull();expect(document.documentElement.hasAttribute('data-gh-owned-route')).toBe(true);
 expect(document.getElementById('game-hub-route-chrome')?.textContent).toContain('display:none!important');
 x.route('/library/home');expect(document.documentElement.hasAttribute('data-gh-owned-route')).toBe(false);
 x.route('/game-base-social');x.enabled(false);expect(document.documentElement.hasAttribute('data-gh-owned-route')).toBe(false);
});
it('returns a nested friend profile to its parent Friends tab before leaving GameHub',()=>{
 const x=setup(true,true),parent='https://steamcommunity.com/id/parent',child='https://steamcommunity.com/id/child';
 x.browser.URL=x.browser.DisplayURL=parent;x.begin();x.load();x.adapter.appearance(parent,true);
 (x.browser as any).LoadURL=vi.fn(url=>{x.browser.URL=x.browser.DisplayURL=url;x.load();x.adapter.appearance(url,true);});x.main.m_history.goBack=vi.fn();
 x.emit('message','GameHubProfileOpen',JSON.stringify({url:child,returnURL:parent+'#ghp-friends'}));expect((x.browser as any).LoadURL).toHaveBeenLastCalledWith(child);
 x.emit('message','GameHubProfileExit');expect((x.browser as any).LoadURL).toHaveBeenLastCalledWith(parent+'#ghp-friends');expect(x.main.m_history.goBack).not.toHaveBeenCalled();
 x.emit('message','GameHubProfileExit');expect(x.main.m_history.goBack).not.toHaveBeenCalled();
 vi.advanceTimersByTime(350);x.emit('message','GameHubProfileExit');expect(x.main.m_history.goBack).toHaveBeenCalledOnce();
});

it('accepts readiness only from the current profile and ignores stale failure replies',()=>{
 const x=setup(true,true);x.browser.URL=x.browser.DisplayURL='https://steamcommunity.com/id/example';x.begin();x.load();
 x.emit('message','GameHubProfileReady','https://steamcommunity.com/id/other');expect(document.getElementById('game-hub-profile-loading')).not.toBeNull();
 x.emit('message','GameHubProfileReady',x.browser.URL+'#ghp-games');expect(document.getElementById('game-hub-profile-loading')).toBeNull();
 x.adapter.appearance(x.browser.URL,false);expect(document.getElementById('game-hub-profile-loading')).toBeNull();
 x.emit('start-loading',x.browser.URL+'#ghp-inventory',false);expect(document.getElementById('game-hub-profile-loading')).toBeNull();
});
it('installs the same profile lifecycle in an owning in-game overlay window',()=>{
 const x=setup(true,true,true);x.browser.URL=x.browser.DisplayURL='https://steamcommunity.com/id/example';x.begin();x.load();
 expect(document.getElementById('game-hub-profile-loading')).not.toBeNull();x.emit('message','GameHubProfileReady',x.browser.URL);
 expect(document.getElementById('game-hub-profile-loading')).toBeNull();expect(x.header.IncrementHideHeader).toHaveBeenCalledOnce();
 x.route('/library/home');expect(x.header.DecrementHideHeader).toHaveBeenCalledOnce();
});


it('restores a profile-hidden surface reused by the Store after leaving the web route',()=>{
 const x=setup(true,true);x.browser.URL=x.browser.DisplayURL='https://steamcommunity.com/id/example';x.begin();x.load();
 expect(x.visible).toHaveBeenLastCalledWith(false);
 x.route('/game-base-social');
 // Steam reuses the CEF view and can finish navigation before attaching it.
 x.browser.URL=x.browser.DisplayURL='https://store.steampowered.com/app/42/Game/';x.load();
 x.visible.mockClear();x.route('/steamweb');x.adapter.refresh();
 expect(x.visible).toHaveBeenLastCalledWith(true);
 expect(document.getElementById('game-hub-profile-loading')).toBeNull();
});
it('restores visibility for native dialogs without its own profile guard swallowing the restore',()=>{
 const x=setup(true,true);x.browser.URL=x.browser.DisplayURL='https://steamcommunity.com/id/example';x.begin();x.load();
 x.visible.mockClear();x.emit('alert-dialog');expect(x.visible).toHaveBeenLastCalledWith(true);
});

it('repays a Steam show request blocked while the browser still reports its previous profile URL',()=>{
 const x=setup(true,true);x.browser.URL=x.browser.DisplayURL='https://steamcommunity.com/id/example';x.begin();x.load();x.adapter.appearance(x.browser.URL,true);
 const store='https://store.steampowered.com/app/42/Game/';
 x.emit('start-request',store);x.view.SetVisible(false);x.visible.mockClear();
 x.view.SetVisible(true);expect(x.visible).not.toHaveBeenCalled();
 x.browser.URL=x.browser.DisplayURL=store;x.emit('finished-request');
 expect(x.visible).toHaveBeenLastCalledWith(true);
});

it('unsupported browser adapter stays inert even when begin is called directly',()=>{
 const x=setup(false,true);x.main.LocationPathName='/game-hub/home';x.adapter.begin('https://steamcommunity.com/id/example');
 expect(vi.getTimerCount()).toBe(0);
 expect(document.documentElement.hasAttribute('data-gh-owned-route')).toBe(false);
 expect(x.view.SetVisible).not.toHaveBeenCalled();
 expect(document.getElementById('game-hub-profile-loading')).toBeNull();
 x.adapter.dispose();
});

it('keeps direct begin inert when class exports exist but a required browser API is missing',()=>{
 const x=setup();x.adapter.dispose();
 const header={...x.header,IncrementHideHeader:undefined};
 const adapter=connectFullscreenWeb({...x.main,HeaderStore:header} as unknown as WebWindow,()=>true,patch,original,modules,()=>true);
 adapter.begin('https://steamcommunity.com/id/example');
 expect(vi.getTimerCount()).toBe(0);expect(x.view.SetVisible).not.toHaveBeenCalled();adapter.dispose();
});
