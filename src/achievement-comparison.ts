import {parseAchievements,type AchievementResult} from './achievements';
const cache=new Map<string,{time:number;value:AchievementResult}>();
export async function readFriendAchievements(host:any,appid:number,steamid:string):Promise<AchievementResult>{
 if(!Number.isSafeInteger(appid)||appid<=0||!/^7656119\d{10}$/.test(steamid))return {achievements:[],achievementState:'unavailable'};
 const key=`${appid}:${steamid}`,saved=cache.get(key);if(saved&&Date.now()-saved.time<60000)return saved.value;
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{
  if(typeof host.SteamClient?.Apps?.GetFriendAchievementsForApp!=='function')throw Error('Steam unavailable');
  const response=await Promise.race([host.SteamClient.Apps.GetFriendAchievementsForApp(String(appid),steamid),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Timed out')),5000);})]);
  const value=parseAchievements(response);if(cache.size>=20)cache.delete(cache.keys().next().value!);cache.set(key,{time:Date.now(),value});return value;
 }catch{return {achievements:[],achievementState:'unavailable'};}finally{clearTimeout(timer);}
}
