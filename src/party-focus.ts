import {useEffect,useLayoutEffect,useRef} from 'react';
import {focusControl,type KeyboardBridge} from './navigation';
// Only the mounted Party subtree owns these listeners. Sliders keep native directional input.
export function usePartyFocus(view:string,keyboard?:KeyboardBridge){
 const root=useRef<HTMLDivElement>(null);
 const lastFilter=useRef(0);
 const saved=useRef(new Map<string,{key?:string;index:number;top:number}>());
 useEffect(()=>{
  const el=root.current;if(!el)return;
  const left=()=>el.querySelector<HTMLElement>('.gbs-party-card');
  const list=()=>el.querySelector<HTMLElement>('.gbs-party-list');
  const rows=()=>Array.from(left()?.querySelectorAll<HTMLElement>('.gbs-button')??[]);
  const remember=(target:HTMLElement)=>{const row=target.closest<HTMLElement>('.gbs-button');if(row&&left()?.contains(row)){saved.current.set(view,{key:row.querySelector<HTMLElement>('[data-party-key]')?.dataset.partyKey,index:rows().indexOf(row),top:list()?.scrollTop??0});}};
  const focused=(e:Event)=>{
   const target=e.target as HTMLElement,row=target.closest<HTMLElement>('.gbs-party-row'),container=list();
   if(view==='picker'&&row&&container?.contains(row)){
    const bounds=container.getBoundingClientRect(),item=row.getBoundingClientRect();
    if(item.top<bounds.top+6)container.scrollTop-=bounds.top+6-item.top;
    else if(item.bottom>bounds.bottom-6)container.scrollTop+=item.bottom-(bounds.bottom-6);
   }
   remember(target);
  };
  const scroll=()=>{const old=saved.current.get(view);if(old)old.top=list()?.scrollTop??old.top;};
  const handle=(e:Event)=>{
   if(keyboard?.visible())return;
   const target=e.target as HTMLElement;
   if(target.closest('[role="slider"],input[type="range"]'))return;
   const b=(e as CustomEvent).detail?.button,key=(e as KeyboardEvent).key;
   if(e.type==='keydown'&&target.matches('input,textarea'))return;
   let next:HTMLElement|null|undefined;
   const filterRow=el.querySelector('.gbs-picker-filters');
   const filters=Array.from(filterRow?.querySelectorAll<HTMLElement>('.gbs-button')??[]);
   const filterIndex=filters.findIndex(button=>button.contains(target));
   const friendRows=Array.from(list()?.querySelectorAll<HTMLElement>('.gbs-party-row')??[]);
   const right=b===12||key==='ArrowRight',leftward=b===11||key==='ArrowLeft';
   const down=b===10||key==='ArrowDown',up=b===9||key==='ArrowUp';
   // Filter directions belong to this horizontal row, never the column shortcut.
   if(filterIndex>=0&&(right||leftward||down)){
    lastFilter.current=filterIndex;
    e.preventDefault();e.stopImmediatePropagation();
    if(down){const bounds=list()?.getBoundingClientRect();next=friendRows.find(row=>{const box=row.getBoundingClientRect();return bounds&&box.bottom>bounds.top&&box.top<bounds.bottom;})??friendRows[0];}
    else {lastFilter.current=Math.max(0,Math.min(filters.length-1,filterIndex+(right?1:-1)));next=filters[lastFilter.current];}
    if(next)focusControl(next);
    return;
   }
   if(up&&filters.length&&friendRows[0]?.contains(target)){
    e.preventDefault();e.stopImmediatePropagation();
    focusControl(filters[Math.min(lastFilter.current,filters.length-1)]);return;
   }
   if((b===12||key==='ArrowRight')&&left()?.contains(target)){
    remember(target);next=el.querySelector('[data-party-primary]')?.closest<HTMLElement>('.gbs-button');
   }else if((b===11||key==='ArrowLeft')&&target.closest('.gbs-party-side')){
    const old=saved.current.get(view),all=rows();next=all.find(r=>r.querySelector<HTMLElement>('[data-party-key]')?.dataset.partyKey===old?.key&&old?.key!==undefined)??all[old?.index??0]??all[0];
   }else if(e.type==='vgp_onmenu'&&target.closest('.gbs-party-row')?.querySelector('[data-member]')){
    e.preventDefault();e.stopImmediatePropagation();if(!(e as CustomEvent).detail?.is_repeat)target.closest<HTMLElement>('.gbs-button')?.click();return;
   }
   if(next){e.preventDefault();e.stopImmediatePropagation();const top=saved.current.get(view)?.top;focusControl(next);if(left()?.contains(next)&&list()&&top!==undefined)list()!.scrollTop=top;}
  };
  for(const event of ['vgp_ondirection','keydown','vgp_onmenu'])el.addEventListener(event,handle,true);
  el.addEventListener('vgp_onfocus',focused,true);el.addEventListener('focusin',focused,true);el.addEventListener('scroll',scroll,true);
  return()=>{for(const event of ['vgp_ondirection','keydown','vgp_onmenu'])el.removeEventListener(event,handle,true);el.removeEventListener('vgp_onfocus',focused,true);el.removeEventListener('focusin',focused,true);el.removeEventListener('scroll',scroll,true);};
 },[view,keyboard]);
 useLayoutEffect(()=>{const frame=requestAnimationFrame(()=>{const el=root.current;if(!el)return;const all=Array.from(el.querySelectorAll<HTMLElement>('.gbs-party-card .gbs-button'));const old=saved.current.get(view),top=old?.top;const target=all.find(r=>old?.key&&r.querySelector<HTMLElement>('[data-party-key]')?.dataset.partyKey===old.key)??all[old?.index??0]??el.querySelector<HTMLElement>('.gbs-party-side .gbs-button');focusControl(target);const list=el.querySelector('.gbs-party-list');if(list&&top!==undefined)list.scrollTop=top;});return()=>cancelAnimationFrame(frame);},[view]);
 return root;
}
