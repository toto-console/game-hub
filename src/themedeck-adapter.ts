import {useEffect,useLayoutEffect,useRef} from 'react';
import {decky} from './decky-adapter';
import {createSoundtrackCoordinator,soundtrackDefaults,themeIdentity,type MusicContext,type SoundtrackPreferences,type SoundtrackBridge} from './soundtrack-coordinator';
const KEY='game-hub.soundtracks.v1';
export const SOUNDTRACK_EVENT='game-hub:soundtrack-preferences';
export function soundtrackPreferences():SoundtrackPreferences {try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}');return {...soundtrackDefaults,...Object.fromEntries(['enabled','highlight','library','smooth'].filter(k=>typeof raw[k]==='boolean').map(k=>[k,raw[k]])),disabledGames:Array.isArray(raw.disabledGames)?raw.disabledGames.filter((id:unknown)=>themeIdentity(id)!==null):[]};}catch{return {...soundtrackDefaults,disabledGames:[]};}}
export function saveSoundtrackPreferences(next:SoundtrackPreferences){localStorage.setItem(KEY,JSON.stringify(next));window.dispatchEvent(new Event(SOUNDTRACK_EVENT));}
export function themeDeckStatus(){
 const d=decky(),p=d?.plugins.find(p=>p.name==='ThemeDeck');const installed=d?.deckyState.publicState().installedPlugins.find(p=>p.name==='ThemeDeck');
 const windows=/Win/i.test(navigator.platform||navigator.userAgent);
 const loaded=!!p&&typeof p.onDismount==='function'&&!d?.deckyState.publicState().disabledPlugins.some(p=>p.name==='ThemeDeck');
 const bridge=(window as any).__gameHubThemeDeckV1 as SoundtrackBridge|undefined;
 const compatible=windows&&loaded&&p?.version==='3.3.7'&&bridge?.apiVersion===1&&bridge.pluginVersion==='3.3.7'&&bridge.platform==='windows';
 return {installed:!!installed||!!p,loaded,version:p?.version??installed?.version,windows,bridge:compatible?bridge:undefined,reason:soundtrackCoordinator?.error||(!installed&&!p?'ThemeDeck is not installed.':!loaded?'Enable ThemeDeck in Decky to use game soundtracks.':!windows?'This Game Hub adapter has not been validated with Linux ThemeDeck.':p?.version!=='3.3.7'?'This ThemeDeck version needs a reviewed adapter.':!compatible?'ThemeDeck 3.3.7 needs the supplied Game Hub compatibility bridge.':'ThemeDeck 3.3.7 · Game Hub bridge ready')};
}
export let soundtrackCoordinator=createSoundtrackCoordinator(()=>themeDeckStatus().bridge,soundtrackPreferences);
export function startSoundtracks(){soundtrackCoordinator=createSoundtrackCoordinator(()=>themeDeckStatus().bridge,soundtrackPreferences);const refresh=()=>soundtrackCoordinator.refresh();const timer=setInterval(refresh,1000);window.addEventListener(SOUNDTRACK_EVENT,refresh);return()=>{clearInterval(timer);window.removeEventListener(SOUNDTRACK_EVENT,refresh);soundtrackCoordinator.dispose();};}
export function useSoundtrackScope(kind:MusicContext,active:boolean,id?:number){const scope=useRef<ReturnType<typeof soundtrackCoordinator.mount>|undefined>(undefined);useLayoutEffect(()=>{if(!active)return;scope.current=soundtrackCoordinator.mount(kind,id??null);return()=>{scope.current?.dispose();scope.current=undefined;};},[kind,active]);useLayoutEffect(()=>{scope.current?.select(id??null);},[id]);}
export const highlightSoundtrack=(id:number|null,kind:MusicContext)=>soundtrackCoordinator.highlight(kind,id);
export function stopSoundtrackForLaunch(){try{themeDeckStatus().bridge?.beforeLaunch();}catch{/* Audio integration must never block Steam launch. */}}
const methods=new Set(['get_track','set_volume','set_loop','remove_track']);
export async function themeDeckCall(method:string,...args:unknown[]){if(!themeDeckStatus().loaded||themeDeckStatus().version!=='3.3.7'||!methods.has(method))throw Error('Supported ThemeDeck controls are unavailable.');const backend=(window as any).DeckyBackend;if(!backend?.call)throw Error('Decky connection unavailable.');const result=await backend.call('loader/call_plugin_method','ThemeDeck',method,...args);if(method!=='get_track')window.dispatchEvent(new Event('themedeck:tracks-updated'));return result;}
