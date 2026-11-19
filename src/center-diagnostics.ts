export let overlayInitialization='not-observed';
export let homeIntegration='loading';
export function setOverlayInitialization(state:'ready'|'initialization-failed'){overlayInitialization=state;}
export function setHomeIntegration(state:'loading'|'enabled'|'disabled'|'conflict'|'disposed'){homeIntegration=state;}
import {decky} from './decky-adapter';
import manifest from '../package.json';
export type CenterDiagnostic={context:string;mounted:boolean;hooked:boolean;enabled:boolean;open:boolean;reason:string;lastAction:string;lastResult:string;activationSubscribed:boolean};
const readers=new Set<()=>CenterDiagnostic>();
export function registerCenterDiagnostic(read:()=>CenterDiagnostic){readers.add(read);return()=>{readers.delete(read);};}
export function centerReport(){
 const contexts=Array.from(readers).slice(0,8).map(read=>{try{return read();}catch{return {context:'unknown',reason:'steam-interface-unavailable'};}});
 let deckyUI='unknown',playHubPlugin='unknown';try{const loader=decky();if(loader){deckyUI='present';playHubPlugin=loader.plugins?.some(p=>p.name==='Playhub'&&typeof p.onDismount==='function')?'loaded':'not-observed';}}catch{/* optional integration */}
 return {overlayInitialization,homeIntegration,deckyUI,playHubPlugin,gameHubVersion:manifest.version,inputMethod:'Steam MenuStore request (not raw controller input)',inGameIntegration:contexts.some(c=>c.context==='in-game'&&'mounted' in c&&c.mounted&&c.hooked&&c.reason==='ready')?'available':contexts.some(c=>c.context==='in-game')?'unavailable':'unknown',contexts,controllerModel:'unknown',steamInputConfiguration:'unknown',launchMethod:'unknown',displayMode:'unknown',steamVersion:'unknown',deckyVersion:'unknown',playHubVersion:'unknown'};
}
