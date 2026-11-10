/** Read-only access to Steam's authoritative library. No parallel ownership or membership database. */
export const SHORTCUT=1073741824;
export interface LibraryApp {
 appid:number;display_name:string;app_type:number;installed:boolean;gameid?:string;m_gameid?:string;
 visible_in_game_list?:boolean;subscribed_to?:boolean;rt_last_time_played?:number;rt_last_time_locally_played?:number;rt_last_time_played_or_installed?:number;rt_purchased_time?:number;
 minutes_playtime_forever?:number;minutes_playtime_last_two_weeks?:number;size_on_disk?:string;
 review_percentage_with_bombs?:number;metacritic_score?:number;rt_custom_image_mtime?:number;rt_store_asset_mtime?:number;
 local_per_client_data?:{installed?:boolean;display_status?:number};per_client_data?:Array<{clientid:string;installed?:boolean}>;
}
export type LibraryHost={appStore?:any;collectionStore?:any};
export function isInstalled(a:LibraryApp):boolean {
 // A complete local record wins; shortcut overviews may have an empty local record.
 const local=a.local_per_client_data?.installed??a.per_client_data?.find(c=>c.clientid==='0')?.installed;
 return typeof local==='boolean'?local:a.installed===true;
}
const list=(v:any):LibraryApp[]=>{try{return Array.from(v??[]);}catch{return [];}};
export function readLibrary(host:LibraryHost){
 const store=host.collectionStore,apps=host.appStore;
 const collection=(id:string)=>{try{return store?.GetCollection?.(id);}catch{return undefined;}};
 const hidden=new Set(list(collection('hidden')?.allApps??collection('hidden')?.visibleApps).map(a=>a.appid));
 const visible=(a:LibraryApp)=>Number.isSafeInteger(a?.appid)&&a.appid>0&&[1,2,SHORTCUT].includes(a.app_type)&&a.visible_in_game_list!==false&&!hidden.has(a.appid);
 // visibleApps is Steam's licensed/shared/shortcut collection membership, including family library entries.
 const trusted=[...list(collection('type-games')?.visibleApps),...list(collection('type-software')?.visibleApps)];
 const all=[...trusted,...list(apps?.allApps).filter(a=>a.subscribed_to===true)];
 const entries=Array.from(new Map(all.filter(visible).map(a=>[a.appid,a])).values());
 const allowed=new Set(entries.map(a=>a.appid));
 const members=(c:any)=>list(c?.visibleApps).filter(a=>allowed.has(a.appid));
 const favorites=members(collection('favorite'));
 const collections=list(store?.userCollections).filter((c:any)=>!['favorite','hidden','uncategorized'].includes(c.id)&&!String(c.id).startsWith('type-')).map((c:any)=>({id:String(c.id),name:String(c.displayName??c.id),apps:members(c)}));
 return {ready:!!apps&&!!store,entries,favorites,collections};
}
/** Steam preserves the raw last-play timestamp for shortcuts even when a metadata
 * patch makes SetLastTimePlayed treat them as zero-playtime store apps. For store
 * apps the raw field can mean installation, so never use it as play history. */
export function lastPlayed(a:LibraryApp):number {
 const time=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>0?v:0;
 return Math.max(time(a.rt_last_time_played),time(a.rt_last_time_locally_played),a.app_type===SHORTCUT?time(a.rt_last_time_played_or_installed):0);
}
export const recentLibrary=(host:LibraryHost,limit:number)=>readLibrary(host).entries.filter(a=>lastPlayed(a)>0).sort((a,b)=>lastPlayed(b)-lastPlayed(a)).slice(0,limit);
export function librarySignature(h:LibraryHost){const s=readLibrary(h);return JSON.stringify([s.ready,s.entries.map(a=>[a.appid,a.display_name,isInstalled(a),a.local_per_client_data?.display_status,lastPlayed(a),a.rt_purchased_time,a.minutes_playtime_forever,a.rt_custom_image_mtime,a.rt_store_asset_mtime]),s.favorites.map(a=>a.appid),s.collections.map(c=>[c.id,c.name,c.apps.map(a=>a.appid)])]);}
