import {useEffect,useRef} from 'react';
import {focusControl,type KeyboardBridge} from './navigation';

// Adds only the missing horizontal edges to the existing Decky navigation tree.
export function useFriendsFocus(active:boolean,select:(id:string)=>void,keyboard?:KeyboardBridge,openMenu?:(id:string)=>void){
 const root=useRef<HTMLDivElement>(null);
 const selectRef=useRef(select);selectRef.current=select;
 const menuRef=useRef(openMenu);menuRef.current=openMenu;
 const previous=useRef<{id:string;top:number}|undefined>(undefined);
 useEffect(()=>{
  const el=root.current;if(!active||!el)return;
  let frame=0;
  const list=()=>el.querySelector<HTMLElement>('.gbs-list');
  const rows=()=>Array.from(list()?.querySelectorAll<HTMLElement>('.gbs-friend')??[]);
  const actions=()=>Array.from(el.querySelectorAll<HTMLElement>('.gbs-detail .gbs-actions .gbs-button')).filter(b=>!b.matches(':disabled,[disabled],[aria-disabled="true"]'));
  const remember=(row:HTMLElement)=>{const id=row.querySelector<HTMLElement>('[data-friend-id]')?.dataset.friendId;if(id)previous.current={id,top:list()?.scrollTop??0};return id;};
  const handle=(e:Event)=>{
   if(e.type==='vgp_onmenu'||e.type==='contextmenu'){
    const row=(e.target as HTMLElement).closest<HTMLElement>('.gbs-friend');
    if(row&&list()?.contains(row)&&menuRef.current&&!keyboard?.visible()){
     e.preventDefault();e.stopImmediatePropagation();if((e as CustomEvent).detail?.is_repeat)return;
     const id=remember(row);if(id){selectRef.current(id);menuRef.current(id);}
    }return;
   }
   if(keyboard?.visible())return;
   const target=e.target as HTMLElement;
   if(target.closest('input,textarea,[role="slider"],[contenteditable="true"]'))return;
   const b=(e as CustomEvent).detail?.button,key=(e as KeyboardEvent).key;
   const right=b===12||key==='ArrowRight',left=b===11||key==='ArrowLeft';
   if(!right&&!left)return;
   const row=target.closest<HTMLElement>('.gbs-friend'),all=actions(),index=all.findIndex(button=>button.contains(target));
   if(right&&row&&list()?.contains(row)){
    const id=remember(row);if(!id||!all.length)return;
    e.preventDefault();e.stopImmediatePropagation();
    // Commit the exact row's identity before focusing its newly rendered actions.
    selectRef.current(id);cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>focusControl(actions()[0]));return;
   }
   if(index<0)return;
   e.preventDefault();e.stopImmediatePropagation();
   if(left&&index===0){
    const saved=previous.current;
    const row=rows().find(r=>saved&&r.querySelector<HTMLElement>('[data-friend-id]')?.dataset.friendId===saved.id)??rows().find(r=>r.getAttribute('aria-pressed')==='true');
    if(row){focusControl(row);if(list()&&saved)list()!.scrollTop=saved.top;}
   }else focusControl(all[Math.max(0,Math.min(all.length-1,index+(right?1:-1)))]);
  };
  const focused=(e:Event)=>{const row=(e.target as HTMLElement).closest<HTMLElement>('.gbs-friend');if(row&&list()?.contains(row))remember(row);};
  el.addEventListener('vgp_onmenu',handle,true);el.addEventListener('contextmenu',handle,true);el.addEventListener('vgp_ondirection',handle,true);el.addEventListener('keydown',handle,true);
  el.addEventListener('vgp_onfocus',focused,true);el.addEventListener('focusin',focused,true);
  return()=>{cancelAnimationFrame(frame);el.removeEventListener('vgp_onmenu',handle,true);el.removeEventListener('contextmenu',handle,true);el.removeEventListener('vgp_ondirection',handle,true);el.removeEventListener('keydown',handle,true);el.removeEventListener('vgp_onfocus',focused,true);el.removeEventListener('focusin',focused,true);};
 },[active,keyboard]);
 return root;
}
