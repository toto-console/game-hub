import {useEffect, useRef} from 'react';

export type KeyboardBridge = { visible:()=>boolean; hide:()=>void; subscribe:(fn:(open:boolean)=>void)=>()=>void };
let navigationSound=()=>{};
export function setNavigationSound(play:()=>void){navigationSound=play;}
export function focusControl(element:HTMLElement|null|undefined,nativeFirst=false) {
  if(!element?.isConnected)return;
  const request=()=>{const EventClass=element.ownerDocument.defaultView?.CustomEvent;
    if(EventClass)element.dispatchEvent(new EventClass('vgp_requestfocus',{bubbles:true,cancelable:true,detail:{button:0,source:1,is_repeat:false}}));};
  // DOM focus first classifies the change as browser input, suppressing Steam's navigation sound.
  if(nativeFirst){if(element.ownerDocument.activeElement===element)return;request();if(element.ownerDocument.activeElement!==element)element.focus({preventScroll:true});}
  else {element.focus({preventScroll:true});request();}
  if(nativeFirst)navigationSound();
}
export function focusNavigation(element:HTMLElement|null|undefined){focusControl(element,true);}
export function useRoomNavigation(back:()=>void,keyboard?:KeyboardBridge) {
  const root=useRef<HTMLDivElement>(null);const action=useRef(back);action.current=back;
  useEffect(()=>{
    const el=root.current;if(!el)return;
    let lastBack=0,closedAt=0,restore=false,frame=0;
    const cancel=(e:Event)=>{e.preventDefault();e.stopImmediatePropagation();};
    const unsubscribe=keyboard?.subscribe(open=>{
      if(open){restore=!!el.querySelector('.gbs-composer');return;}
      closedAt=Date.now();
      if(restore){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>focusControl(el.querySelector<HTMLElement>('.gbs-composer input')));restore=false;}
    });
    const handle=(e:Event)=>{
      if((e.target as HTMLElement).closest?.('[data-player-discovery]'))return;
      const key=e as KeyboardEvent;
      if(e.type==='keydown'&&key.key!=='Escape')return;
      cancel(e);
      if(key.repeat||(e as CustomEvent).detail?.is_repeat)return;
      const now=Date.now();
      if(keyboard?.visible()){keyboard.hide();closedAt=now;return;}
      if(now-closedAt<250||now-lastBack<180)return;
      lastBack=now;action.current();
    };
    el.addEventListener('keydown',handle,true);el.addEventListener('vgp_oncancel',handle,true);
    return()=>{unsubscribe?.();cancelAnimationFrame(frame);el.removeEventListener('keydown',handle,true);el.removeEventListener('vgp_oncancel',handle,true);};
  },[keyboard]);
  return root;
}
