import {playSound} from '../native-navigation-audio';
import {StoreAction} from './StoreAction';
import {useEffect,useRef,useState} from 'react';
import {Focusable,Navigation,TextField} from '@decky/ui';
import {addPackage,catalogCapsule,catalogItems,readCart,removeLine,setWish,wishlistIds} from './store-account';
import {focusNavigation} from '../navigation';
import {StoreCover} from './StoreCover';
const message=(e:unknown)=>e instanceof Error?e.message:'Steam is unavailable';
function action(label:string,fn:()=>void,disabled=false){
 return <StoreAction noFocusRing key={label} className="cs-control cs-account-action" focusClassName="cs-focus" aria-disabled={disabled} onActivate={()=>{if(!disabled)fn()}}>{label}</StoreAction>;
}
export function WishAction({id,name}:{id:number;name:string}){
 const [has,setHas]=useState<boolean>(),[notice,notify]=useState(''),lock=useRef(false);
 useEffect(()=>{let live=true;setHas(undefined);notify('');wishlistIds().then(ids=>{if(live)setHas(ids.includes(id))}).catch(e=>{if(live)notify(message(e))});return()=>{live=false}},[id]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>notify(''),3200);return()=>clearTimeout(timer)},[notice]);
 const toggle=async()=>{if(lock.current||has===undefined)return;lock.current=true;try{await setWish(id,!has);setHas(!has);notify(name+(has?' removed from wishlist':' added to wishlist'));}catch(e){notify(message(e))}finally{lock.current=false}};
 return <>{action(has?'Wishlisted ✓':'Wishlist +',toggle,has===undefined)}{notice&&<output role="status" className="cs-toast">{notice}</output>}</>;
}
let wishlistReturn:{id:number;top:number;query:string;sort:boolean}|undefined;
export function AccountPage({cart,checkout}:{cart:boolean;checkout:()=>void}){
 const [entry]=useState(()=>cart?undefined:wishlistReturn);
 const grid=useRef<HTMLDivElement>(null);
 const [rows,setRows]=useState<any[]>([]),[status,setStatus]=useState('Loading…'),[query,setQuery]=useState(entry?.query||''),[sort,setSort]=useState(entry?.sort||false),[revision,refresh]=useState(0),busy=useRef(false);
 useEffect(()=>{let live=true;setStatus('Loading…');
  void(async()=>{
   const lines=cart?await readCart():[];
   const ids=cart?lines.map((l:any)=>l.bundleid?{bundleid:l.bundleid}:{packageid:l.packageid}):(await wishlistIds()).map(appid=>({appid}));
   const products=await catalogItems(ids);
   const result=cart?lines.map((l:any)=>({...products.find(p=>p.id===(l.bundleid||l.packageid)&&p.item_type===(l.bundleid?2:1)),line:l})):products.filter(p=>p.success===1&&p.visible!==false);
   if(live){setRows(result);setStatus(result.length?'':cart?'Your cart is empty.':'Your wishlist is empty.');}
  })().catch(e=>{if(live)setStatus(message(e))});return()=>{live=false};
 },[cart,revision]);
 useEffect(()=>{
  if(!entry||!rows.length||wishlistReturn!==entry)return;
  const node=grid.current?.querySelector<HTMLElement>('[data-wish-id="'+entry.id+'"]'),scroll=node?.closest('.cs-scroll');
  if(node&&scroll){focusNavigation(node);scroll.scrollTop=entry.top;}
  wishlistReturn=undefined;
 },[entry,rows]);
 const mutate=async(fn:()=>Promise<unknown>)=>{if(busy.current)return;busy.current=true;try{await fn();refresh(v=>v+1)}catch(e){setStatus(message(e))}finally{busy.current=false}};
 const list=rows.filter(x=>!query||x.name?.toLowerCase().includes(query.toLowerCase()));if(sort)list.sort((a,b)=>(a.name||'').localeCompare(b.name||''));
 return <section><h2>{cart?'Shopping cart':'Wishlist'}</h2>{!cart&&<><TextField label="Search wishlist" value={query} onChange={e=>setQuery(e.target.value)}/>{action(sort?'Sort by name':'Sort by wishlist order',()=>setSort(!sort))}</>}<p role="status">{status}</p>
 <div ref={grid} className={cart?'cs-cart-list':'cs-account-grid'}>{list.map(p=><div key={p.line?.line_item_id||p.id}>
 {!cart&&<StoreAction noFocusRing data-wish-id={p.id} className="cs-control cs-account-art" aria-label={p.name} focusClassName="cs-focus" onActivate={()=>{playSound('IntoGameDetail');wishlistReturn={id:p.id,top:grid.current?.closest('.cs-scroll')?.scrollTop||0,query,sort};Navigation.Navigate('/game-hub/store/'+p.id)}}><StoreCover id={p.id} name={p.name} capsule={catalogCapsule(p)}/></StoreAction>}
 <h3>{p.name||'Unavailable item'}</h3><p>{cart?p.line?.price_when_added?.formatted_amount:p.best_purchase_option?.formatted_final_price}</p>
 {cart?action('Remove from cart',()=>mutate(()=>removeLine(p.line.line_item_id))):<>{!!p.best_purchase_option?.packageid&&action('Add to cart',()=>mutate(()=>addPackage(p.best_purchase_option.packageid)))}{action('Remove from wishlist',()=>mutate(()=>setWish(p.id,false)))}</>}</div>)}</div>
 {cart&&rows.length>0&&action('Continue to Steam checkout',checkout)}</section>;
}


