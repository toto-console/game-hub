import {resolvePlayerID} from './friend-management';
import {safeAvatar} from './model';
export type SearchPlayer={id:string;name:string;avatar?:string};
export type SearchPage={players:SearchPlayer[];page:number;hasMore:boolean};
export class SearchUnavailable extends Error {}
type Transport=(url:string,init?:RequestInit)=>Promise<Response>;
export function profileURL(query:string):string|undefined {
 const id=resolvePlayerID(query);if(id)return 'https://steamcommunity.com/profiles/'+id+'/?xml=1';
 try{const u=new URL(query);if(u.protocol!=='https:'||u.hostname!=='steamcommunity.com'||u.port||u.username||u.password)return;
 const match=u.pathname.match(/^\/id\/([A-Za-z0-9_-]{1,64})\/?$/);if(match)return 'https://steamcommunity.com/id/'+match[1]+'/?xml=1';
 }catch{}return;
}
export function parseProfile(xml:string,parse:(s:string,type:DOMParserSupportedType)=>Document):SearchPlayer{
 const doc=parse(xml,'application/xml');const id=doc.querySelector('profile>steamID64')?.textContent?.trim();
 const name=doc.querySelector('profile>steamID')?.textContent?.trim();
 if(!id||resolvePlayerID(id)!==id||!name||doc.querySelector('parsererror'))throw Error('Steam did not return a valid public player profile.');
 return {id,name:name.slice(0,100),avatar:safeAvatar(doc.querySelector('profile>avatarFull,profile>avatarMedium')?.textContent?.trim())};
}
export function createPlayerSearch(transport:Transport,parse=(s:string,t:DOMParserSupportedType)=>new DOMParser().parseFromString(s,t)){
 let active=false,last=0;
 return {async search(query:string,page=1):Promise<SearchPage>{
  const q=query.trim();if(!q||q.length>120)throw Error('Enter between 1 and 120 characters.');
  if(!Number.isInteger(page)||page<1||page>100)throw Error('Invalid search page.');
  const profile=profileURL(q);
  if(!profile&&(/^[0-9]+$/.test(q)||/^https?:|^steam:/i.test(q)))throw Error('Use a valid friend code, individual Steam ID, or HTTPS Steam profile link.');
  // The installed Decky proxy has no authenticated Community-search bridge.
  // Do not retry a known unauthorized display-name endpoint or treat a name as a vanity ID.
  if(!profile)throw new SearchUnavailable('Steam display-name search is not available inside Game Hub. Choose Search on Steam to search names, or enter a friend code, SteamID64 or full profile URL here.');
  if(active)throw Error('A Steam search is already running.');
  if(Date.now()-last<1500)throw Error('Please wait a moment before searching again.');
  active=true;last=Date.now();const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await transport(profile,{method:'GET',signal:controller.signal});
   if(response.status===401||response.status===403)throw Error('Steam denied this public profile lookup (HTTP '+response.status+'). Try View Profile in Steam.');
   if(response.status===429)throw Error('Steam is rate limiting searches. Please try later.');
   if(!response.ok)throw Error('Steam search connection error (HTTP '+response.status+').');
   const body=await response.text();if(body.length>2000000)throw Error('Unexpected Steam response size.');
   return {players:[parseProfile(body,parse)],page:1,hasMore:false};
  }finally{clearTimeout(timeout);active=false;}
 }};
}
