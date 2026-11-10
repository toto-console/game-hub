import {boundedJSON} from './store-content';
import {newsForApp,plainText} from './game-content';
export type NewsCategory='New Releases'|'Coming Soon'|'Game Announcements'|'Major Updates'|'New Trailers';
export type CenterNews={key:string;appid:number;game:string;headline:string;category:NewsCategory;image?:string;date?:string;published?:number;url:string};
const TTL=30*60*1000, RETRY=5*60*1000;
export function steamImage(raw:unknown):string|undefined {try{const u=new URL(String(raw));return u.protocol==='https:'&&!u.username&&!u.password&&/(^|\.)(steamstatic\.com|steamcdn-a\.akamaihd\.net)$/.test(u.hostname)?u.href:undefined;}catch{return;}}
export function discoverNews(payload:any):CenterNews[]{
 const rows:CenterNews[]=[];
 for(const [field,category] of [['new_releases','New Releases'],['coming_soon','Coming Soon']] as const){
  const items=payload?.[field]?.items;if(!Array.isArray(items))continue;
  const top=new Set((Array.isArray(payload?.top_sellers?.items)?payload.top_sellers.items:[]).filter(Boolean).map((x:any)=>x.id));
  for(const item of items.filter(Boolean).sort((a,b)=>Number(top.has(b.id))-Number(top.has(a.id))).slice(0,10)){
   if(!Number.isSafeInteger(item.id)||item.id<=0||item.type!==0||typeof item.name!=='string')continue;
   rows.push({key:`${field}:${item.id}`,appid:item.id,game:plainText(item.name).slice(0,140),headline:plainText(item.name).slice(0,180),category,image:steamImage(item.large_capsule_image)||steamImage(item.header_image),url:`https://store.steampowered.com/app/${item.id}/`});
  }
 }
 return [...new Map(rows.map(r=>[r.key,r])).values()];
}
export function announcementRows(payload:unknown,game:{appid:number;game:string;image?:string},now=Date.now()):CenterNews[]{
 return newsForApp(payload,game.appid).filter(n=>n.official&&n.date>now/1000-60*86400&&n.date<=now/1000+300).map(n=>({key:n.url,appid:game.appid,game:game.game,headline:n.title.slice(0,180),category:/\btrailer\b/i.test(n.title)?'New Trailers':/\b(major update|expansion|content update)\b/i.test(n.title)?'Major Updates':'Game Announcements',image:steamImage(n.image)||game.image,published:n.date,date:new Date(n.date*1000).toLocaleDateString(),url:`https://store.steampowered.com/app/${game.appid}/` }));
}
let cache:CenterNews[]=[],updated=0,attempt=0,pending:Promise<CenterNews[]>|undefined,cursor=0;
export function chooseNews(rows:CenterNews[]){return rows.length?rows[cursor++%rows.length]:undefined;}
export function newsIsCached(){return !!updated&&Date.now()-updated>=TTL;}
export function cachedNews(){return cache;}
export function resetCenterNews(){cache=[];updated=0;attempt=0;cursor=0;pending=undefined;}
export function loadCenterNews(relevant:Array<{appid:number;game:string}>=[]):Promise<CenterNews[]>{
 if(pending)return pending;
 if((updated>0&&Date.now()-updated<TTL)||(attempt>0&&Date.now()-attempt<RETRY))return Promise.resolve(cache);
 attempt=Date.now();
 pending=(async()=>{
  let rows:CenterNews[]=[];
  try{rows=discoverNews(await boundedJSON('https://store.steampowered.com/api/featuredcategories'));}catch{}
  // Small fixed budget: discovery + four dates + four per-app official feeds at most.
  const featured=[...rows.filter(r=>r.category==='New Releases').slice(0,2),...rows.filter(r=>r.category==='Coming Soon').slice(0,2)];
  await Promise.allSettled(featured.map(async row=>{const p=await boundedJSON(`https://store.steampowered.com/api/appdetails?appids=${row.appid}`);const d=p?.[row.appid]?.data;if(d?.steam_appid===row.appid&&typeof d.release_date?.date==='string')row.date=plainText(d.release_date.date).slice(0,60);}));
  const candidates=[...relevant.slice(0,2),...featured].filter((v,i,a)=>a.findIndex(x=>x.appid===v.appid)===i).slice(0,4);
  const announcements=await Promise.allSettled(candidates.map(async g=>announcementRows(await boundedJSON(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${g.appid}&count=3&maxlength=300&feeds=steam_community_announcements`),g)));
  const news=announcements.flatMap(x=>x.status==='fulfilled'?x.value:[]).sort((a,b)=>(b.published??0)-(a.published??0));
  // Interleave categories so forthcoming games and announcements aren't starved by releases.
  const buckets=[rows.filter(r=>r.category==='New Releases'),rows.filter(r=>r.category==='Coming Soon'),news];
  rows=[];for(let i=0;i<10;i++)for(const b of buckets)if(b[i])rows.push(b[i]);
  if(rows.length){cache=[...new Map(rows.map(r=>[r.key,r])).values()].slice(0,30);updated=Date.now();}
  return cache;
 })().finally(()=>{pending=undefined;});return pending;
}
