export type SoundtrackBridge={apiVersion:1;pluginVersion:string;platform:string;claim(owner:string):boolean;heartbeat(owner:string):void;pending(owner:string):void;silence?(owner:string):void;select(owner:string,id:number|null,smooth:boolean):boolean;release(owner:string):void;beforeLaunch():void;settings():{autoPlay:boolean;volume:number};setAutoPlay(value:boolean):void;setVolume(value:number):void;preview(id:number):Promise<boolean>;stopPreview(id:number):void};
export type MusicContext='home'|'library'|'detail';
export type SoundtrackPreferences={enabled:boolean;highlight:boolean;library:boolean;smooth:boolean;disabledGames:number[]};
export const soundtrackDefaults:SoundtrackPreferences={enabled:true,highlight:true,library:false,smooth:true,disabledGames:[]};
export function themeIdentity(id:unknown):number|null {return typeof id==='number'&&Number.isSafeInteger(id)&&id>0&&id<=0xffffffff?id:null;}
/** No audio objects or downloads: this selects context for ThemeDeck's single owner. */
export function createSoundtrackCoordinator(bridge:()=>SoundtrackBridge|undefined,preferences:()=>SoundtrackPreferences){
 const owner=`game-hub:${Math.random().toString(36).slice(2)}`;
 const scopes=new Map<symbol,{kind:MusicContext;id:number|null;serial:number}>();let serial=0;
 let idle:ReturnType<typeof setTimeout>|undefined;
 let current:SoundtrackBridge|undefined,signature='',timer:ReturnType<typeof setTimeout>|undefined,disposed=false;
 let failure='';
 const release=()=>{clearTimeout(timer);const previous=current;current=undefined;signature='';try{previous?.release(owner);}catch{failure='ThemeDeck could not release the soundtrack. Open its native controls.';}};
 const update=()=>{
  if(disposed)return;clearTimeout(idle);
  const prefs=preferences();const scope=[...scopes.values()].sort((a,b)=>(b.kind==='detail'?10:0)-(a.kind==='detail'?10:0)||b.serial-a.serial)[0];
  const next=prefs.enabled&&prefs.highlight&&scope?bridge():undefined;
  if(!next){if(!scope&&prefs.enabled&&prefs.highlight){if(current)idle=setTimeout(release,0);}else release();return;}
  if(current!==next){release();if(!next.claim(owner))return;current=next;}
  current.heartbeat(owner);
  // A null selection restores ThemeDeck global ambient without selecting grid games.
  const id=scope!.kind!=='library'&&scope!.id!==null&&!prefs.disabledGames.includes(scope!.id)?scope!.id:null;
  const key=JSON.stringify([id,prefs.smooth]);if(signature===key)return;
  signature=key;clearTimeout(timer);current.pending(owner);
  const expected=current;
  timer=setTimeout(()=>{if(disposed||current!==expected||signature!==key)return;try{expected.select(owner,id,prefs.smooth);}catch{failure='ThemeDeck soundtrack selection failed. Open its native controls.';release();}},375);
 };
 const refresh=()=>{try{update();}catch{failure='ThemeDeck is unavailable or incompatible. Open its native controls.';release();}};
 return {
  get error(){return failure;},
  mount(kind:MusicContext,id:number|null=null){const token=Symbol(kind);scopes.set(token,{kind,id:themeIdentity(id),serial:++serial});refresh();return {select(id:number|null){const v=scopes.get(token);if(v){v.id=themeIdentity(id);v.serial=++serial;refresh();}},dispose(){scopes.delete(token);refresh();}};},
  highlight(kind:MusicContext,id:number|null){const scope=[...scopes.values()].filter(v=>v.kind===kind).sort((a,b)=>b.serial-a.serial)[0];if(scope){scope.id=themeIdentity(id);scope.serial=++serial;refresh();}},
  refresh,dispose(){disposed=true;clearTimeout(idle);scopes.clear();release();}
 };
}
