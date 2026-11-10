import {useEffect,useLayoutEffect,useRef,type RefObject} from 'react';
import {focusControl,type KeyboardBridge} from './navigation';
import {adjacentTab,bumperDirection,BumperLatch} from './tab-input';
import type {HubTab} from './Panel';

const scrollSelectors=['.gbs-list','.gbs-conversation-list','.gbs-party-list','.gbs-settings','.gbs-shell'];
type Memory={key:string;scroll:number[]};
function key(el:Element){const id=el.querySelector('[data-friend-id],[data-chat-id],[data-party-key]');return id?JSON.stringify(Array.from(id.attributes).filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value])):el.textContent?.trim()??'';}
export function useTabNavigation(root:RefObject<HTMLDivElement|null>,tab:HubTab,tabs:HubTab[],change:(tab:HubTab)=>void,blocked:boolean,keyboard?:KeyboardBridge){
 const state=useRef({tab,tabs,change,blocked});state.current={tab,tabs,change,blocked};
 const memory=useRef(new Map<HubTab,Memory>());
 const restoring=useRef(false);const pending=useRef(false);
 useEffect(()=>{
  const el=root.current;if(!el)return;
  const latch=new BumperLatch();
  const owned=()=>!state.current.blocked&&!keyboard?.visible()&&
   !el.querySelector('.fp-screen[data-nested="true"],.gbs-messages[data-open="true"],.gbs-messages[data-picking="true"],.gbs-party:not([data-view="list"]),[role="dialog"],[role="menu"],[role="listbox"],[aria-expanded="true"]');
  const remember=()=>{if(restoring.current)return;const old=memory.current.get(state.current.tab);const active=el.ownerDocument.activeElement;
   memory.current.set(state.current.tab,{key:active&&el.contains(active)?key(active):old?.key??'',scroll:scrollSelectors.map(s=>el.querySelector(s)?.scrollTop??0)});
  };
  const down=(event:Event)=>{
   const e=event as CustomEvent<{button:number;is_repeat?:boolean}>;const direction=bumperDirection(e.detail?.button);
   if(!direction||!owned())return;
   e.preventDefault();e.stopImmediatePropagation();
   if(!latch.press(e.detail.button,e.detail.is_repeat))return;
   const next=adjacentTab(state.current.tabs,state.current.tab,direction);
   if(next!==state.current.tab){remember();pending.current=true;state.current.change(next);}
  };
  const up=(event:Event)=>{const e=event as CustomEvent<{button:number}>;if(!bumperDirection(e.detail?.button))return;latch.release(e.detail.button);if(owned()){e.preventDefault();e.stopImmediatePropagation();}};
  const unsubscribe=keyboard?.subscribe(()=>latch.clear());
  el.addEventListener('vgp_onbuttondown',down,true);el.addEventListener('vgp_onbuttonup',up,true);
  el.addEventListener('scroll',remember,true);
  return()=>{unsubscribe?.();el.removeEventListener('vgp_onbuttondown',down,true);el.removeEventListener('vgp_onbuttonup',up,true);el.removeEventListener('scroll',remember,true);};
 },[root,keyboard]);
 useLayoutEffect(()=>{
  if(!pending.current)return;pending.current=false;
  restoring.current=true;let second=0;
  const first=requestAnimationFrame(()=>{second=requestAnimationFrame(()=>{
   const el=root.current;if(!el)return;const saved=memory.current.get(tab);
   const target=saved&&Array.from(el.querySelectorAll<HTMLElement>('.gbs-button')).find(e=>!e.hasAttribute('disabled')&&key(e)===saved.key);
   focusControl(target||el.querySelector<HTMLElement>('.gbs-tab[aria-pressed="true"]'));
   if(saved)scrollSelectors.forEach((s,i)=>{const area=el.querySelector<HTMLElement>(s);if(area)area.scrollTop=saved.scroll[i];});
   restoring.current=false;
  });});
  return()=>{cancelAnimationFrame(first);cancelAnimationFrame(second);restoring.current=false;};
 },[tab,root]);
}
