import {StoreAction} from './StoreAction';
import {useEffect,useState,useRef} from 'react';
import {Focusable,TextField} from '@decky/ui';
import {focusNavigation} from '../navigation';
import {searchPage,pageSize} from './store-search';
import {catalogCapsule} from './store-account';
import {StoreCover} from './StoreCover';

let restore:{query:string;limit:number;name:string;scroll:number;free:boolean;order:boolean;filter:string;page:number}|undefined;
export function CatalogSearch({open,discovery,viewed}:{open:(id:number)=>void;discovery:any[];viewed:any[]}){
 const [history,setHistory]=useState<string[]>(()=>{try{return JSON.parse(sessionStorage.getItem('gh-store-searches')||'[]')}catch{return []}});
 const remember=(terms:string[])=>{setHistory(terms);try{sessionStorage.setItem('gh-store-searches',JSON.stringify(terms))}catch{}};
 const [entry]=useState(()=>restore);
 const [filter,setFilter]=useState(entry?.filter||''),[panel,setPanel]=useState(false),[page,setPage]=useState(entry?.page||0);
 const choices:Record<string,Record<string,string>>={'All games':{},'Deck Verified':{deck_compatibility:'3'},'Full controller support':{category2:'28'},'Co-op':{category2:'9'},'VR':{vrsupport:'401'},'Demos':{category1:'10'},'DLC':{category1:'21'},'Early Access':{tags:'493'},'Windows':{os:'win'},'macOS':{os:'mac'},'Linux':{os:'linux'}};


 const [free,setFree]=useState(entry?.free||false),[order,setOrder]=useState(entry?.order||false);
 const advanced=Boolean(filter||free||order);
 const [query,setQuery]=useState(entry?.query||''),[limit,setLimit]=useState(entry?.limit||24),[results,setResults]=useState<{id:number;name:string;free:boolean;image?:string}[]>([]),[status,setStatus]=useState(''),[more,setMore]=useState(false);
 useEffect(()=>{restore=undefined},[]);
 useEffect(()=>{
  if(!entry||!results.length||entry.query!==query)return;
  const target=Array.from(root.current?.querySelectorAll<HTMLElement>('.cs-game')||[]).find(n=>n.getAttribute('aria-label')===entry.name);
  if(target){const parent=target.closest('.cs-scroll');if(parent)parent.scrollTop=entry.scroll;focusNavigation(target);}
 },[results,entry,query]);
 const shown=results;
 const root=useRef<HTMLElement>(null);
 useEffect(()=>{
  let live=true;setResults([]);setMore(false);
  const term=query.trim();setStatus(term.length<2?'Enter at least two characters.':'Searching…');
  if(term.length<2)return;
  const timer=setTimeout(async()=>{
   try{
    if(advanced||page>0||limit===pageSize){
     const {products,more}=await searchPage({term,...choices[filter||'All games'],...(free?{maxprice:'free'}:{}),...(order?{sort_by:'Name_ASC'}:{})},page*pageSize);
     if(live){setResults(products.map(p=>({id:p.id,name:p.name,free:!!p.is_free,image:catalogCapsule(p)})));setMore(more);setStatus(products.length?'':'No matching games.');}return;
    }
    const response=await (window as any).searchstore.FetchSearchSuggestions(term,limit);
    const seen=new Set<number>();const matches=[];
    for(const item of response.items){const id=item.GetAppID();if(!id||seen.has(id))continue;seen.add(id);matches.push({id,name:item.GetName(),free:item.BIsFree(),image:item.GetAssets()?.GetHeaderURL?.()});}
    if(live){setResults(matches);setMore(response.items.length>=limit&&response.total>limit&&limit<120);setStatus(matches.length?'':'No matching games.');}
   }catch{if(live)setStatus('Steam search is unavailable.');}
  },240);
  return()=>{live=false;clearTimeout(timer)};
 },[query,limit,filter,free,order,page]);
 return <section ref={root}><h2>Search</h2><div className="cs-query"><TextField value={query} label="Search Steam" onChange={e=>{setQuery(e.target.value);setLimit(24);setPage(0)}}/></div>
  <div className="cs-recent">{!query&&history.map(term=><StoreAction noFocusRing key={term} className="cs-control" onActivate={()=>{setQuery(term);setPage(0)}}>{term}</StoreAction>)}{!query&&history.length>0&&<StoreAction noFocusRing className="cs-control" onActivate={()=>remember([])}>Clear recent searches</StoreAction>}</div>
 <div className="cs-actions"><StoreAction noFocusRing className="cs-control" onActivate={()=>{setFree(!free);setPage(0)}}>{free?'Free to play':'All prices'}</StoreAction><StoreAction noFocusRing className="cs-control" onActivate={()=>{setOrder(!order);setPage(0)}}>{order?'Sort by name':'Sort by relevance'}</StoreAction><StoreAction noFocusRing className="cs-control" aria-label="Search filters" onActivate={()=>setPanel(!panel)}>{filter||'Filters'}</StoreAction></div>
 {panel&&<div className="cs-recent cs-filter-options">{Object.keys(choices).map(label=><StoreAction noFocusRing key={label} className="cs-control" onActivate={()=>{setFilter(label==='All games'?'':label);setPage(0);setPanel(false);requestAnimationFrame(()=>focusNavigation(root.current?.querySelector('[aria-label="Search filters"]')))}}>{label}</StoreAction>)}</div>}
 <p role="status">{status||(!shown.length&&results.length?'No matches in these results.':'')}</p><div className="cs-layout five">{shown.map(item=><StoreAction noFocusRing key={item.id} aria-label={item.name} className="cs-control cs-game" focusClassName="cs-focus" onActivate={()=>{remember([query,...history.filter(t=>t!==query)].slice(0,10));restore={query,limit,free,order,filter,page,name:item.name,scroll:root.current?.closest(".cs-scroll")?.scrollTop||0};open(item.id)}}><StoreCover {...item} capsule={item.image}/><span>{item.name}</span></StoreAction>)}</div>
 {!query&&[{name:'Recently viewed',rows:viewed},{name:'Recommended for you',rows:discovery}].filter(g=>g.rows.length).map(group=><section key={group.name}><h2>{group.name}</h2><div className="cs-layout five">{group.rows.map(item=><StoreAction noFocusRing key={item.id} className="cs-control cs-game" aria-label={item.name} onActivate={()=>open(item.id)}><StoreCover id={item.id} name={item.name} capsule={catalogCapsule(item)}/><span>{item.name}</span></StoreAction>)}</div></section>)}
 {page>0&&<StoreAction noFocusRing className="cs-control" onActivate={()=>setPage(page-1)}>Previous results</StoreAction>}{more&&<StoreAction noFocusRing className="cs-control" onActivate={()=>{if(!advanced&&limit!==pageSize){setLimit(pageSize);setPage(0)}else setPage(page+1)}}>{!advanced&&limit!==pageSize?"Browse all results":"Next results"}</StoreAction>}</section>;
}


