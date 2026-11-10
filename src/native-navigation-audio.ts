import {findModuleChild} from '@decky/ui';
import {setNavigationSound,setSelectionSound} from './navigation';
let nativeAudio:any, soundTypes:any;
export function playSound(kind:'BasicNav'|'DefaultOk'|'CloseSideMenu'|'OutOfGameDetail'){try{
 nativeAudio??=findModuleChild(m=>{if(!m||typeof m!=='object')return;return Object.values(m).find((v:any)=>typeof v?.GamepadUIAudio?.PlayNavSound==='function');})?.GamepadUIAudio;
 soundTypes??=findModuleChild(m=>{if(!m||typeof m!=='object')return;return Object.values(m).find((v:any)=>typeof v?.BasicNav==='number'&&typeof v?.FailedNav==='number');});
 const type=soundTypes?.[kind];
 if(nativeAudio&&typeof type==='number')nativeAudio.PlayNavSound(type);
}catch{/* Optional native sound discovery must never block navigation or activation. */}}

export function startNavigationAudio(){
 setNavigationSound(()=>playSound('BasicNav'));
 setSelectionSound(()=>playSound('DefaultOk'));
 return()=>{setNavigationSound(()=>{});setSelectionSound(()=>{});nativeAudio=undefined;soundTypes=undefined;};
}
