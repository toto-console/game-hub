import {validWallpaper} from './wallpaper-media';
export const WIDGETS=['achievements','controller','storage','favorites','store','news','friends','wishlist','activity','messages','accessibility'] as const;
export type WidgetId=typeof WIDGETS[number];
export type Cell={id:WidgetId;x:number;y:number;w:number;h:number};
export type WelcomeSettings={version:1;preset:string;cells:Cell[];custom?:Cell[];background:'abstract'|'game'|'existing'|'local';wallpaperScope:'welcome'|'home';image?:string;animateWallpaper?:boolean;largeText:boolean;contrast:boolean;reducedMotion:boolean};
export const TITLES:Record<WidgetId,string>={achievements:'Achievements',controller:'Accessories',storage:'PC Storage',favorites:'Favorites',store:'Steam Store',news:'News',friends:'Friends Online',wishlist:'Wishlist',activity:'Friend Activity',messages:'Messages',accessibility:'Accessibility'};
const cell=(id:WidgetId,x:number,y:number,h=1):Cell=>({id,x,y,w:4,h});
export function preset(name='PS5 Reference Layout'):Cell[]{
 if(name==='Social')return [cell('friends',0,0,2),cell('messages',0,2),cell('activity',4,0,3),cell('wishlist',8,0,2),cell('controller',8,2)];
 if(name==='Gaming')return [cell('achievements',0,0,2),cell('controller',0,2),cell('favorites',4,0,3),cell('store',8,0,2),cell('news',8,2)];
 if(name==='Minimal')return [cell('friends',0,0),cell('controller',4,0),cell('storage',8,0)];
 return [cell('achievements',0,0,2),cell('controller',0,2),cell('storage',4,0),cell('favorites',4,1,2),cell('store',8,0,2),cell('news',8,2),cell('friends',12,0),cell('wishlist',12,1,2),cell('activity',16,0,2),cell('messages',16,2),cell('accessibility',20,0)];
}
export const defaults=():WelcomeSettings=>({version:1,preset:'PS5 Reference Layout',cells:preset(),background:'abstract',wallpaperScope:'welcome',animateWallpaper:true,largeText:false,contrast:false,reducedMotion:false});
export function overlaps(a:Cell,b:Cell){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
export function fits(c:Cell,cells:Cell[]){return c.x>=0&&c.x+c.w<=28&&c.y>=0&&c.y+c.h<=3&&!cells.some(o=>o.id!==c.id&&overlaps(c,o));}
/** Place the edited card first, then preserve/reflow its neighbors without losing widgets. */
export function arrange(cells:Cell[],id:WidgetId,change:Partial<Pick<Cell,'x'|'y'|'h'>>):Cell[]{
 const old=cells.find(c=>c.id===id);if(!old)return cells;
 const target={...old,...change};target.x=Math.max(0,Math.min(24,target.x));target.y=Math.max(0,Math.min(2,target.y));target.h=Math.max(1,Math.min(target.h,3-target.y));
 if(target.x===old.x&&target.y===old.y&&target.h===old.h)return cells;
 const pack=(compact:boolean)=>{
  const placed:Cell[]=[target],pending:Cell[]=[];
  for(const c of cells.filter(c=>c.id!==id)){const item=compact?{...c,h:1}:c;if(fits(item,placed))placed.push(item);else pending.push(item);}
  for(const c of pending){let found:Cell|undefined;
   for(let h=c.h;h>=1&&!found;h--){const slots:Cell[]=[];for(let x=0;x<=24;x+=4)for(let y=0;y<=3-h;y++)slots.push({...c,x,y,h});
    slots.sort((a,b)=>(Math.abs(a.x-c.x)+Math.abs(a.y-c.y))-(Math.abs(b.x-c.x)+Math.abs(b.y-c.y)));found=slots.find(v=>fits(v,placed));}
   if(!found)return undefined;placed.push(found);
  }
  return cells.map(c=>placed.find(v=>v.id===c.id)!);
 };
 return pack(false)??pack(true)??cells;
}
export function insert(cells:Cell[],id:WidgetId,h=1):Cell[]{
 if(cells.some(c=>c.id===id))return cells;
 for(let x=0;x<28;x+=4)for(let y=0;y<=3-h;y++){const c=cell(id,x,y,h);if(fits(c,cells))return [...cells,c];}
 return cells;
}
export function sanitizeSettings(raw:any):WelcomeSettings{
 const d=defaults();if(!raw||typeof raw!=='object')return d;
 const cells:Cell[]=[];
 for(const c of Array.isArray(raw.cells)?raw.cells.slice(0,11):d.cells){if(!WIDGETS.includes(c?.id)||cells.some(x=>x.id===c.id)||![c.x,c.y,c.w,c.h].every(Number.isInteger)||c.w!==4||c.h<1||c.h>3||c.x%4||!fits(c,cells))continue;cells.push({id:c.id,x:c.x,y:c.y,w:4,h:c.h});}
 return {...d,...(Array.isArray(raw.custom)&&raw.custom.length?{custom:sanitizeSettings({cells:raw.custom}).cells}:{}),preset:['PS5 Reference Layout','Social','Gaming','Minimal','Custom'].includes(raw.preset)?raw.preset:d.preset,cells:cells.length?cells:d.cells,background:['abstract','game','existing','local'].includes(raw.background)?raw.background:'abstract',wallpaperScope:raw.wallpaperScope==='home'?'home':'welcome',image:validWallpaper(raw.image)?raw.image:undefined,animateWallpaper:raw.animateWallpaper!==false,largeText:raw.largeText===true,contrast:raw.contrast===true,reducedMotion:raw.reducedMotion===true};
}
export function neighbor(cells:Cell[],id:WidgetId,dx:number,dy:number):WidgetId|undefined{
 const a=cells.find(c=>c.id===id);if(!a)return cells[0]?.id;
 const cx=a.x+a.w/2,cy=a.y+a.h/2;
 return cells.filter(b=>b.id!==id&&(dx?(b.x+b.w/2-cx)*dx>0:(b.y+b.h/2-cy)*dy>0)).sort((b,c)=>{
  const score=(v:Cell)=>{const x=v.x+v.w/2-cx,y=v.y+v.h/2-cy;return dx?Math.abs(x)+Math.abs(y)*8:Math.abs(y)+Math.abs(x)*2;};return score(b)-score(c);
 })[0]?.id;
}
export let welcomeReturn:WidgetId|undefined;
export let welcomePosition:{top:number;left:number}|undefined;
export function rememberWelcome(id?:WidgetId,position?:{top:number;left:number}){welcomeReturn=id;welcomePosition=id?position:undefined;}

/** Visual entry point is independent of saved array/DOM order. */
export function firstWidget(cells:Cell[]):WidgetId|undefined{return [...cells].sort((a,b)=>a.x-b.x||a.y-b.y)[0]?.id;}
