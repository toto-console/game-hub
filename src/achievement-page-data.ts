import type {Achievement} from './game-adapter';
export const achievementSorts=['Game Default','Recently Unlocked','Oldest Unlocked','Locked','Unlocked','Rarest First','Most Common'] as const;
export type AchievementSort=typeof achievementSorts[number];
export function sortAchievements(rows:Achievement[],sort:AchievementSort){
 const result=rows.filter(a=>sort==='Locked'?!a.done:sort==='Unlocked'?a.done:true);
 if(sort==='Recently Unlocked'||sort==='Oldest Unlocked')result.sort((a,b)=>{const x=a.done?a.unlocked:0,y=b.done?b.unlocked:0;return !x?(!y?0:1):!y?-1:sort==='Recently Unlocked'?y-x:x-y;});
 if(sort==='Rarest First'||sort==='Most Common')result.sort((a,b)=>a.rarity===undefined?(b.rarity===undefined?0:1):b.rarity===undefined?-1:sort==='Rarest First'?a.rarity-b.rarity:b.rarity-a.rarity);
 return result;
}
export function rarityLabel(value:number){return value<1?'Ultra rare':value<10?'Rare':value<50?'Uncommon':'Common';}
export function achievementDate(a:Achievement){return a.done&&a.unlocked>0?new Date(a.unlocked*1000).toLocaleString():'';}
