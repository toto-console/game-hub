import {useState,useRef,useLayoutEffect,useEffect,type Dispatch,type SetStateAction,type RefObject} from 'react';
import {focusControl} from './navigation';
const live=new Map<string,()=>unknown>(),saved=new Map<string,unknown>();
let pending=false,returning=false,historyOwner:unknown;const captures=new Set<()=>void>();
export function beginProfileReturn(){if(pending)return;pending=true;saved.clear();for(const [k,get] of live)saved.set(k,get());captures.forEach(fn=>fn());}
export function returningFromProfile(){return returning;}
export function clearProfileReturn(){pending=false;returning=false;historyOwner=undefined;saved.clear();}
export function useProfileState<T>(key:string,initial:T|(()=>T)):[T,Dispatch<SetStateAction<T>>];
export function useProfileState<T=undefined>(key:string):[T|undefined,Dispatch<SetStateAction<T|undefined>>];
export function useProfileState<T=undefined>(key:string,initial?:T|(()=>T)):[T,Dispatch<SetStateAction<T>>]{
 const [value,set]=useState<T>(()=>{if(returning&&saved.has(key)){const value=saved.get(key) as T;saved.delete(key);return value;}return typeof initial==='function'?(initial as ()=>T)():initial as T;});
 const latest=useRef(value);latest.current=value;
 useLayoutEffect(()=>{const get=()=>latest.current;live.set(key,get);return()=>{if(live.get(key)===get)live.delete(key);};},[key]);return [value,set];
}
export function useProfileRef<T>(key:string,initial:T){const [value]=useProfileState(key,()=>({current:initial}));return value;}
export function useProfileFocus(root:RefObject<HTMLElement|null>,key:string){
 useLayoutEffect(()=>{const capture=()=>{const el=root.current;if(!el)return;const nodes=Array.from(el.querySelectorAll<HTMLElement>('*'));saved.set(key,{focus:nodes.indexOf(el.ownerDocument.activeElement as HTMLElement),scroll:nodes.map((n,i)=>({i,top:n.scrollTop,left:n.scrollLeft})).filter(s=>s.top||s.left)});};captures.add(capture);return()=>{captures.delete(capture);};},[root,key]);
 useEffect(()=>{if(!returning)return;const state=saved.get(key) as {focus:number;scroll:{i:number;top:number;left:number}[]}|undefined;if(!state)return;saved.delete(key);let frame=0,remaining=3;const restore=()=>{if(--remaining){frame=requestAnimationFrame(restore);return;}const nodes=Array.from(root.current?.querySelectorAll<HTMLElement>('*')??[]);focusControl(nodes[state.focus]);for(const s of state.scroll){const n=nodes[s.i];if(n){n.scrollTop=s.top;n.scrollLeft=s.left;}}};frame=requestAnimationFrame(restore);return()=>cancelAnimationFrame(frame);},[root,key]);
}
export function connectProfileReturn(main:unknown,reopen:()=>void,isCenter:()=>boolean,account:()=>unknown=()=>undefined){
 const m=main as {LocationPathName:string;m_history?:{listen:(fn:(location:{pathname:string},action:string)=>void)=>()=>void}}|undefined;
 let origin='',center=false,entered=false,frame=0,owner:unknown;const before=()=>{if(!m)throw Error('Steam profile window is not ready.');if(!pending){origin=m.LocationPathName;center=isCenter();entered=false;owner=account();historyOwner=main;}beginProfileReturn();};
 const stop=m?.m_history?.listen((location,action)=>{if(historyOwner!==main)return;if(!pending){if(returning&&location.pathname!==origin){cancelAnimationFrame(frame);clearProfileReturn();}return;}if(location.pathname==='/steamweb'){entered=true;return;}if(!entered){if(location.pathname!==origin)clearProfileReturn();return;}if(action!=='POP'||location.pathname!==origin||account()!==owner){clearProfileReturn();return;}pending=false;returning=true;frame=requestAnimationFrame(()=>{if(center)reopen();});});
 return {begin:before,cancel(){if(historyOwner!==main)return;clearProfileReturn();if(center)reopen();},dispose(){stop?.();cancelAnimationFrame(frame);if(historyOwner===main)clearProfileReturn();}};
}
