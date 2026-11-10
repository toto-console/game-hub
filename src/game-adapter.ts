import {readGameAchievements,type AchievementResult} from './achievements';
import {boundedJSON} from './store-content';
import {newsForApp,plainText,type GameNews} from './game-content';
import {stopSoundtrackForLaunch} from './themedeck-adapter';
import {heroUrls} from './library-art';
import {isInstalled,recentLibrary,lastPlayed,SHORTCUT} from './library-data';
import {launchGameId} from './home/launch-id';
export type Game={id:number;name:string;last:number;minutes:number;installed:boolean;shortcut:boolean;gameid:string;icon?:string};
const host=()=>window as any;
function normalizeGame(a:any):Game {const h=host();return {id:a.appid,name:a.display_name,last:lastPlayed(a),minutes:a.minutes_playtime_forever??0,installed:isInstalled(a),shortcut:a.app_type===SHORTCUT,gameid:launchGameId(a)??'',icon:h.appStore?.GetIconURLForApp?.(a)};}
export function recentGames():Game[]{return recentLibrary(host(),3).map(normalizeGame);}
export function gameById(id:number):Game|undefined{const a=host().appStore?.GetAppOverviewByAppID(id);return a?normalizeGame(a):undefined;}
export async function playGame(g:Game){const h=host(),a=h.appStore?.GetAppOverviewByAppID(g.id);if(!a)throw Error('This game is no longer in the library.');const id=launchGameId(a);if(a.app_type===SHORTCUT){if(!id)throw Error('Steam shortcut launch identity unavailable. Use Steam game details.');}else if(!isInstalled(a)){if(typeof h.SteamClient?.Installs?.OpenInstallWizard!=='function')throw Error('Use Steam game details to install.');return h.SteamClient.Installs.OpenInstallWizard([g.id]);}if(!id)throw Error('Steam launch identity unavailable.');stopSoundtrackForLaunch();return h.SteamClient.Apps.RunGame(id,'',-1,100);}
export type Achievement={id:string;name:string;description:string;image?:string;done:boolean;unlocked:number;rarity?:number;current?:number;max?:number};
export type GameData={achievementState?:AchievementResult['achievementState'];hero?:string;description?:string;free?:boolean;achievements:Achievement[];total?:number;done?:number;shots:{thumb:string;url:string}[];movies:{name:string;thumb:string;url?:string}[];news:GameNews[];warning?:string};
const cache=new Map<number,{time:number;data:GameData}>();
const safe=(u:unknown)=>typeof u==='string'&&(/^(https:\/\/|\/assets\/)/.test(u))?u:undefined;
const pending=new Map<number,Promise<GameData>>();
async function withDeadline(task:unknown){let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([Promise.resolve(task),new Promise(resolve=>{timer=setTimeout(resolve,5000);})]);}finally{clearTimeout(timer);}}
export function loadGame(g:Game,refresh=false):Promise<GameData>{
 if(refresh)cache.delete(g.id);
 const c=cache.get(g.id);if(c&&Date.now()-c.time<60000)return Promise.resolve(c.data);
 const existing=pending.get(g.id);if(existing)return existing;
 const request=loadGameData(g).finally(()=>pending.delete(g.id));pending.set(g.id,request);return request;
}
async function loadGameData(g:Game):Promise<GameData>{const h=host(),d=h.appDetailsStore;const data:GameData={achievements:[],shots:[],movies:[],news:[]};
 try{await withDeadline(d?.RequestAppDetails?.(g.id));}catch{}const overview=h.appStore?.GetAppOverviewByAppID(g.id);data.hero=overview?heroUrls(overview)[0]:undefined;
 Object.assign(data,await readGameAchievements(h,g.id,g.shortcut));
 if(!g.shortcut){
 const results=await Promise.allSettled([boundedJSON(`https://store.steampowered.com/api/appdetails?appids=${g.id}`),boundedJSON(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${g.id}&count=12&maxlength=1200`),boundedJSON(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${g.id}&count=6&maxlength=1200&feeds=steam_community_announcements`)]);
 const store=results[0].status==='fulfilled'?results[0].value?.[g.id]?.data:undefined;
 if(store?.steam_appid===g.id){data.description=plainText(store.short_description);data.free=store.is_free===true;data.hero=data.hero||safe(store.background_raw)||safe(store.header_image);data.shots=(store.screenshots??[]).map((s:any)=>({thumb:safe(s.path_thumbnail),url:safe(s.path_full)})).filter((s:any)=>s.thumb&&s.url);data.movies=(store.movies??[]).map((m:any)=>({name:m.name,thumb:safe(m.thumbnail),url:safe(m.webm?.max)||safe(m.mp4?.max)}));}
 const news=results[1].status==='fulfilled'?results[1].value:undefined;const official=results[2].status==='fulfilled'?results[2].value:undefined;data.news=Array.from(new Map([...newsForApp(official,g.id),...newsForApp(news,g.id)].map(n=>[n.url,n])).values());
 if(!store||!news)data.warning='Some online content is unavailable. Steam library information remains available.';
 }if(cache.size>=12)cache.delete(cache.keys().next().value!);cache.set(g.id,{time:Date.now(),data});return data;}
