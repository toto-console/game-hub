import {Router} from '@decky/ui';
import {readLibrary,SHORTCUT,isInstalled} from './library-data';
import {launchShortcutFromLibrary} from './home/shortcut-launch';
import {gameById,playGame} from './game-adapter';
import {stopSoundtrackForLaunch} from './themedeck-adapter';
const pending=new Set<number>();
export async function launchMediaApp(id:number){if(pending.has(id))return;const app=readLibrary(window as any).entries.find(a=>a.appid===id);if(!app)throw Error('This shortcut is unavailable. Reselect it in Manage Apps or check Steam.');pending.add(id);try{if(app.app_type===SHORTCUT){stopSoundtrackForLaunch();await launchShortcutFromLibrary(window as any,Router as any,id);}else{if(!isInstalled(app))throw Error('Install this application through Steam before opening it.');const game=gameById(id);if(!game)throw Error('Steam could not resolve this application.');await playGame(game);}}finally{pending.delete(id);}}
