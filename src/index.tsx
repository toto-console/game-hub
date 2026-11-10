import {startNavigationAudio} from './native-navigation-audio';
import {startUpdateChecks} from './software-updates';
import {connectWelcome} from './home/welcome-services';
import {connectDesktopCenterFallback} from './desktop-center-fallback';
import {openMediaManager} from './MediaManager';
import {connectStoreAppearance,type StoreOptions,type StoreResult} from './store-appearance';
import {connectFullscreenWeb,openGameHubWeb,restoreOriginalWeb,setWebOwnerResolver,type WebWindow} from './fullscreen-web';
import {exitGameAndConfirm} from './game-exit';
import {GAME_HUB_LIBRARY} from './home/native-library';
import {connectFocusGloss} from './focus-gloss';
import {startSoundtracks} from './themedeck-adapter';
import {GameMusicRoute,GAME_MUSIC_ROUTE,openGameMusic} from './GameMusicSettings';
import {startHomeModule,HomePreferences} from './home/module';
import {connectHomeFocus} from './home-focus';
import {bindWhenReady} from './startup-ready';
import {connectProfileReturn} from './profile-return';
import {createPlayerSearch} from './player-search';
import {fetchNoCors,callable} from '@decky/api';
import {createFriendManagement} from './friend-management';
import {createNotificationStore} from './notification-store';
import {ControlCenter,type CenterActions} from './ControlCenter';
import {createControlCenter} from './control-center-entry';
import {type HubTab} from './Panel';
import { definePlugin, routerHook } from '@decky/api';

import { DialogButton, SliderField, Focusable, Navigation, Router, TextField, ScrollPanel, classMap, replacePatch, callOriginal, EUIComposition } from '@decky/ui';

import { useState, useEffect, useLayoutEffect, useRef, useSyncExternalStore, type ComponentType, type ComponentProps, type RefAttributes } from 'react';

import {createPlayerActions} from './player-actions';
import {createSteamGroupAdapter} from './groups';
import {createSteamVoiceAdapter} from './voice';
import {createMessagesBridge} from './messages';

import {fullscreenCSS,controlCenterHeaders} from './fullscreen';

import { Panel, type Controls, type ButtonProps, type HistoryProps } from './Panel';

import { readSteamFriends, type SocialBridge } from './model';

import { defaults, loadSettings, saveSettings, type Settings } from './settings';

import { css } from './styles';

import {connectSocialEntry,HUB_ROUTE,type EntryAdapter} from './social-entry';



const ROUTE=HUB_ROUTE;

function DeckyButton({children,className,...props}:ButtonProps){

  const [focused,setFocused]=useState(false);

  return <DialogButton data-gh-control="" {...props} className={`${className ?? ''}${focused?' gbs-focus':''}`} onGamepadFocus={()=>setFocused(true)} onGamepadBlur={()=>setFocused(false)}>{children}</DialogButton>;

}

type NativeKeyboard={IsShowingVirtualKeyboard?:{Value:boolean;Subscribe:(fn:(open:boolean)=>void)=>{Unsubscribe:()=>void}};SetVirtualKeyboardHidden?:()=>void};
const keyboardManager=()=>(Router?.WindowStore?.GamepadUIMainWindowInstance as unknown as {VirtualKeyboardManager?:NativeKeyboard})?.VirtualKeyboardManager;
// Verified in installed steamui/sp.js: a falsy onEnterKeyPress return consumes
// virtual Enter before DispatchKeypress; TextField forwards this to its input.
const KeyboardTextField=TextField as ComponentType<ComponentProps<typeof TextField>&{onEnterKeyPress?:()=>null;strEnterKeyLabel?:string}>;
// Steam ScrollPanel forwards focus registration and supplies its scroll context.
const HistoryPanel=(ScrollPanel??Focusable) as ComponentType<Omit<HistoryProps,'historyRef'>&RefAttributes<HTMLDivElement>&{focusable:boolean;scrollDirection:string;noFocusRing:boolean}>;
const MessageTarget=Focusable as ComponentType<import('react').HTMLAttributes<HTMLDivElement>&{focusable:boolean;noFocusRing:boolean;focusClassName:string}>;
const controls:Controls={
  Message:props=><MessageTarget data-gh-control="" {...props} focusable tabIndex={0} noFocusRing focusClassName="gbs-message-focus"/>,
  History:({historyRef,...props})=><HistoryPanel {...props} ref={historyRef} focusable={false} noFocusRing scrollDirection="y"/>,
  Slider:({label,value,max,onChange})=><SliderField label={label} value={value} min={0} max={max} step={5} minimumDpadGranularity={5} showValue valueSuffix="%" onChange={onChange}/>,
  keyboard:{visible:()=>!!keyboardManager()?.IsShowingVirtualKeyboard?.Value,hide:()=>keyboardManager()?.SetVirtualKeyboardHidden?.(),subscribe:fn=>{const sub=keyboardManager()?.IsShowingVirtualKeyboard?.Subscribe?.(fn);return()=>sub?.Unsubscribe?.();}},

  Input:({value,onChange,onConfirm,label,placeholder,disabled})=><div className="gbs-text-field"><KeyboardTextField onEnterKeyPress={onConfirm?()=>{onConfirm();return null;}:undefined} strEnterKeyLabel={onConfirm?'Done':undefined} value={value} onChange={e=>onChange(e.target.value)} aria-label={label} title={placeholder} disabled={disabled} bShowClearAction={false}/></div>,

  Button:DeckyButton,

  Group:({children,onBack,horizontal,...props})=><Focusable {...props} flow-children={horizontal?'row':'column'} onCancel={onBack?e=>{e.stopPropagation();onBack();}:undefined}>{children}</Focusable>

};

const voiceAdapter=createSteamVoiceAdapter(window);
const baseBridge:SocialBridge={
  playerSearch:createPlayerSearch(fetchNoCors),
  friendManagement:createFriendManagement(window),
  searchPlayersNative:query=>{openGameHubWeb('https://steamcommunity.com/search/users/#text='+encodeURIComponent(query.trim()),url=>Navigation.NavigateToSteamWeb(url));Navigation.CloseSideMenus?.();},

  playerActions:createPlayerActions(window),
  openFriendChat:(id)=>{if(!/^7656119\d{10}$/.test(id))throw Error('Invalid Steam friend.');const a=(window as unknown as {g_FriendsUIApp?:{GetDefaultBrowserContext():unknown;ShowFriendChatDialog(context:unknown,id:number,activate:boolean):unknown}}).g_FriendsUIApp;if(typeof a?.ShowFriendChatDialog!=='function')throw Error('Native friend chat is unavailable. Open Steam Friends & Chat.');a.ShowFriendChatDialog(a.GetDefaultBrowserContext(),Number(BigInt(id)-76561197960265728n),true);},

  messages:createMessagesBridge(window),
  voice:voiceAdapter,
  groups:createSteamGroupAdapter(window,voiceAdapter),
  openVoiceSettings:()=>{const client=(window as unknown as {SteamClient?:{URL?:{ExecuteSteamURL?:(url:string)=>void}}}).SteamClient;if(!client?.URL?.ExecuteSteamURL)throw Error('Open Steam Friends & Chat to access voice settings.');client.URL.ExecuteSteamURL('steam://open/settings/voice');},

  readFriends:()=>readSteamFriends(window),

  openNative:()=>{if(typeof Navigation?.NavigateToChat!=='function')throw new Error('Navigation unavailable');Navigation.NavigateToChat();Navigation.CloseSideMenus?.();},

  openProfile:(id)=>{if(!/^7656119\d{10}$/.test(id)||typeof Navigation?.NavigateToSteamWeb!=='function')throw new Error('Profile navigation unavailable');openGameHubWeb(`https://steamcommunity.com/profiles/${id}`,url=>Navigation.NavigateToSteamWeb(url));Navigation.CloseSideMenus?.();}

};

export default definePlugin(()=>{

  const stopAudio=startNavigationAudio();const stopUpdates=startUpdateChecks();
  const stopHome=startHomeModule();
  const stopSoundtracks=startSoundtracks();
  routerHook.addRoute(GAME_MUSIC_ROUTE,GameMusicRoute,{exact:true});
  routerHook.addRoute(GAME_MUSIC_ROUTE+"/:appid",GameMusicRoute,{exact:true});
  let storage:Storage|undefined;

  try {storage=window.localStorage;} catch { /* Preferences can remain session-only. */ }

  let settings=loadSettings(storage);
  const stopWebOwner=setWebOwnerResolver(()=>Router.WindowStore?.GamepadUIMainWindowInstance);
  const storeApply=callable<[url:string,options:StoreOptions],StoreResult>('store_appearance');
  let storeStatus:StoreResult={applied:false,reason:'Open the Store to apply its appearance.'};
  const storeAdapters=new Set<ReturnType<typeof connectStoreAppearance>>();
  const webAdapters=new Set<ReturnType<typeof connectFullscreenWeb>>();

  let entry:EntryAdapter|undefined;

  let registered=false;
  let globalRegistered=false;
  let entryRequest:{tab:HubTab;serial:number;conversation?:string;friend?:string}={tab:'Friends',serial:0};
  const requestListeners=new Set<()=>void>();
  const requestSubscribe=(fn:()=>void)=>{requestListeners.add(fn);return()=>{requestListeners.delete(fn);};};
  const requestSnapshot=()=>entryRequest;
  let center=createControlCenter(Router?.WindowStore?.GamepadUIMainWindowInstance,replacePatch,callOriginal,()=>registered&&settings.enabled&&settings.controlCenter,controlCenterHeaders(classMap));

  let profileReturn=connectProfileReturn(Router?.WindowStore?.GamepadUIMainWindowInstance,()=>{center.show();},()=>center.getSnapshot(),()=>{try{return baseBridge.friendManagement?.account();}catch{return undefined;}});
  let mainOwner=Router?.WindowStore?.GamepadUIMainWindowInstance;
  // Steam can load plugins before creating its main window. Bind from Decky's
  // mounted window component, not a timer or a controller-global listener.
  const attachMain=()=>{
    const instance=Router?.WindowStore?.GamepadUIMainWindowInstance;
    if(!instance||instance===mainOwner)return;
    profileReturn.dispose();center.dispose();mainOwner=instance;
    center=createControlCenter(instance,replacePatch,callOriginal,()=>registered&&settings.enabled&&settings.controlCenter,controlCenterHeaders(classMap));
    profileReturn=connectProfileReturn(instance,()=>{center.show();},()=>center.getSnapshot(),()=>{try{return baseBridge.friendManagement?.account();}catch{return undefined;}});
    connectEntry();
  };
  let saveFailed=false;

  const listeners=new Set<()=>void>();

  const subscribe=(fn:()=>void)=>{listeners.add(fn);return ()=>{listeners.delete(fn);};};

  const getSnapshot=()=>settings;

  const connectEntry=()=>{

    entry?.dispose();entry=undefined;

    if(!registered||!settings.enabled||!settings.friendsEntry)return;

    try {entry=connectSocialEntry(Router?.WindowStore?.GamepadUIMainWindowInstance,replacePatch,callOriginal,()=>settings.enabled&&settings.friendsEntry);}catch{/* Existing native entry remains intact. */}

  };

  const setSettings=(next:Settings)=>{const reconnect=next.enabled!==settings.enabled||next.friendsEntry!==settings.friendsEntry;settings=next;if(!next.enabled||!next.controlCenter){center.close();for(const ctx of overlayContexts.values())ctx.store.close();}saveFailed=!saveSettings(next,storage);for(const adapter of webAdapters)adapter.refresh();for(const adapter of storeAdapters)adapter.refresh();if(reconnect)connectEntry();listeners.forEach(fn=>fn());};

  const bridge:SocialBridge={...baseBridge,openProfile:id=>{profileReturn.begin();try{baseBridge.openProfile(id);}catch(e){profileReturn.cancel();throw e;}},openNative:()=>{if(entry?.connected)entry.openNative();else baseBridge.openNative();}};

  const notifications=createNotificationStore(bridge,()=>settings);
  const back=()=>Navigation.NavigateBack?.();

  function Room(){const s=useSyncExternalStore(subscribe,getSnapshot,getSnapshot);const request=useSyncExternalStore(requestSubscribe,requestSnapshot,requestSnapshot);return <><style>{fullscreenCSS(classMap)}</style><Panel controls={controls} bridge={bridge} settings={s} setSettings={setSettings} onBack={back} initialTab={request.tab} entryRequest={request}/>{saveFailed&&<div className="gbs-root"><p role="status" className="gbs-error">Preferences apply for this session; storage is unavailable.</p></div>}</>;}

  try {if(typeof routerHook?.addRoute==='function'){routerHook.addRoute(ROUTE,Room,{exact:true});registered=true;}} catch {/* Quick Access remains available. */}

  connectEntry();
  const homeFocus=new Map<Document,ReturnType<typeof connectHomeFocus>>();
  const goHome=(instance:any,navigate:()=>void)=>{const helper=homeFocus.get(instance?.BrowserWindow?.document);if(helper)helper.navigate(navigate);else navigate();};
  const actions:CenterActions={
    hub:(tab,conversation,friend)=>{if(!registered)throw Error('Game Hub route is unavailable.');entryRequest={tab,conversation,friend,serial:entryRequest.serial+1};requestListeners.forEach(fn=>fn());const main=Router.WindowStore?.GamepadUIMainWindowInstance as unknown as {LocationPathName?:string};if(main?.LocationPathName!==ROUTE)Navigation.Navigate(ROUTE);},
    home:()=>goHome(Router.WindowStore?.GamepadUIMainWindowInstance,()=>Navigation.Navigate('/library/home')),games:()=>Navigation.Navigate(GAME_HUB_LIBRARY),
    notifications:()=>Navigation.OpenQuickAccessMenu(0),downloads:()=>Navigation.Navigate('/library/downloads'),
    sound:()=>Navigation.Navigate('/settings/audio'),accessories:()=>Navigation.Navigate('/settings/controller/menu/0'),
    web:url=>{const main=Router.WindowStore?.GamepadUIMainWindowInstance;openGameHubWeb(url,u=>main?.NavigateToSteamWeb(u),main);},
    library:id=>Navigation.Navigate(id?`/library/app/${id}`:GAME_HUB_LIBRARY),
    profile:async()=>{
      const client=(window as unknown as {SteamClient?:{URL?:{GetSteamURLList?:(keys:string[])=>Promise<Record<string,{url:string}>>}}}).SteamClient;
      const main=Router.WindowStore?.GamepadUIMainWindowInstance as unknown as {NavigateToSteamWeb?:(url:string)=>void};
      if(!client?.URL?.GetSteamURLList||typeof main?.NavigateToSteamWeb!=='function')throw Error('Your Steam profile is unavailable. Use Steam View Profile.');
      const url=(await client.URL.GetSteamURLList(['SteamIDMyProfile'])).SteamIDMyProfile?.url;
      if(!url||new URL(url).origin!=='https://steamcommunity.com')throw Error('Steam did not provide your profile. Use Steam View Profile.');
      return ()=>openGameHubWeb(url,u=>main.NavigateToSteamWeb!(u),main);
    },
    steamSettings:()=>Navigation.Navigate('/settings'),notificationSettings:()=>Navigation.Navigate('/settings/notifications'),voiceSettings:()=>baseBridge.openVoiceSettings?.(),
    deckyPage:page=>Navigation.Navigate(page==='store'?'/decky/store':'/decky/settings'),power:(anchor,onCancel)=>(Router.OpenPowerMenu as (anchor:HTMLElement,onCancel:()=>void)=>void)(anchor,onCancel),decky:()=>Navigation.OpenQuickAccessMenu(999)
  };
  const stopWelcome=connectWelcome(bridge,actions);
  // Decky mounts this shared component in each Steam GamepadUI window. Resolve
  // the owner from the DOM marker; never assume the desktop main window owns input.
  type OverlayWindow=NonNullable<typeof Router.WindowStore>['SteamUIWindows'][number]&{
    IsGamepadUIOverlayWindow?:()=>boolean;IsAnyVRWindow?:()=>boolean;
    VirtualKeyboardManager?:NativeKeyboard;LocationPathName:string;
  };
  const overlayContexts=new Map<OverlayWindow,ReturnType<typeof createOverlayContext>>();
  const closeForMusic=()=>{center.close(false);for(const ctx of overlayContexts.values())ctx.store.close(false);};
  window.addEventListener("game-hub:open-music",closeForMusic);
  function createOverlayContext(instance:OverlayWindow){
    const api=(window as unknown as {SteamClient?:{Overlay?:{RegisterForOverlayActivated?:(fn:(pid:number,app:number,active:boolean,userInitiated:boolean)=>void)=>{unregister:()=>void}}}}).SteamClient?.Overlay;
    const store=createControlCenter(instance,replacePatch,callOriginal,()=>registered&&settings.enabled&&settings.controlCenter,controlCenterHeaders(classMap),api?.RegisterForOverlayActivated?{
      mode:EUIComposition.Overlay,subscribe:fn=>{const h=api.RegisterForOverlayActivated!(fn);return()=>h.unregister();}
    }:undefined);
    const returning=connectProfileReturn(instance,()=>{store.show();},()=>store.getSnapshot(),()=>{try{return baseBridge.friendManagement?.account();}catch{return undefined;}});
    const localControls:Controls={...controls,keyboard:{
      visible:()=>!!instance.VirtualKeyboardManager?.IsShowingVirtualKeyboard?.Value,
      hide:()=>instance.VirtualKeyboardManager?.SetVirtualKeyboardHidden?.(),
      subscribe:fn=>{const sub=instance.VirtualKeyboardManager?.IsShowingVirtualKeyboard?.Subscribe(fn);return()=>sub?.Unsubscribe();}
    }};
    const localBridge:SocialBridge={...baseBridge,
      openProfile:id=>{if(!/^7656119\d{10}$/.test(id))throw Error('Invalid Steam profile.');returning.begin();try{openGameHubWeb(`https://steamcommunity.com/profiles/${id}`,url=>instance.NavigateToSteamWeb(url),instance);}catch(e){returning.cancel();throw e;}},
      searchPlayersNative:query=>openGameHubWeb('https://steamcommunity.com/search/users/#text='+encodeURIComponent(query.trim()),url=>instance.NavigateToSteamWeb(url),instance),
      openNative:()=>instance.Navigate('/chat')
    };
    const navigate=(path:string)=>instance.Navigate(path);
    const exitGame=async()=>{
      await exitGameAndConfirm(Router,(window as any).SteamClient,store.currentAppId,id=>(window as any).appStore?.GetAppOverviewByAppID(id));
      store.close(false);
    };
    const localActions:CenterActions={...actions,exitGame,
      home:()=>goHome(instance,()=>navigate('/library/home')),games:()=>navigate(GAME_HUB_LIBRARY),
      hub:()=>{throw Error('Use the in-overlay Game Hub panel.');},
      notifications:()=>instance.MenuStore.OpenQuickAccessMenu(0),downloads:()=>navigate('/library/downloads'),
      sound:()=>navigate('/settings/audio'),accessories:()=>navigate('/settings/controller/menu/0'),
      steamSettings:()=>navigate('/settings'),notificationSettings:()=>navigate('/settings/notifications'),
      decky:()=>instance.MenuStore.OpenQuickAccessMenu(999),deckyPage:page=>navigate(page==='store'?'/decky/store':'/decky/settings'),
      web:url=>openGameHubWeb(url,u=>instance.NavigateToSteamWeb(u),instance),library:id=>navigate(id?`/library/app/${id}`:GAME_HUB_LIBRARY),
      profile:async()=>{const client=(window as any).SteamClient;const url=(await client.URL.GetSteamURLList(['SteamIDMyProfile'])).SteamIDMyProfile?.url;if(!url||new URL(url).origin!=='https://steamcommunity.com')throw Error('Steam profile unavailable.');return()=>openGameHubWeb(url,u=>instance.NavigateToSteamWeb(u),instance);}
    };
    return {store,controls:localControls,bridge:localBridge,actions:localActions,beforeProfile:returning.begin,dispose(){returning.dispose();store.dispose();}};
  }
  function GlobalCenter(){
    const s=useSyncExternalStore(subscribe,getSnapshot,getSnapshot),marker=useRef<HTMLSpanElement>(null);
    const [context,setContext]=useState<ReturnType<typeof createOverlayContext>|'main'>();
    useEffect(()=>{
      if(context!=='main')return;
      const view=marker.current?.ownerDocument.defaultView;
      if(!view)return;
      return connectDesktopCenterFallback(view,{
        enabled:()=>registered&&settings.enabled&&settings.controlCenter,
        running:()=>Router.RunningApps??[],
        isShortcut:id=>(window as any).appStore?.GetAppOverviewByAppID(id)?.app_type===1073741824,
        overlays:()=>{const api=(window as any).SteamClient?.Overlay;if(!api?.GetOverlayBrowserInfo)return Promise.reject(Error('Overlay detection unavailable'));return api.GetOverlayBrowserInfo();},
        open:()=>center.showDesktopFallback(),isOpen:()=>center.getSnapshot()
      });
    },[context]);
    useLayoutEffect(()=>{const doc=marker.current?.ownerDocument;if(doc)return connectFocusGloss(doc,()=>settings.enabled&&settings.motion);},[s.motion,s.enabled]);
    useLayoutEffect(()=>bindWhenReady(()=>{const doc=marker.current?.ownerDocument;return Router.WindowStore?.SteamUIWindows.find(w=>w.BrowserWindow?.document===doc) as OverlayWindow|undefined;},instance=>{
      if(instance&&instance===Router.WindowStore?.GamepadUIMainWindowInstance){attachMain();setContext('main');return;}
      if(!instance?.IsGamepadUIOverlayWindow?.()||instance.IsAnyVRWindow?.())return;
      const ctx=createOverlayContext(instance);overlayContexts.set(instance,ctx);setContext(ctx);
      return()=>{overlayContexts.delete(instance);ctx.dispose();};
    }),[]);
    useLayoutEffect(()=>bindWhenReady(()=>{const doc=marker.current?.ownerDocument;return Router.WindowStore?.SteamUIWindows.find(w=>w.BrowserWindow?.document===doc);},instance=>{const doc=instance.BrowserWindow.document;const helper=connectHomeFocus(instance as any,()=>settings.enabled&&settings.controlCenter,()=>settings.motion);homeFocus.set(doc,helper);return()=>{homeFocus.delete(doc);helper.dispose();};}),[]);
    useLayoutEffect(()=>{const doc=marker.current?.ownerDocument;if(doc)homeFocus.get(doc)?.refresh();},[s]);
    useLayoutEffect(()=>bindWhenReady(()=>{const doc=marker.current?.ownerDocument;return Router.WindowStore?.SteamUIWindows.find(w=>w.BrowserWindow?.document===doc);},instance=>{if(instance!==Router.WindowStore?.GamepadUIMainWindowInstance)return;const adapter=connectFullscreenWeb(instance as unknown as WebWindow,()=>settings.enabled&&settings.fullscreenWeb,replacePatch,callOriginal,classMap);webAdapters.add(adapter);const store=connectStoreAppearance(instance as unknown as WebWindow,()=>settings,storeApply,replacePatch,callOriginal,result=>{storeStatus=result;listeners.forEach(fn=>fn());});storeAdapters.add(store);return()=>{store.dispose();storeAdapters.delete(store);adapter.dispose();webAdapters.delete(adapter);};}),[]);
    return <><span ref={marker} hidden/>{context&&<ControlCenter {...(context==='main'?{store:center,controls,bridge,actions,beforeProfile:profileReturn.begin}:context)} settings={s} notifications={notifications} saveSettings={setSettings}/>}</>;
  }
  try{routerHook.addGlobalComponent('GameBaseControlCenter',GlobalCenter);globalRegistered=true;}catch{/* Without a mounted component the hook always uses native Steam. */}


  function QuickAccess(){
    const owner=useRef<HTMLDivElement>(null);
    const owningCenter=()=>{const instance=Router.WindowStore?.SteamUIWindows.find(w=>w.BrowserWindow?.document===owner.current?.ownerDocument) as OverlayWindow|undefined;return instance?overlayContexts.get(instance)?.store??center:center;};

    const s=useSyncExternalStore(subscribe,getSnapshot,getSnapshot);

    const [navigationError,setNavigationError]=useState(false);
    const storeState=useSyncExternalStore(subscribe,()=>storeStatus);

    const {Button}=controls;

    return <div ref={owner} className="gbs-root gbs-compact"><style>{css}</style><div className="gbs-panel"><div className="gbs-eyebrow">Steam social</div><h2>Game Base</h2><details><summary>Home Dashboard development module</summary><HomePreferences controls={controls}/></details><p>Friends, conversations, and your next session.</p>

      {s.enabled&&registered&&<Button className="gbs-button gbs-primary" onClick={()=>{Navigation.Navigate(ROUTE);Navigation.CloseSideMenus?.();}}>Open Game Base</Button>}

      {s.enabled&&s.controlCenter&&globalRegistered&&<Button className="gbs-button" onClick={()=>{setNavigationError(false);if(!owningCenter().show())setNavigationError(true);}}>Open Control Center</Button>}
      <Button className="gbs-button" aria-pressed={s.controlCenter} onClick={()=>setSettings({...s,controlCenter:!s.controlCenter})}>Control Center replacement: {s.controlCenter?'On':'Off'}</Button>
      <details><summary>Integrations</summary><Button className="gbs-button" onClick={()=>openGameMusic()}>ThemeDeck Game Soundtracks</Button></details><details><summary>Media</summary><Button className="gbs-button" onClick={()=>{Navigation.CloseSideMenus?.();openMediaManager();}}>Manage Apps</Button></details><details><summary>Store Appearance</summary>
      {([['storeAppearance','PS5-Style Steam Store'],['storeBackgrounds','Navy Background Gradients'],['storeGloss','Animated Store Gloss'],['storeReducedMotion','Reduced Store Motion'],['storeSubtle','Subtle Store Colors']] as const).map(([key,label])=><Button key={key} className="gbs-button" aria-pressed={s[key]} onClick={()=>setSettings({...s,[key]:!s[key]})}>{label}: {s[key]?'On':'Off'}</Button>)}
      <p>Store music follows ThemeDeck's own settings. Steam controls trailer playback. Global reduced motion also applies.</p>
      <p role="status">{storeState.reason}</p>
      <Button className="gbs-button" onClick={()=>{setSettings({...s,storeAppearance:false});restoreOriginalWeb(Router.WindowStore?.GamepadUIMainWindowInstance);Navigation.NavigateToSteamWeb('https://store.steampowered.com/');Navigation.CloseSideMenus?.();}}>Open Original Steam Store</Button>
      </details>
      <Button className="gbs-button" aria-pressed={s.fullscreenWeb} onClick={()=>setSettings({...s,fullscreenWeb:!s.fullscreenWeb})}>Fullscreen Web Pages: {s.fullscreenWeb?'Enabled':'Disabled'}</Button>
      <p>Hide the Steam browser's top toolbar on compatible Game Hub pages for a cleaner console-style interface.</p>
      <Button className="gbs-button" onClick={()=>{restoreOriginalWeb(Router.WindowStore?.GamepadUIMainWindowInstance);Navigation.CloseSideMenus?.();}}>Open in Original Steam Browser</Button>
      <Button className="gbs-button" onClick={()=>{try{owningCenter().native();}catch{setNavigationError(true);}}}>Open Original Steam Menu</Button>
      {s.controlCenter&&!center.connected&&<p>Guide replacement is unavailable on this Steam build. Use Open Control Center.</p>}
      {!registered&&<p role="status">Full panel navigation is unavailable on this Decky build.</p>}

      <Button className="gbs-button" onClick={()=>{setNavigationError(false);try{bridge.openNative();}catch{setNavigationError(true);}}}>Open native chat</Button>

      {navigationError&&<p role="alert">This window cannot open Control Center right now. Use Open original Steam menu if this game does not expose a supported GamepadUI overlay.</p>}

      <Button className="gbs-button" aria-pressed={s.enabled} onClick={()=>setSettings({...s,enabled:!s.enabled})}>{s.enabled?'Disable Game Base':'Enable Game Base'}</Button>

      <Button className="gbs-button" aria-pressed={s.friendsEntry} onClick={()=>setSettings({...s,friendsEntry:!s.friendsEntry})}>Friends &amp; Chat shortcut: {s.friendsEntry?'On':'Off'}</Button>

      {s.enabled&&s.friendsEntry&&!entry?.connected&&<><p role="status">Social shortcut unavailable on this window. Use Open Game Base above.</p><Button className="gbs-button" onClick={()=>{connectEntry();setSettings({...settings});}}>Retry social shortcut</Button></>}

      <Button className="gbs-button" onClick={()=>setSettings({...defaults})}>Reset preferences</Button>

      <p className="gbs-note">{s.enabled?'Messages connect to Steam. Voice uses Steam’s controls.':'Game Base is disabled.'} If nothing opens, use Steam’s own social menu. {saveFailed?'Preferences are session-only.':''}</p></div></div>;

  }

  return {name:'Game Base Social',titleView:<span>Game Base Social</span>,content:<QuickAccess/>,icon:<span aria-hidden="true">◇</span>,onDismount(){stopAudio();stopUpdates();stopWelcome();for(const adapter of storeAdapters)adapter.dispose();storeAdapters.clear();stopWebOwner();for(const adapter of webAdapters)adapter.dispose();webAdapters.clear();window.removeEventListener("game-hub:open-music",closeForMusic);stopSoundtracks();routerHook.removeRoute(GAME_MUSIC_ROUTE);routerHook.removeRoute(GAME_MUSIC_ROUTE+"/:appid");stopHome();for(const ctx of overlayContexts.values())ctx.dispose();overlayContexts.clear();profileReturn.dispose();notifications.dispose();center.dispose();if(globalRegistered)routerHook.removeGlobalComponent('GameBaseControlCenter');entry?.dispose();requestListeners.clear();if(registered)routerHook.removeRoute(ROUTE);listeners.clear();}};

});

