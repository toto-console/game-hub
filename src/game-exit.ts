import {launchGameId} from './home/launch-id';
type RunningApp={appid:number|string;app_type?:number;gameid?:string;m_gameid?:string;GetGameID?:()=>unknown};
type ExitClient={Apps?:{TerminateApp?:(id:string,force:boolean)=>unknown}};
/** Only target the exact running app owned by this overlay. Never fall back to another game. */
export async function requestGameExit(router:{RunningApps?:RunningApp[]},client:ExitClient|undefined,rawAppid:number|string|undefined,overview?:(id:number)=>RunningApp|undefined){
 const normalize=(id:unknown)=>typeof id==='number'?id:typeof id==='string'&&/^\d+$/.test(id)?Number(id):NaN;
 const appid=normalize(rawAppid);
 if(appid>0xffffffff||!Number.isSafeInteger(appid)||!appid||appid<=0)throw Error('The current game could not be identified.');
 if(appid===4732690)throw Error('Endfield does not close reliably through Steam. Return to the game and use its own Quit menu.');
 const running=router.RunningApps?.find(app=>normalize(app.appid)===appid);
 if(!running)throw Error('Steam no longer reports this game as running.');
 const details=overview?.(appid);
 const appType=running.app_type??(normalize(details?.appid)===appid?details?.app_type:undefined);
 if(appType===undefined)throw Error('Steam’s running-game identity is incomplete. Use the original Steam menu.');
 const identity=details&&normalize(details.appid)===appid?details:running;
 const gameid=launchGameId({...identity,appid,app_type:appType,GetGameID:running.GetGameID?()=>running.GetGameID!():identity.GetGameID?()=>identity.GetGameID!():undefined});
 if(!gameid||typeof client?.Apps?.TerminateApp!=='function')throw Error('Steam’s Exit Game action is unavailable. Use the original Steam menu.');
 const result=await client.Apps.TerminateApp(gameid,false);
 if(result===false)throw Error('Steam did not accept the exit request. You can retry or use the original Steam menu.');
}

const pendingExits=new WeakMap<object,Set<number>>();
/** A successful RPC only acknowledges the request; keep the menu until Steam confirms removal. */
export async function exitGameAndConfirm(router:{RunningApps?:RunningApp[]},client:ExitClient|undefined,rawAppid:number|string|undefined,overview?:(id:number)=>RunningApp|undefined){
 const appid=Number(rawAppid);
 const pending=pendingExits.get(router)??new Set<number>();
 if(pending.has(appid))throw Error('An exit request for this game is already pending.');
 pending.add(appid);pendingExits.set(router,pending);
 try{
  await new Promise<void>((resolve,reject)=>{
   let settled=false,accepted=false;
   const finish=(error?:unknown)=>{if(settled)return;settled=true;clearTimeout(deadline);clearInterval(poll);if(error)reject(error);else resolve();};
   const check=()=>{if(!accepted||settled)return;try{const running=router.RunningApps;if(Array.isArray(running)&&!running.some(app=>Number(app.appid)===appid))finish();}catch{/* An unavailable Steam store is not confirmation. */}};
   const deadline=setTimeout(()=>finish(Error('Steam has not confirmed that the game closed. Return to the game and use its own Quit option.')),10000);
   const poll=setInterval(check,250);
   requestGameExit(router,client,rawAppid,overview).then(()=>{accepted=true;check();},finish);
  });
 }finally{pending.delete(appid);if(!pending.size)pendingExits.delete(router);}
}
