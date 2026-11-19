import {afterEach,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {connectStoreAppearance,storeOptions,themedStoreURL,type StoreResult} from '../src/store-appearance';
import {defaults,loadSettings,saveSettings} from '../src/settings';
import type {WebWindow} from '../src/fullscreen-web';
import type {PatchFunction} from '../src/social-entry';
const original=Symbol();
const patch:PatchFunction=(t,k,fn)=>{const target=t as any,before=target[k];target[k]=function(...args:any[]){const r=fn(args);return r===original?before.apply(this,args):r;};return {unpatch:()=>{target[k]=before;}};};
const stops:(()=>void)[]=[];
afterEach(()=>{stops.splice(0).forEach(f=>f());vi.restoreAllMocks();vi.useRealTimers();});
function setup(){
 const events=new Map<string,Set<(...args:any[])=>void>>();let route=()=>{},s={...defaults};
 const view={on:(e:string,f:(...args:any[])=>void)=>{if(!events.has(e))events.set(e,new Set());events.get(e)!.add(f);},off:(e:string,f:(...args:any[])=>void)=>events.get(e)?.delete(f)};
 const browser={URL:'https://store.steampowered.com/',DisplayURL:'https://store.steampowered.com/',BIsLoadingURL:()=>false,GetBrowser:()=>view};
 const main={LocationPathName:'/steamweb',m_StoreBrowser:browser,IsGamepadUIOverlayWindow:()=>false,IsAnyVRWindow:()=>false,HeaderStore:{GetCurrentBrowserAndBackstack:()=>({browser,bExternal:false}),SetCurrentBrowserAndBackstack(){}},m_history:{listen:(f:()=>void)=>{route=f;return vi.fn();}}} as unknown as WebWindow;
 const apply=vi.fn(async():Promise<StoreResult>=>({applied:true,reason:'ok'})),report=vi.fn();
 const adapter=connectStoreAppearance(main,()=>s,apply,patch,original,report);stops.push(adapter.dispose);
 const emit=(e:string,...args:any[])=>events.get(e)?.forEach(f=>f(...args));
 const load=()=>{emit('start-request',browser.URL);emit('page-security',browser.URL,{bIsSecure:true,bHasCertError:false});emit('finished-request');};
 return {adapter,main,browser,apply,report,emit,load,events,route,set:(next:Partial<typeof defaults>)=>{s={...s,...next};adapter.refresh();}};
}
it.each(['https://checkout.steampowered.com/','https://store.steampowered.com/agecheck/app/620/','https://store.steampowered.com/login/','https://steamcommunity.com/','https://store.steampowered.com.evil.test/','https://store.steampowered.com/?token=x'])('keeps sensitive/foreign route native: %s',url=>expect(themedStoreURL(url)).toBe(false));
it('requires matching secure browser completion before applying',()=>{const x=setup();x.emit('finished-request');expect(x.apply).toHaveBeenLastCalledWith('',expect.objectContaining({enabled:false}));x.load();expect(x.apply).toHaveBeenLastCalledWith(x.browser.URL,expect.objectContaining({enabled:true}));x.emit('page-security',x.browser.URL,{bIsSecure:true,bHasCertError:true});expect(x.apply).toHaveBeenLastCalledWith('',expect.objectContaining({enabled:false}));});
it('restores native on route exit, disable, and modal/security errors',()=>{const x=setup();x.load();x.main.LocationPathName='/library';x.route();expect(x.apply).toHaveBeenLastCalledWith('',expect.objectContaining({enabled:false}));x.main.LocationPathName='/steamweb';x.load();x.set({storeAppearance:false});expect(x.apply).toHaveBeenLastCalledWith('',expect.objectContaining({enabled:false}));});
it('cleans every listener and ignores late status replies after unmount',async()=>{const x=setup();x.load();x.adapter.dispose();await Promise.resolve();expect([...x.events.values()].every(e=>e.size===0)).toBe(true);expect(x.report).not.toHaveBeenCalled();expect(x.apply).toHaveBeenLastCalledWith('',expect.objectContaining({enabled:false}));});
it('persists preferences and respects global reduced motion',()=>{localStorage.clear();saveSettings({...defaults,storeGloss:false,storeSubtle:true},localStorage);expect(loadSettings(localStorage)).toMatchObject({storeGloss:false,storeSubtle:true});expect(storeOptions({...defaults,motion:false}).motion).toBe(false);expect(storeOptions({...defaults,storeReducedMotion:true}).motion).toBe(false);});
const docScript=readFileSync('store-theme/document.js','utf8');
function documentTheme(url='https://store.steampowered.com/'){
 const domWindow={...window,__gameHubStoreAppearance:undefined as any,addEventListener:vi.fn(),removeEventListener:vi.fn()};
 const history={pushState:vi.fn(),replaceState:vi.fn()};
 document.documentElement.className='GamepadMode';document.body.innerHTML='<div class="responsive_page_template_content"><a href="https://store.steampowered.com/app/620/">Native game</a><button>Native wishlist</button></div>';
 const stop=vi.fn(),gloss=vi.fn(()=>stop);
 const install=new Function('window','document','history','location','connectFocusGloss',docScript+';return installGameHubStore;')(domWindow,document,history,{href:url},gloss);
 return {install,domWindow,history,stop,gloss};
}
it('preserves actual nodes, handlers, hrefs, and cleans styles/history hooks',()=>{const x=documentTheme(),a=document.querySelector('a')!,click=vi.fn((e:MouseEvent)=>e.preventDefault());a.onclick=click;const originalPush=x.history.pushState;x.install({enabled:true,motion:true,gloss:true},'html[data-gh-store]{color:white}');expect(document.querySelector('a')).toBe(a);a.click();expect(click).toHaveBeenCalledOnce();expect(document.querySelectorAll('#game-hub-store-theme')).toHaveLength(1);x.domWindow.__gameHubStoreAppearance.dispose();expect(x.history.pushState).toBe(originalPush);expect(document.documentElement.hasAttribute('data-gh-store')).toBe(false);expect(x.stop).toHaveBeenCalledOnce();});
it('reinstallation reuses the existing stylesheet and gloss instance',()=>{const x=documentTheme();x.install({enabled:true},'');x.install({enabled:true},'');expect(x.stop).not.toHaveBeenCalled();expect(document.querySelectorAll('#game-hub-store-theme')).toHaveLength(1);x.domWindow.__gameHubStoreAppearance.dispose();});
it.each(['https://store.steampowered.com/agecheck/app/620/','https://store.steampowered.com/login/'])('document rejects protected route %s',url=>{const x=documentTheme(url);expect(x.install({enabled:true},'').applied).toBe(false);expect(x.gloss).not.toHaveBeenCalled();});
it('SPA navigation removes presentation before the native history call',()=>{const x=documentTheme();const old=x.history.replaceState;x.install({enabled:true},'');x.history.replaceState({},'', '/checkout/');expect(x.stop).toHaveBeenCalledOnce();expect(old).toHaveBeenCalledWith({},'','/checkout/');expect(document.querySelector('#game-hub-store-theme')).toBeNull();});
it('all theme selectors are scoped and stylesheet parses',()=>{const css=readFileSync('store-theme/native.css','utf8'),el=document.createElement('style');el.textContent=css;document.head.append(el);expect(el.sheet!.cssRules.length).toBeGreaterThan(20);function check(rules:CSSRuleList){for(const rule of Array.from(rules)){if('selectorText' in rule)expect((rule as CSSStyleRule).selectorText).toMatch(/^html\[data-gh-store/);else if('cssRules' in rule)check((rule as CSSMediaRule).cssRules);}}check(el.sheet!.cssRules);el.remove();});

it('keeps normal cart cosmetic theming separate from protected checkout',()=>{expect(themedStoreURL('https://store.steampowered.com/cart/')).toBe(true);expect(themedStoreURL('https://checkout.steampowered.com/')).toBe(false);});
it('public history changes do not tear down styles or gloss',()=>{const x=documentTheme();x.install({enabled:true},'');const sheet=document.querySelector('#game-hub-store-theme');x.history.replaceState({},'', '/search/');expect(x.stop).not.toHaveBeenCalled();expect(document.querySelector('#game-hub-store-theme')).toBe(sheet);x.domWindow.__gameHubStoreAppearance.dispose();});
it('never overrides native media or carousel geometry',()=>{const css=readFileSync('store-theme/native.css','utf8');expect(css).not.toMatch(/(?:^|[;{])\s*(?:min-width|max-width|width|height|min-height|max-height|position|transform|inset|padding|margin|flex-basis|aspect-ratio)\s*:/m);expect(css).not.toContain('gh-store-shell');});
it('installs one activity navigation owner and disposes it when leaving the feed',()=>{
 const x=documentTheme('https://steamcommunity.com/id/example/home');document.querySelector('.responsive_page_template_content')!.classList.add('blotter_block');
 const stopNavigation=vi.fn(),connectNavigation=vi.fn(()=>stopNavigation);
 const install=new Function('window','document','history','location','connectFocusGloss','connectActivityNavigation',docScript+';return installGameHubStore;')(x.domWindow,document,x.history,{href:'https://steamcommunity.com/id/example/home'},x.gloss,connectNavigation);
 install({enabled:true},'');install({enabled:true},'');expect(connectNavigation).toHaveBeenCalledOnce();x.history.pushState({},'', 'https://steamcommunity.com/login');expect(stopNavigation).toHaveBeenCalledOnce();
});

it('applies the independent profile preference without enabling Store styling',()=>{
 const x=setup();x.browser.URL=x.browser.DisplayURL='https://steamcommunity.com/id/example';x.set({storeAppearance:false,profileAppearance:true});x.load();expect(x.apply).toHaveBeenLastCalledWith(x.browser.URL,expect.objectContaining({enabled:true}));
 x.set({profileAppearance:false});expect(x.apply).toHaveBeenLastCalledWith('',expect.objectContaining({enabled:false}));
});
it('profile route remains limited to overview and safe query keys',()=>{
 expect(themedStoreURL('https://steamcommunity.com/profiles/76561190000000000?insideModal=0')).toBe(true);
 for(const u of ['https://steamcommunity.com/id/example/edit','https://steamcommunity.com/id/example/inventory/','https://steamcommunity.com/id/example?token=secret'])expect(themedStoreURL(u)).toBe(false);
});
it('keeps the profile theme across hash tabs and hidden-browser returns, but honors disable',()=>{const x=setup();x.browser.URL=x.browser.DisplayURL='https://steamcommunity.com/id/example';x.load();x.apply.mockClear();x.browser.URL=x.browser.DisplayURL+='\u0023ghp-games';x.emit('history-changed');expect(x.apply).toHaveBeenLastCalledWith(x.browser.URL,expect.objectContaining({enabled:true}));x.apply.mockClear();x.main.LocationPathName='/library/home';x.route();expect(x.apply).not.toHaveBeenCalled();x.set({profileAppearance:false});expect(x.apply).toHaveBeenLastCalledWith('',expect.objectContaining({enabled:false}));});
it('accepts Steam’s provisional nonsecure notification followed by a verified certificate',()=>{const x=setup();x.browser.URL=x.browser.DisplayURL='https://steamcommunity.com/id/example';x.emit('start-request',x.browser.URL);x.emit('page-security',x.browser.URL,{bIsSecure:false,bHasCertError:false});x.emit('page-security',x.browser.URL,{bIsSecure:true,bHasCertError:false});x.emit('finished-request');expect(x.apply).toHaveBeenLastCalledWith(x.browser.URL,expect.objectContaining({enabled:true}));});
it('ignores a late appearance reply from before a new document navigation',async()=>{
 const x=setup();let resolve!:(v:StoreResult)=>void;x.browser.URL=x.browser.DisplayURL='https://steamcommunity.com/id/example';x.apply.mockImplementation(()=>new Promise(r=>{resolve=r;}));x.load();x.report.mockClear();x.emit('start-request',x.browser.URL);resolve({applied:true,reason:'old document'});await Promise.resolve();expect(x.report).not.toHaveBeenCalled();
});

it('retries a not-yet-created profile renderer and stops after readiness',async()=>{
 vi.useFakeTimers();const x=setup();x.browser.URL=x.browser.DisplayURL='https://steamcommunity.com/id/example';
 x.apply.mockResolvedValueOnce({applied:false,reason:'Renderer not ready'});x.load();await Promise.resolve();
 await vi.advanceTimersByTimeAsync(260);expect(x.apply).toHaveBeenCalledTimes(2);expect(x.report).toHaveBeenLastCalledWith(expect.objectContaining({applied:true}),x.browser.URL);
 await vi.advanceTimersByTimeAsync(10000);expect(x.apply).toHaveBeenCalledTimes(2);
});
it('cancels retries when the user leaves the profile',async()=>{
 vi.useFakeTimers();const x=setup();x.browser.URL=x.browser.DisplayURL='https://steamcommunity.com/id/example';x.apply.mockResolvedValue({applied:false,reason:'Not ready'});x.load();await Promise.resolve();
 x.main.LocationPathName='/library';x.route();await vi.advanceTimersByTimeAsync(3000);expect(x.apply).toHaveBeenCalledTimes(1);
});
