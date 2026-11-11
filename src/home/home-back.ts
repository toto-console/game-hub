/** Consume only Back that escaped child screens, never global Steam navigation. */
export function connectHomeBackBoundary(root:HTMLElement,isHome:()=>boolean,restore:()=>void){
 const handle=(event:Event)=>{
  const key=event as KeyboardEvent,detail=(event as CustomEvent).detail;
  if(event.type!=='vgp_oncancel'&&key.key!=='Escape'||!isHome()||event.defaultPrevented)return;
  const target=event.target as HTMLElement;
  if(target.closest?.('input,textarea,[contenteditable=true]'))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(!key.repeat&&!detail?.is_repeat)restore();
 };
 root.addEventListener('keydown',handle);root.addEventListener('vgp_oncancel',handle);
 return()=>{root.removeEventListener('keydown',handle);root.removeEventListener('vgp_oncancel',handle);};
}
