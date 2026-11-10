/** Observe accepted Back input without changing navigation or handling the button twice. */
export function connectBackAudio(doc:Document,enabled:()=>boolean,play:(kind:'CloseSideMenu'|'OutOfGameDetail')=>void){
 const win=doc.defaultView;if(!win)return()=>{};
 let disposed=false,last=-Infinity;
 const scopes='.gh-home-module,#game-hub-control-center,.gbs-root,.gbs-room,.gh-music-route,.gh-media-manager,.ghl-root,.gh-detail,.gh-welcome';
 const observe=(e:Event)=>{
  const key=e as KeyboardEvent,detail=(e as CustomEvent).detail;
  if(e.type==='keydown'&&key.key!=='Escape'||key.repeat||detail?.is_repeat||!enabled())return;
  const target=e.target as HTMLElement;
  if(!target?.closest?.(scopes))return;
  const kind=target.closest('.gh-detail')?'OutOfGameDetail':'CloseSideMenu';
  // Capture before custom handlers stop propagation; inspect acceptance after dispatch.
  queueMicrotask(()=>{
   if(disposed||!enabled()||!e.defaultPrevented)return;
   const now=performance.now();if(now-last<100)return;last=now;
   play(kind);
  });
 };
 win.addEventListener('keydown',observe,true);win.addEventListener('vgp_oncancel',observe,true);
 return()=>{disposed=true;win.removeEventListener('keydown',observe,true);win.removeEventListener('vgp_oncancel',observe,true);};
}
