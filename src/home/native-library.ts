import {Navigation} from '@decky/ui';
export const GAME_HUB_LIBRARY='/game-hub/home/library';
export const NATIVE_LIBRARY_RECOVERY='game-hub:native-library-recovery';
export function isNativeLibraryEntry(path:string){return /^\/library\/?(?:[?#].*)?$/.test(path);}
/** Recovery disables only the Library route patch until re-enabled or the plugin reloads. */
export function openNativeLibraryRecovery(){window.dispatchEvent(new Event(NATIVE_LIBRARY_RECOVERY));Navigation.Navigate('/library');}
