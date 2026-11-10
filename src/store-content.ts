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
export function loadStore():Promise<StoreItem[]>{
 if(cached.length&&Date.now()-last<15*60_000)return Promise.resolve(cached);if(pending)return pending;
 pending=Promise.allSettled([boundedJSON('https://store.steampowered.com/api/featured'),boundedJSON('https://store.steampowered.com/api/featuredcategories')]).then(r=>{const items=parseStoreItems(r[0].status==='fulfilled'?r[0].value:undefined,r[1].status==='fulfilled'?r[1].value:undefined);if(items.length){cached=items;last=Date.now();}return cached;}).finally(()=>{pending=undefined;});return pending;
}
const details=new Map<number,StoreItem>();
export async function storeDetails(item:StoreItem){const old=details.get(item.id);if(old)return old;
 try{const payload=await boundedJSON(`https://store.steampowered.com/api/appdetails?appids=${item.id}`),d=payload?.[item.id]?.data;if(d?.steam_appid!==item.id)return item;
 const result={...item,hero:httpsURL(d.background_raw)||httpsURL(d.background),description:plainText(d.short_description),release:typeof d.release_date?.date==='string'?d.release_date.date:undefined};if(details.size>=24)details.delete(details.keys().next().value!);details.set(item.id,result);return result;}catch{return item;}
}
