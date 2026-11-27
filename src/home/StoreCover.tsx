import {useEffect,useRef,useState} from 'react';
import {storeArtwork} from '../store-content';

type Cover = {background?:string;brand?:string;single?:string};
const covers = new Map<string,Cover>();
const pending = new Map<string,Promise<Cover>>();

async function decoded(url?:string){
 if(!url)return;
 const image=new Image();
 image.src=url;
 try{await image.decode();if(image.naturalWidth&&image.naturalHeight)return image;}catch{}
}

async function resolveCover(id:number,capsule?:string):Promise<Cover>{
 const base=await decoded(capsule);
 if(base&&Math.abs(base.naturalWidth/base.naturalHeight-1)<0.05)return {single:base.src};
 const assets=await storeArtwork(id);
 const [hero,logo]=await Promise.all([decoded(assets.hero),decoded(assets.logo)]);
 if(hero)return {background:hero.src,brand:logo?.src};
 return base?{single:base.src}:{};
}

function loadCover(key:string,id:number,capsule?:string){
 const ready=covers.get(key);
 if(ready)return Promise.resolve(ready);
 const loading=pending.get(key);
 if(loading)return loading;
 const request=resolveCover(id,capsule).then(cover=>{
  if(cover.background||cover.single){
   if(covers.size>=512)covers.delete(covers.keys().next().value!);
   covers.set(key,cover);
  }
  return cover;
 }).finally(()=>pending.delete(key));
 pending.set(key,request);
 return request;
}

// Limit concurrent artwork decodes and discard queued tiles when their route unmounts.
const queue=new Set<()=>Promise<void>>();
let active=0;
function drain(){
 while(active<3&&queue.size){
  const next=queue.values().next().value!;
  queue.delete(next);active++;
  void next().finally(()=>{active--;drain();});
 }
}

export function StoreCover({id,name,capsule}:{id:number;name:string;capsule?:string}){
 const root=useRef<HTMLDivElement>(null);
 const key=JSON.stringify([id,capsule]);
 const [result,setResult]=useState<{key:string;cover:Cover}>();
 const cover=result?.key===key?result.cover:covers.get(key);
 useEffect(()=>{
  const el=root.current;
  if(!el)return;
  const cached=covers.get(key);
  if(cached)return;
  let live=true;
  const fetchCover=async()=>{const cover=await loadCover(key,id,capsule);if(live)setResult({key,cover});};
  const observer=new IntersectionObserver(entries=>{
   if(!entries.some(e=>e.isIntersecting))return;
   observer.disconnect();
   queue.add(fetchCover);drain();
  },{root:el.closest('.cs-scroll'),rootMargin:'120px'});
  observer.observe(el);
  return ()=>{live=false;observer.disconnect();queue.delete(fetchCover);};
 },[key,id,capsule]);
 return <div ref={root} className="cs-cover" style={{backgroundImage:cover?.background?'url("'+cover.background+'")':undefined}}>
 {cover?.single?<><img className="cs-fill" src={cover.single} alt=""/><img className="cs-capsule" src={cover.single} alt=""/></>:cover?.brand?<img className="cs-brand" src={cover.brand} alt=""/>:cover?<b>{name}</b>:null}</div>;
}
