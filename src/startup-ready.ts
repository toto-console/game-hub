/** Retry transient startup dependencies; dispose cancels retries and stale results. */
export function loadWhenReady<T>(load:()=>Promise<T>,apply:(value:T)=>void,failed:()=>void){
 let active=true,timer:ReturnType<typeof setTimeout>|undefined,delay=500;
 const attempt=async()=>{
  try {const value=await load();if(active)apply(value);}
  catch {if(active){failed();timer=setTimeout(attempt,delay);delay=Math.min(delay*2,5000);}}
 };
 void attempt();
 return()=>{active=false;clearTimeout(timer);};
}

/** A global component can mount before Steam publishes/classifies its window.
 * Return false from bind while its dependencies are still starting. */
export function bindWhenReady<T>(resolve:()=>T|undefined,bind:(owner:T)=>void|false|(()=>void),failed:(error:unknown)=>void=()=>{}){
 let active=true,timer:ReturnType<typeof setTimeout>|undefined,release:void|(()=>void);
 const attempt=()=>{
  if(!active)return;
  try {
   const owner=resolve();
   if(owner){const result=bind(owner);if(result!==false){release=result;return;}}
  } catch(error) {
   // A broken integration must not escape a React layout effect into Steam.
   // Do not retry an exception on a timer; a remount/reload gets a fresh attempt.
   failed(error);return;
  }
  timer=setTimeout(attempt,250);
 };
 attempt();
 return()=>{active=false;clearTimeout(timer);release?.();};
}
