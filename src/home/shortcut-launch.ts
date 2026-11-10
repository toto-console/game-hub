import {launchGameId} from './launch-id';

const pending=new Map<number,Promise<void>>();

/** Steam's shortcut prelaunch workflow must run in its native details context.
 * Playhub Metadata changes shortcut classification on Home; starting RunGame
 * there can stall Steam at ShowInterstitials without creating a process. */
export function launchShortcutFromLibrary(host:any,router:any,appid:number):Promise<void> {
 const existing=pending.get(appid);if(existing)return existing;
 const task=launch(host,router,appid).finally(()=>pending.delete(appid));
 pending.set(appid,task);return task;
}

async function launch(host:any,router:any,appid:number):Promise<void> {
 const initial=host.appStore?.GetAppOverviewByAppID(appid);
 if(!initial||!launchGameId(initial))throw Error('Steam shortcut identity unavailable.');
 const instance=router.WindowStore?.GamepadUIMainWindowInstance;
 const history=instance?.m_history,path=`/library/app/${appid}`;
 if(typeof history?.listen!=='function'||typeof instance?.Navigate!=='function')
  throw Error('Steam launch navigation unavailable.');
 await new Promise<void>((resolve,reject)=>{
  let frame:number|undefined,unlisten=()=>{};
  const cleanup=()=>{clearTimeout(timeout);unlisten();if(frame!==undefined)host.cancelAnimationFrame(frame);};
  const fail=(e:unknown)=>{cleanup();reject(e);};
  const timeout=setTimeout(()=>fail(Error('Steam game details did not open.')),3000);
  const check=()=>{
   if(history.location?.pathname!==path||frame!==undefined)return;
   frame=host.requestAnimationFrame(()=>{
    if(history.location?.pathname!==path){fail(Error('Game launch navigation cancelled.'));return;}
    cleanup();resolve();
   });
  };
  unlisten=history.listen(check);
  try{instance.Navigate(path);check();}catch(e){fail(e);}
 });
 const overview=host.appStore.GetAppOverviewByAppID(appid);
 // EDisplayStatus: Launching=1, Running=4. Leave Steam's existing workflow
 // visible instead of creating another launch or dismissing its prompts.
 if([1,4].includes(overview?.local_per_client_data?.display_status))return;
 const details=host.appDetailsStore;
 if(typeof details?.BHasRecentlyLaunched!=='function'||typeof details?.MarkAppAsRecentlyLaunched!=='function')
  throw Error('Steam launch workflow unavailable. Use Play on the game details page.');
 // Same order as Steam's native Play handler. Metadata integration observes
 // BHasRecentlyLaunched to preserve shortcut semantics during prelaunch.
 if(details.BHasRecentlyLaunched(appid))return;
 details.MarkAppAsRecentlyLaunched(appid);
 const id=launchGameId(overview);
 if(!id)throw Error('Steam shortcut identity changed.');
 await host.SteamClient.Apps.RunGame(id,'',-1,100);
}
