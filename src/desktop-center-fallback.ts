/** Use Steam's existing Guide-to-desktop handoff when Roblox has no overlay.
 * No controller polling, game hooks, process changes, or replacement windows.
 */
export function connectDesktopCenterFallback(view: Window, options: {
  enabled: () => boolean;
  running: () => Array<{appid: number|string; display_name: string}>;
  isShortcut: (id: number) => boolean;
  overlays: () => Promise<Array<{appID: number}>>;
  open: () => boolean;
  isOpen: () => boolean;
}) {
  let disposed=false, serial=0, pending=false;
  const lost=()=>{serial++;pending=false;};
  const gained=async(event: Event)=>{
    if((event.target as Window | null)?.document!==view.document||disposed||pending||!options.enabled()||options.isOpen())return;
    const token=++serial;pending=true;
    let timer: ReturnType<typeof setTimeout>|undefined;
    try {
      const candidates=options.running().filter(a=>/^roblox$/i.test(a.display_name.trim())&&options.isShortcut(Number(a.appid)));
      if(candidates.length!==1)return;
      const id=Number(candidates[0].appid);
      const overlays=await Promise.race([options.overlays(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Overlay lookup timed out')),1500);})]);
      if(disposed||token!==serial||!view.document.hasFocus()||!options.enabled()||options.isOpen())return;
      if(overlays.some(o=>Number(o.appID)===id))return;
      if(!options.running().some(a=>Number(a.appid)===id))return;
      options.open();
    } catch { /* Leave the existing Steam menu available when detection fails. */ }
    finally {clearTimeout(timer);if(token===serial)pending=false;}
  };
  view.addEventListener('focus',gained);
  view.addEventListener('blur',lost);
  return ()=>{disposed=true;lost();view.removeEventListener('focus',gained);view.removeEventListener('blur',lost);};
}
