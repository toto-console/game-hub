import {readSteamFriends,type Friend} from '../model';
/** Only exact, Steam-reported currently-playing IDs; never infer ownership from names. */
export function friendsPlaying(host:any,appid:number):{friends:Friend[];available:boolean}{
 const snapshot=readSteamFriends(host);if(snapshot.kind!=='ready')return {friends:[],available:false};
 try{const raw=host.friendStore.allFriends;const ids=new Set(raw.filter((f:any)=>f?.is_ready===true&&f.persona?.is_online===true&&f.persona?.is_ingame===true&&f.persona?.m_unGamePlayedAppID===appid).map((f:any)=>f.steamid64));return {friends:snapshot.friends.filter(f=>ids.has(f.id)&&f.state==='playing'),available:raw.every((f:any)=>f?.is_ready===true&&(!f.persona?.is_ingame||typeof f.persona?.m_unGamePlayedAppID==='number'))};}catch{return {friends:[],available:false};}
}
export let homeHubReturn:{appid:number;friends?:boolean}|undefined;
export function rememberHomeHub(appid:number,friends=false){homeHubReturn={appid,friends};}
export function clearHomeHubReturn(){homeHubReturn=undefined;}
