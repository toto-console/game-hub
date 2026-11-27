import {useEffect,useState} from 'react';
import {Focusable} from '@decky/ui';
import {Art,Button,FOCUSED_CLASS,useFocusHook} from './upstream/components';
import {openStore} from './upstream/steam';
import {loadStore,storeArtwork,type StoreItem} from '../store-content';
import {movedPointer} from './pointer-intent';

const asset=(id:number,file:string)=>`https://shared.steamstatic.com/store_item_assets/steam/apps/${id}/${file}`;

function Featured({item,select}:{item:StoreItem;select:(item:StoreItem)=>void}){
 const ref=useFocusHook(()=>select(item));
 return <Focusable ref={ref} aria-label={item.name} className="gh-store-card" focusClassName={FOCUSED_CLASS} noFocusRing
  onMouseMove={e=>{if(movedPointer(e))select(item);}} onActivate={()=>openStore(`app/${item.id}/`)}>
  <Art sources={item.image?[item.image]:[]} fallback={item.name}/>
 </Focusable>;
}
export function StorePreview({onHero,onFocus}:{onHero:(urls:string[])=>void;onFocus:()=>void}){
 const [items,setItems]=useState<StoreItem[]>([]),[selected,setSelected]=useState<StoreItem>();
 const [brand,setBrand]=useState<{id:number;logo?:string}>();
 useEffect(()=>{
  let live=true;
  const refresh=()=>loadStore().then(list=>{
   if(live){setItems(list);setSelected(old=>list.find(i=>i.id===old?.id)??list[0]);}
  });
  void refresh();
  const timer=setInterval(refresh,15*60_000);
  return()=>{live=false;clearInterval(timer);};
 },[]);
 useEffect(()=>{
  if(!selected){onHero([]);return;}
  let live=true;
  const hero=asset(selected.id,'library_hero.jpg');
  const fallbacks=selected.image?[hero,selected.image]:[hero];
  onHero(fallbacks);
  void storeArtwork(selected.id).then(art=>{
   if(!live)return;
   setBrand({id:selected.id,logo:art.logo});
   if(art.hero)onHero([art.hero,...fallbacks]);
  });
  return()=>{live=false;};
 },[selected,onHero]);
 return <div className="ghd-info gh-store-info"><style>{storeCSS}</style>
  <Focusable className="ghd-buttons gh-store-brand" flow-children="row">
   <Button label={selected?`View ${selected.name} in Store`:'Open Steam Store'} onFocus={onFocus}
    onActivate={()=>openStore(selected?`app/${selected.id}/`:'')}>
    {selected?<Art sources={[...(brand?.id===selected.id&&brand.logo?[brand.logo]:[]),asset(selected.id,'logo.png')]} fallback={selected.name}/>:'Steam Store'}
   </Button>
  </Focusable>
  {!!items.length&&<section><h2>Must see</h2><Focusable className="ghd-row gh-store-row" flow-children="row">
   {items.slice(0,6).map(item=><Featured key={item.id} item={item} select={setSelected}/>)}
  </Focusable></section>}
 </div>;
}
const storeCSS=`
.gh-store-info{width:84vw;margin-left:2.5vw}.gh-store-brand{margin-top:7vh}
.gh-store-brand .ghd-button{display:flex;justify-content:flex-start;width:35vw;height:28vh;max-width:none;padding:0;background:transparent;color:white;font-size:3vw;text-shadow:0 2px 8px #000;border-radius:.4vw}
.gh-store-brand img{width:100%;height:100%;object-fit:contain;object-position:left center;filter:drop-shadow(0 2px 5px #0007)}
.gh-store-info section{margin-top:3vh}
.gh-store-info h2{font-size:1.2vw;font-weight:400;margin:0 0 1vh}
.gh-store-row{display:flex;gap:1.65vw;padding:.5vh .3vw 1vh;overflow-x:auto;scrollbar-width:none;max-width:82vw}
.gh-store-card{flex:0 0 12.35vw;height:12.5vh;overflow:hidden;background:#12233a;cursor:pointer}
.gh-store-card>img{width:100%;height:100%;object-fit:cover}
.gh-store-card.ghd-focused{outline:2px solid white;outline-offset:2px}`;
