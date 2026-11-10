export type GameNews={title:string;url:string;date:number;author:string;contents:string;official?:boolean;image?:string};
export const plainText=(v:unknown)=>String(v??'').replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ').replace(/\[\/?[^\]]+\]/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
export function httpsURL(value:unknown):string|undefined {try{const u=new URL(String(value));return u.protocol==='https:'&&!u.username&&!u.password?u.href:undefined;}catch{return undefined;}}
export function newsForApp(payload:any,appid:number):GameNews[]{
 if(payload?.appnews?.appid!==appid||!Array.isArray(payload.appnews.newsitems))return [];
 return payload.appnews.newsitems.filter((n:any)=>typeof n.title==='string'&&httpsURL(n.url)&&(!n.appid||n.appid===appid)).slice(0,12).map((n:any)=>{
  const url=httpsURL(n.url)!,host=new URL(url).hostname;
  // Only Steam's per-app announcement feed, never a general community post or external publication.
  const path=new URL(url).pathname;
  const official=n.feedname==='steam_community_announcements'&&n.feed_type===1&&((['store.steampowered.com','steamstore-a.akamaihd.net'].includes(host)&&/^\/news\/externalpost\/steam_community_announcements\/\d+/.test(path))||(host==='steamcommunity.com'&&/^\/games\/[^/]+\/announcements\/detail\/\d+/.test(path)));
  const raw=String(n.contents??'');const candidate=raw.match(/\[img\](https:\/\/[^\[]+)\[\/img\]/i)?.[1]??raw.match(/<img[^>]+src=["'](https:\/\/[^"']+)["']/i)?.[1];
  const image=httpsURL(candidate);const imageHost=image?new URL(image).hostname:'';
  return {title:plainText(n.title),url,date:Number.isFinite(n.date)?n.date:0,author:plainText(n.feedlabel||n.author||'Steam'),contents:plainText(raw),official,image:image&&/(^|\.)(steamstatic\.com|steamcommunity\.com|akamaihd\.net)$/.test(imageHost)?image:undefined};
 });
}
export function achievementPercent(current:unknown,max:unknown){return typeof current==='number'&&Number.isFinite(current)&&current>=0&&typeof max==='number'&&Number.isFinite(max)&&max>0?Math.min(100,Math.round(current/max*100)):undefined;}
