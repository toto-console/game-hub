import type {Achievement} from './game-adapter';
export type AchievementResult={achievements:Achievement[];total?:number;done?:number;achievementState:'ready'|'empty'|'unavailable'|'unsupported'};
export function parseAchievements(response:unknown):AchievementResult{
 const data=typeof response==='string'?JSON.parse(response):response as any;
 if(data?.result!==undefined&&data.result!==1)throw Error('Steam achievement request failed');
 const rows=data?.data?.rgAchievements;
 if(!Array.isArray(rows))throw Error('Steam achievement response unavailable');
 const seen=new Set<string>();
 const achievements:Achievement[]=rows.flatMap((a:any)=>{
  if(!a||typeof a.strID!=='string'||!a.strID||seen.has(a.strID))return [];
  seen.add(a.strID);const done=a.bAchieved===true,hidden=a.bHidden===true&&!done;
  const number=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:undefined;
  return [{id:a.strID,name:hidden?'Hidden achievement':a.strName||a.strID,description:hidden?'Keep playing to discover this achievement.':a.strDescription||'',image:!hidden&&typeof a.strImage==='string'&&a.strImage.startsWith('https://')?a.strImage:undefined,done,unlocked:number(a.rtUnlocked)??0,current:number(a.flCurrentProgress),max:number(a.flMaxProgress),rarity:number(a.flAchieved)}];
 });
 if(rows.length&&!achievements.length)throw Error('Steam achievement data could not be read');
 return {achievements,total:achievements.length,done:achievements.filter(a=>a.done).length,achievementState:achievements.length?'ready':'empty'};
}
export async function readGameAchievements(host:any,id:number,shortcut:boolean):Promise<AchievementResult>{
 if(shortcut)return {achievements:[],achievementState:'unsupported'};
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{
  if(typeof host.SteamClient?.Apps?.GetMyAchievementsForApp!=='function')throw Error('Steam not ready');
  const response=await Promise.race([host.SteamClient.Apps.GetMyAchievementsForApp(String(id)),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Timed out')),5000);})]);
  return parseAchievements(response);
 }catch{return {achievements:[],achievementState:'unavailable'};}finally{clearTimeout(timer);}
}
