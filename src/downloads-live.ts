import {useEffect,useSyncExternalStore} from 'react';
import {readDownloads,type DownloadHost,type DownloadSnapshot} from './downloads';
/** A single Steam subscription and fallback clock, retained only by mounted consumers. */
export function createDownloadSource(host:()=>DownloadHost){
 let snapshot:DownloadSnapshot={ready:false,overviewReady:false,rows:[]},signature='',timer:ReturnType<typeof setInterval>|undefined,store:DownloadHost['downloadsStore'],subscription:{Unregister():void}|undefined;
 const listeners=new Set<()=>void>(),ticks=new Set<()=>void>();
 const refresh=()=>{
  const h=host();if(store!==h.downloadsStore){subscription?.Unregister();store=h.downloadsStore;try{subscription=store?.RegisterForDownloadItemsUpdate?.(refresh);}catch{subscription=undefined;}}
  const next=readDownloads(h),key=JSON.stringify(next);
  if(key!==signature){const previous=new Map(snapshot.rows.map(r=>[r.id,r]));next.rows=next.rows.map(r=>{const old=previous.get(r.id);return old&&JSON.stringify(old)===JSON.stringify(r)?old:r;});signature=key;snapshot=next;listeners.forEach(f=>f());}
  ticks.forEach(f=>f());
 };
 const retain=(set:Set<()=>void>,fn:()=>void)=>{set.add(fn);if(!timer){timer=setInterval(refresh,1000);refresh();}return()=>{set.delete(fn);if(!listeners.size&&!ticks.size){clearInterval(timer);timer=undefined;subscription?.Unregister();subscription=undefined;store=undefined;}};};
 return {refresh,getSnapshot:()=>snapshot,subscribe:(fn:()=>void)=>retain(listeners,fn),tick:(fn:()=>void)=>retain(ticks,fn)};
}
export const downloadSource=createDownloadSource(()=>window as unknown as DownloadHost);
const inactive=()=>()=>{};
export function useDownloadsSnapshot(active=true){return useSyncExternalStore(active?downloadSource.subscribe:inactive,downloadSource.getSnapshot);}
export function useDownloadTick(fn:()=>void,deps:unknown[]){useEffect(()=>{const stop=downloadSource.tick(fn);fn();return stop;},deps);}
