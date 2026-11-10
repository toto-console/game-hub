import {useEffect,useState} from 'react';
import {decky} from './decky-adapter';
// Dedicated shortcut descriptors, not a promise that arbitrary plugins can embed.
export const pluginShortcuts=[{id:'now-playing',plugin:'Now Playing',version:'2.5.2',label:'Music',view:'music'}] as const;
type Player={id:string;name:string;title:string;artist:string;album:string;status:string;position:number;length:number;canPlay:boolean;canPause:boolean;canTogglePlayPause:boolean;canNext:boolean;canPrevious:boolean;canShuffle:boolean;canRepeat:boolean;shuffleActive:boolean;repeatMode:string};
export type MusicState={player?:Player;source?:string;volume?:number;art?:string;error?:string};
type Backend={call:(route:string,plugin:string,method:string,...args:unknown[])=>Promise<any>};
export function musicAvailable(){const d=decky(),s=d?.deckyState.publicState(),p=d?.plugins.find(p=>p.name==='Now Playing');return !!p&&p.version==='2.5.2'&&typeof p.onDismount==='function'&&!s?.disabledPlugins.some(p=>p.name==='Now Playing');}
export async function musicCall(method:string,...args:unknown[]){
 if(!musicAvailable())throw Error('Now Playing 2.5.2 is unavailable or has changed. Open its native menu to check compatibility.');
 const backend=(window as unknown as {DeckyBackend?:Backend}).DeckyBackend;
 if(!backend?.call)throw Error('This Decky version does not expose the reviewed playback bridge.');
 return backend.call('loader/call_plugin_method','Now Playing',method,...args);
}
export function allowed(p:Player|undefined,method:string){if(!p)return false;return method==='play_pause'?(p.canTogglePlayPause||(/playing/i.test(p.status)?p.canPause:p.canPlay)):method==='next'?p.canNext:method==='previous'?p.canPrevious:method==='shuffle'?p.canShuffle:method==='repeat'?p.canRepeat:false;}
export async function musicCommand(method:string){const s=await musicCall('get_snapshot');if(!allowed(s.selected,method))throw Error('This media session does not support that control.');const result=await musicCall(method);if(![true,'true','ok','started'].includes(result))throw Error('The player did not confirm the request.');}
export const musicSources:Record<string,string>={soundCloud:'SoundCloud',spotify:'Spotify',youtubeMusic:'YouTube Music',localMusic:'Local music',tidal:'Tidal',appleMusic:'Apple Music',deezer:'Deezer',amazonMusic:'Amazon Music'};
const covers=new Map<string,string>();
export function useMusic(active:boolean){
 const [state,setState]=useState<MusicState>({});
 useEffect(()=>{if(!active)return;let dead=false,timer:ReturnType<typeof setTimeout>;
 const read=async()=>{try{const [snapshot,source,volume]=await Promise.all([musicCall('get_snapshot'),musicCall('get_active_service'),musicCall('get_app_volume')]);const p=snapshot.selected as Player|undefined;let art:string|undefined;
 const next={player:p,source,volume:volume?.ok&&volume.origin!=='saved'&&Number.isFinite(volume.volume)?volume.volume:undefined};if(!dead)setState({...next,art:p?.title?covers.get(JSON.stringify([source,p.title,p.artist,p.album])):undefined});
 if(p?.title){const key=JSON.stringify([source,p.title,p.artist,p.album]);if(!covers.has(key)){const value=await musicCall('get_cover_for_service',source,p.title,p.artist,p.album).catch(()=>'');if(covers.size>=24)covers.delete(covers.keys().next().value!);covers.set(key,typeof value==='string'&&/^(https?:\/\/|data:image\/)/i.test(value)?value:'');}art=covers.get(key);}
 if(!dead)setState({...next,art});
 }catch(e){if(!dead)setState({error:e instanceof Error?e.message:'Music connection unavailable.'});}finally{if(!dead)timer=setTimeout(read,2000);}};
 void read();return()=>{dead=true;clearTimeout(timer);};
 },[active]);return state;
}
