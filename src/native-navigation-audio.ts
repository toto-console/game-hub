import {findModuleChild} from '@decky/ui';
import {setNavigationSound,setSelectionSound} from './navigation';
export let soundRevision=0;
let nativeAudio:any, soundTypes:any, subscription:{Unregister:()=>void}|undefined;
export type NavigationSound='BasicNav'|'DefaultOk'|'CloseSideMenu'|'OutOfGameDetail'|'IntoGameDetail'|'ChangeTabs'|'ShowModal'|'HideModal'|'FailedNav';
function resolveAudio(){
 const runtime=(window as any).DFL;
 nativeAudio??=runtime?.findModuleExport?.((v:any)=>typeof v?.PlayNavSound==="function"&&typeof v?.RegisterCallbackOnPlaySound==="function");
 nativeAudio??=findModuleChild(m=>{if(!m||typeof m!=='object')return;return Object.values(m).map((v:any)=>v?.GamepadUIAudio??v).find((v:any)=>typeof v?.PlayNavSound==='function'&&typeof v?.RegisterCallbackOnPlaySound==='function');});
 soundTypes??=runtime?.ESteamUISound;
 soundTypes??=findModuleChild(m=>{if(!m||typeof m!=='object')return;return Object.values(m).find((v:any)=>typeof v?.BasicNav==='number'&&typeof v?.FailedNav==='number');});
 if(nativeAudio&&!subscription)subscription=nativeAudio.RegisterCallbackOnPlaySound(()=>{soundRevision++;});
}
export function readSoundRevision(){
 try{resolveAudio();}catch{/* Steam may still be starting. */}
 return soundRevision;
}
export function playSound(kind:NavigationSound){try{
 resolveAudio();
 const type=soundTypes?.[kind];
 if(nativeAudio&&typeof type==='number'){soundRevision++;nativeAudio.PlayNavSound(type);}
}catch{/* Optional native sound discovery must never block navigation or activation. */}}

export function startNavigationAudio(){
 setNavigationSound(()=>playSound('BasicNav'));
 setSelectionSound(()=>playSound('DefaultOk'));
 return()=>{setNavigationSound(()=>{});setSelectionSound(()=>{});subscription?.Unregister();subscription=undefined;nativeAudio=undefined;soundTypes=undefined;};
}
