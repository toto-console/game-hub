import {gameById,loadGame,type Achievement,type Game} from './game-adapter';
export type ActivityAchievement=Achievement&{hidden:boolean};
export type GameActivityData={game:Game;heroes:string[];covers:string[];logos:string[];shots:string[];achievements:ActivityAchievement[];warning?:string};
export const suspendCapability={supported:false,reason:'Safe game suspension is not available in this Steam integration.'} as const;
const asset=(s:unknown):s is string=>typeof s==='string'&&/^(https:\/\/|\/(?:assets|customimages)\/)/.test(s);
const assets=(v:unknown)=>Array.isArray(v)?v.filter(asset):[];
export function normalizeAchievements(value:unknown):ActivityAchievement[]{
 if(!Array.isArray(value))throw Error('Steam did not return its achievement list.');
 const seen=new Set<string>();return value.flatMap(a=>{
  if(!a||typeof a.strID!=='string'||seen.has(a.strID))return [];seen.add(a.strID);
  const done=a.bAchieved===true,hidden=a.bHidden===true&&!done;
  return [{id:a.strID,name:hidden?'Hidden achievement':String(a.strName||'Achievement'),description:hidden?'Unlock this achievement to reveal its details.':String(a.strDescription||''),image:hidden?undefined:asset(a.strImage)?a.strImage:undefined,done,hidden,unlocked:done&&Number.isFinite(a.rtUnlocked)?a.rtUnlocked:0,rarity:!hidden&&Number.isFinite(a.flAchieved)?a.flAchieved:undefined,current:!hidden&&a.flMaxProgress>0&&Number.isFinite(a.flCurrentProgress)?a.flCurrentProgress:undefined,max:!hidden&&a.flMaxProgress>0?a.flMaxProgress:undefined}];
 }).sort((a,b)=>Number(a.hidden)-Number(b.hidden)||Number(b.done)-Number(a.done)||b.unlocked-a.unlocked);
}
export async function loadGameActivity(id:number):Promise<GameActivityData>{
 const game=gameById(id);if(!game)throw Error('The current game is no longer available.');
 const h=window as any,a=h.appStore.GetAppOverviewByAppID(id),d=h.appDetailsStore;
 const [media,achievements]=await Promise.allSettled([loadGame(game),game.shortcut?Promise.resolve([]):Promise.resolve().then(()=>{if(typeof h.SteamClient?.Apps?.GetMyAchievementsForApp!=='function')throw Error('Achievement interface unavailable.');return h.SteamClient.Apps.GetMyAchievementsForApp(String(id));}).then((r:any)=>{if(r.result!==1)throw Error('Steam achievements are unavailable.');return normalizeAchievements(r.data?.rgAchievements);})]);
 const heroes=assets(d.GetHeroImages(a)?.rgHeroImages),covers=assets([...(h.appStore.GetCustomVerticalCapsuleURLs?.(a)??[]),...(h.appStore.GetCachedVerticalCapsuleURL?.(a)??[]),h.appStore.GetVerticalCapsuleURLForApp?.(a),h.appStore.GetPregeneratedVerticalCapsuleForApp?.(a),...(d.GetHeaderImages(a)??[])]),logos=assets(d.GetLogoImages(a)?.rgLogoImages);
 const m=media.status==='fulfilled'?media.value:undefined;
 if(!heroes.length&&m?.hero&&asset(m.hero))heroes.push(m.hero);
 return {game,heroes,covers,logos,shots:m?.shots.map(s=>s.thumb).filter(asset)??[],achievements:achievements.status==='fulfilled'?achievements.value:[],warning:achievements.status==='rejected'?'Steam could not load achievements.':game.shortcut?'Steam achievements are unavailable for this shortcut.':undefined};
}
