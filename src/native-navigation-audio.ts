import {findModuleChild} from '@decky/ui';
import {setNavigationSound} from './navigation';
let nativeAudio:any, navType:number|undefined;
function navigationSound(){try{
 nativeAudio??=findModuleChild(m=>{if(!m||typeof m!=='object')return;return Object.values(m).find((v:any)=>typeof v?.GamepadUIAudio?.PlayNavSound==='function');})?.GamepadUIAudio;
 navType??=findModuleChild(m=>{if(!m||typeof m!=='object')return;return Object.values(m).find((v:any)=>typeof v?.BasicNav==='number'&&typeof v?.FailedNav==='number');})?.BasicNav;
 if(nativeAudio&&navType!==undefined)nativeAudio.PlayNavSound(navType);
}catch{/* Optional native sound discovery must never block focus. */}}

export function startNavigationAudio(){setNavigationSound(navigationSound);return()=>setNavigationSound(()=>{});}
