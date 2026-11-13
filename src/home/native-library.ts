import {Navigation} from '@decky/ui';
export const GAME_HUB_HOME='/game-hub/home';
export const GAME_HUB_LIBRARY='/game-hub/home/library';
export const NATIVE_LIBRARY_RECOVERY='game-hub:native-library-recovery';
export function isNativeLibraryEntry(path:string){return /^\/library\/?(?:[?#].*)?$/.test(path);}
/** Recovery disables only the Library route patch until re-enabled or the plugin reloads. */
export function openNativeLibraryRecovery(){window.dispatchEvent(new Event(NATIVE_LIBRARY_RECOVERY));Navigation.Navigate('/library');}

export const OPEN_GAME_HUB_LIBRARY="game-hub:open-library";
/** A route can remain mounted after its Library tab returns Home. Re-select it explicitly. */
export function openGameHubLibrary(navigate:(path:string)=>void){navigate(GAME_HUB_LIBRARY);window.dispatchEvent(new Event(OPEN_GAME_HUB_LIBRARY));}

export function returnFromGameHubLibrary(routeTab:string,navigate:(path:string)=>void,selectHome:()=>void){
 if(routeTab==="library")navigate(GAME_HUB_HOME);
 else selectHome();
}
