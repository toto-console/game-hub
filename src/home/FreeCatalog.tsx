import {StoreAction} from './StoreAction';
import {useEffect,useState} from 'react';
import {Focusable,TextField} from '@decky/ui';
import {pageSize,searchPage} from './store-search';
import {catalogCapsule,freeShelf} from './store-account';
import {StoreCover} from './StoreCover';

const genres=[['All games',''],['Multiplayer','3859'],['Single-player','4182'],['Co-op','1685'],['Shooters','1774'],['RPG','122'],['Strategy','9'],['Sports','701'],['Racing','699']];
const sorts=[['Popular',''],['New releases','Released_DESC'],['Top rated','Reviews_DESC'],['Name','Name_ASC']];
export function FreeCatalog({open,recommended}:{open:(id:number)=>void;recommended:any[]}){
 const [shelves,setShelves]=useState<{label:string;rows:any[]}[]>([]);
 useEffect(()=>{let live=true;
  const now=Math.floor(Date.now()/1000);
  const queries:[string,number[],object][]=[
   ['Popular free games',[],{regional_top_n_sellers:500}],
   ['New free releases',[],{released_only:true,release_date_filter:{start_date:now-90*86400,end_date:now}}],
   ['Upcoming free games',[],{coming_soon_only:true}],
   ...genres.slice(1).map(([name,id]):[string,number[],object]=>[name+' free games',[Number(id)],{}]),
   ['Steam Deck Verified',[],{compatibility_filter:{device:1,categories:[3]}}],
   ['Controller-friendly free games',[7481],{}]
  ];
  void(async()=>{for(const [label,tags,filters] of queries){
   if(!live)return;
   try{const rows=await freeShelf(label,tags,filters);if(live&&rows.length)setShelves(old=>[...old,{label,rows}])}catch{}
  }})();return()=>{live=false};
 },[]);
 const tile=(p:any)=><StoreAction noFocusRing key={p.id} aria-label={p.name} className="cs-game cs-control" focusClassName="cs-focus" onActivate={()=>open(p.id)}><StoreCover id={p.id} name={p.name} capsule={catalogCapsule(p)}/><span>{p.name}</span></StoreAction>;
 const [term,setTerm]=useState(''),[tag,setTag]=useState(''),[sort,setSort]=useState(0);
 const [controller,setController]=useState(false),[deck,setDeck]=useState(false);
 const extraFilters:Record<string,string>={};if(controller)extraFilters.category2='28';if(deck)extraFilters.deck_compatibility='3';
 const [offset,setOffset]=useState(0),[items,setItems]=useState<any[]>([]),[more,setMore]=useState(false),[status,setStatus]=useState(''),[attempt,retry]=useState(0);
 useEffect(()=>{
  let live=true;
  setMore(false);setStatus('Loading free games…');
  if(!offset)setItems([]);
  const timer=setTimeout(async()=>{
   try{
    const {products,more}=await searchPage({category1:'998',tags:['113',tag].filter(Boolean).join(','),maxprice:'free',term,sort_by:sorts[sort][1],...extraFilters},offset);
    const rows=products.filter(p=>p.type===0&&p.is_free);
    if(!live)return;
    setItems(old=>Array.from(new Map([...(offset?old:[]),...rows].map(p=>[p.id,p])).values()));
    setMore(more);
    setStatus(!rows.length&&!offset?'No eligible games on this page.':'');
   }catch{if(live)setStatus('Steam could not load this page.')}
  },180);
  return()=>{live=false;clearTimeout(timer)};
 },[term,tag,sort,offset,attempt,controller,deck]);
 return <section><h2>Browse all free-to-play games</h2><div className="cs-query"><TextField label="Search free games" value={term} onChange={e=>{setOffset(0);setTerm(e.target.value)}}/></div>
 <div className="cs-recent">{genres.map(([label,value])=><StoreAction noFocusRing className="cs-control" key={label} aria-pressed={tag===value} onActivate={()=>{setTag(value);setOffset(0)}}>{label}</StoreAction>)}</div>
 <StoreAction noFocusRing className="cs-control cs-account-action" onActivate={()=>{setSort((sort+1)%sorts.length);setOffset(0)}}>Sort by {sorts[sort][0]}</StoreAction>
 <div className="cs-recent"><StoreAction noFocusRing className="cs-control" aria-pressed={deck} onActivate={()=>{setDeck(!deck);setOffset(0)}}>Deck Verified</StoreAction><StoreAction noFocusRing className="cs-control" aria-pressed={controller} onActivate={()=>{setController(!controller);setOffset(0)}}>Full controller support</StoreAction></div>
 <p role="status">{status}</p><div className="cs-layout five">{items.map(tile)}</div>
 {more&&<StoreAction noFocusRing className="cs-control cs-account-action" onActivate={()=>setOffset(offset+pageSize)}>Load more games</StoreAction>}
 {status.startsWith('Steam could')&&<StoreAction noFocusRing className="cs-control cs-account-action" onActivate={()=>retry(attempt+1)}>Retry</StoreAction>}
 {[{label:'Recommended for you',rows:recommended.filter(p=>p.is_free)},...shelves].filter(group=>group.rows.length).map(group=><section key={group.label}><h2>{group.label}</h2><div className="cs-layout strip">{group.rows.map(tile)}</div></section>)}</section>;
}
