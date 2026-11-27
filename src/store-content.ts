import {fetchNoCors} from '@decky/api';
import {httpsURL,plainText} from './game-content';
export type StoreItem={id:number;name:string;image?:string;category:'Featured'|'Coming soon';hero?:string;description?:string;release?:string};
export function parseStoreItems(featured:any,categories:any):StoreItem[]{
 const seen=new Set<number>();const result:StoreItem[]=[];
 for(const [items,category] of [[featured?.featured_win,'Featured'],[categories?.coming_soon?.items,'Coming soon']] as const){
  if(!Array.isArray(items))continue;
  for(const item of items.slice(0,8)){if(!Number.isSafeInteger(item.id)||item.id<=0||item.type!==0||typeof item.name!=='string'||seen.has(item.id))continue;seen.add(item.id);result.push({id:item.id,name:plainText(item.name),image:httpsURL(item.large_capsule_image)||httpsURL(item.header_image),category});}
 }return result;
}
let cached:StoreItem[]=[],last=0,pending:Promise<StoreItem[]>|undefined;
export function boundedJSON(url:string){let timer:ReturnType<typeof setTimeout>;return Promise.race([fetchNoCors(url).then(r=>r.json()),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Steam content timed out')),8000);})]).finally(()=>clearTimeout(timer));}
let categoryRequest:ReturnType<typeof boundedJSON>|undefined, categoryExpiry=0;
export function featuredCategories(){
 if(!categoryRequest||Date.now()>=categoryExpiry){
  categoryExpiry=Date.now()+15*60_000;
  categoryRequest=boundedJSON('https://store.steampowered.com/api/featuredcategories').catch(error=>{categoryRequest=undefined;throw error;});
 }
 return categoryRequest;
}
export function loadStore():Promise<StoreItem[]>{
 if(cached.length&&Date.now()-last<15*60_000)return Promise.resolve(cached);if(pending)return pending;
 pending=Promise.allSettled([boundedJSON('https://store.steampowered.com/api/featured'),featuredCategories()]).then(r=>{const items=parseStoreItems(r[0].status==='fulfilled'?r[0].value:undefined,r[1].status==='fulfilled'?r[1].value:undefined);if(items.length){cached=items;last=Date.now();}return cached;}).finally(()=>{pending=undefined;});return pending;
}
type StoreArtwork={hero?:string;logo?:string};
const artworkCache=new Map<number,Promise<StoreArtwork>>();
export function storeArtwork(id:number):Promise<StoreArtwork>{
 const cached=artworkCache.get(id);
 if(cached)return cached;
 // New releases use per-file content hashes. The public appinfo mirror supplies the
 // same library asset manifest as SteamCMD, including the transparent library logo.
 const request=boundedJSON(`https://api.steamcmd.net/v1/info/${id}`).then(payload=>{
  const manifest=payload?.data?.[id]?.common?.library_assets_full;
  const url=(path:unknown)=>typeof path==='string'&&/^(?:[a-f0-9]{40}\/)?[a-z0-9_]+\.(?:jpg|png|webp)$/i.test(path)
   ?`https://shared.steamstatic.com/store_item_assets/steam/apps/${id}/${path}`:undefined;
  return {hero:url(manifest?.library_hero?.image2x?.english)||url(manifest?.library_hero?.image?.english),
   logo:url(manifest?.library_logo?.image2x?.english)||url(manifest?.library_logo?.image?.english)};
 }).catch(()=>{artworkCache.delete(id);return {};});
 if(artworkCache.size>=32)artworkCache.delete(artworkCache.keys().next().value!);
 artworkCache.set(id,request);
 return request;
}
