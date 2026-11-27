import {StoreAction} from './StoreAction';
import {playSound} from '../native-navigation-audio';
import {consoleMotion} from './console-motion';
import {recentApps} from './upstream/steam';
import {FreeCatalog} from './FreeCatalog';
import {MediaViewer,mediaItems} from './StoreMedia';
import {AccountPage,WishAction} from './AccountPage';
import {StoreCover} from './StoreCover';
import {CatalogSearch} from './CatalogSearch';
import {ProductCommunity} from './ProductCommunity';
import {addPackage,catalogItems,region,discoveryItems,catalogCapsule,similarGames,wishlistIds} from './store-account';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Focusable,GamepadButton,Navigation,useParams} from '@decky/ui';
import {MdGames,MdVideogameAsset,MdSportsEsports,MdPlayCircleOutline,MdShoppingBag,MdSearch,MdFavoriteBorder,MdShoppingCart,MdMoreHoriz} from 'react-icons/md';
import {boundedJSON,featuredCategories,loadStore,storeArtwork,type StoreItem} from '../store-content';
import {openGameHubWeb} from '../fullscreen-web';
import {Art} from './upstream/components';
import {bindStoreDirections} from './store-directions';
import {focusNavigation} from '../navigation';
import {focusControl} from '../navigation';
import {motionAllowed} from '../focus-motion';
import {storeStyle} from './console-store-style';

const tabs=['Latest','Collections','Free to Play','Browse'];
const web=(path:string)=>openGameHubWeb('https://store.steampowered.com/'+path,url=>Navigation.NavigateToSteamWeb(url));
function control(label:string,action:()=>void,content:React.ReactNode=label,cls=''){
 return <StoreAction noFocusRing key={label} aria-label={label} className={'cs-control '+cls} focusClassName="cs-focus" onActivate={action}>{content}</StoreAction>;
}
function section(title:string,children:React.ReactNode,layout:string){
 return <section key={title}><h2>{title}</h2><div className={'cs-layout '+layout}>{children}</div></section>;
}
const destinations=[
 ['All games','search/'],['Steam Charts','charts/'],['Upcoming releases','explore/upcoming/'],['Discounts & Events','specials/'],['Discovery Queue','explore/'],['Personalized Calendar','personalcalendar/'],['Genres and tags','tag/browse/'],['Publishers and franchises','curators/'],['Early Access','genre/Early%20Access/'],['Demos','demos/'],['DLC','search/?category1=21'],['Software','software/'],['Soundtracks','soundtracks/'],['Steam Deck','steamdeck/'],['Great on Deck','greatondeck/'],['Controller-friendly','search/?category2=28'],['Hardware','hardware/'],['VR','vr/'],['Co-op','search/?category2=9'],['Multiplayer','search/?category2=1'],['Accessibility','search/?category2=66'],['Steam Curators','curators/'],['News & Updates','news/'],['Points Shop','points/shop/'],['Gift Cards','digitalgiftcards/'],['Store preferences','account/preferences/'],['Subscriptions','search/?category1=10']
];
const collections=[
 {name:'Featured games',feed:'top_sellers'},{name:'Special offers',feed:'specials'},{name:'New releases',feed:'new_releases'}
];
export function ConsoleStore({motion=true}:{motion?:boolean}){
 const route=useParams<{product?:string}>().product,search=route==='search',account=route==='wishlist'||route==='cart';
 const product=Number(route)||0;
 const [tab,setTab]=useState(0),[collection,setCollection]=useState(''),[sorted,setSorted]=useState(false);
 const [items,setItems]=useState<StoreItem[]>([]),[feeds,setFeeds]=useState<Record<string,{items:any[]}>>({});
 const [details,setDetails]=useState<any>(),[art,setArt]=useState<{hero?:string;logo?:string}>({}),[media,setMedia]=useState(''),[error,setError]=useState('');
 const [wishes,setWishes]=useState<any[]>([]),[viewed,setViewed]=useState<any[]>([]);
 useEffect(()=>{let live=true;wishlistIds().then(ids=>catalogItems(ids.map(appid=>({appid})))).then(rows=>{if(live)setWishes(rows)}).catch(()=>{});return()=>{live=false}},[route]);
 useEffect(()=>{let live=true;try{
   const key='gh-viewed-'+(window as any).App.m_CurrentUser.strSteamID;
   const old=JSON.parse(sessionStorage.getItem(key)||'[]');
   const ids:number[]=(product?[product,...old.filter((n:number)=>n!==product)]:old).slice(0,20);
   if(product)sessionStorage.setItem(key,JSON.stringify(ids));
   catalogItems(ids.map(appid=>({appid}))).then(rows=>{if(live)setViewed(rows.filter(p=>p.visible))}).catch(()=>{});
  }catch{}return()=>{live=false}},[product]);
 const [played,setPlayed]=useState<{name:string;items:any[]}>();
 useEffect(()=>{let live=true;const game=recentApps(50).find(p=>p.app_type===1);if(game)similarGames(game.appid).then(items=>{if(live&&items.length)setPlayed({name:game.display_name,items})}).catch(()=>{});return()=>{live=false}},[]);
 const [offer,setOffer]=useState<any>(),[recommended,setRecommended]=useState<any[]>([]);
 useEffect(()=>{let live=true;discoveryItems().then(rows=>{if(live)setRecommended(rows.filter(p=>p.visible&&p.item_type===0))}).catch(()=>{});return()=>{live=false}},[]);
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(root.current)return bindStoreDirections(root.current)},[]);
 useEffect(()=>{
  const frame=requestAnimationFrame(()=>{
   const el=root.current;if(!el)return;
   const next=el.querySelector<HTMLElement>(media?'.cs-viewer':collection?'.cs-scroll .cs-control':product?'.cs-actions .cs-control':search||route==='wishlist'?'.cs-scroll input':route==='cart'?'.cs-scroll .cs-control':'nav .active');
   if(next)focusControl(next);
  });
  return()=>cancelAnimationFrame(frame);
 },[route,product,collection,media,tab,!!details]);
 const scroller=useRef<HTMLDivElement>(null),anchor=useRef<HTMLElement|null>(null);
 useEffect(()=>{let live=true;void loadStore().then(list=>{if(live)setItems(list)});void featuredCategories().then(x=>{if(live)setFeeds(x)}).catch(()=>{});return()=>{live=false}},[]);
 useEffect(()=>{let live=true;setDetails(undefined);setArt({});setError('');setMedia('');
 setOffer(undefined);if(product){void catalogItems([{appid:product}]).then(([p])=>{if(live)setOffer(p)}).catch(()=>{});void storeArtwork(product).then(x=>{if(live)setArt(x)});void boundedJSON('https://store.steampowered.com/api/appdetails?appids='+product+'&cc='+encodeURIComponent(region().COUNTRY)+'&l='+encodeURIComponent(region().LANGUAGE)).then(x=>{if(live){const d=x?.[product]?.data;if(d)setDetails(d);else setError('Game details unavailable')}}).catch(()=>{if(live)setError('Steam could not load this game')});}
 return()=>{live=false}},[product]);
 const mediaAnchor=useRef<HTMLElement|null>(null);
 const closeMedia=()=>{playSound('HideModal');setMedia('');requestAnimationFrame(()=>requestAnimationFrame(()=>focusControl(mediaAnchor.current)))};
 const back=()=>{if(!media)playSound(product?'OutOfGameDetail':'CloseSideMenu');if(media)closeMedia();else if(collection){setCollection('');requestAnimationFrame(()=>anchor.current?.focus())}else Navigation.NavigateBack()};
 const previousTab=useRef(tab);
 useLayoutEffect(()=>{
  const pane=scroller.current;
  root.current?.dispatchEvent(new Event("gh-store-view-change"));
  const direction=Math.sign(tab-previousTab.current);
  previousTab.current=tab;
  if(!pane||!motionAllowed(pane))return;
  const offset=direction?`translateX(${direction*22}px)`:'translateY(14px)';
  const entry=pane.animate([{opacity:.6,transform:offset},{opacity:1,transform:'none'}],
    {duration:consoleMotion.pageMs,easing:consoleMotion.easeOut});
  return ()=>entry.cancel();
 },[tab,route,collection,motion]);
 const change=(i:number)=>{if(i!==tab)playSound('ChangeTabs');setTab(i);setCollection('');scroller.current?.scrollTo(0,0)};
 const scrollMemory=useRef<{top:number;label:string}|null>(null);
 useEffect(()=>{
  const saved=scrollMemory.current;if(product||!saved||!scroller.current)return;
  const target=Array.from(scroller.current.querySelectorAll<HTMLElement>('.cs-control')).find(n=>n.getAttribute('aria-label')===saved.label);
  if(!target)return;
  const frame=requestAnimationFrame(()=>{scroller.current!.scrollTop=saved.top;focusControl(target);scrollMemory.current=null});
  return()=>cancelAnimationFrame(frame);
 },[product,collection,items,feeds]);
 const open=(id:number)=>{playSound('IntoGameDetail');if(scroller.current)scrollMemory.current={top:scroller.current.scrollTop,label:scroller.current.ownerDocument.activeElement?.getAttribute('aria-label')||''};Navigation.Navigate('/game-hub/store/'+id);};
 const grid=(list:any[])=>list.map(item=>control(item.name,()=>open(item.id),<><StoreCover id={item.id} name={item.name} capsule={item.image||catalogCapsule(item)||item.large_capsule_image||item.header_image}/><span>{item.name}</span></>,'cs-game'));
 const pick=(name:string)=>{anchor.current=scroller.current?.ownerDocument.activeElement as HTMLElement;setCollection(name);setSorted(false);scroller.current?.scrollTo(0,0)};
 const groups=collections.map(c=>control(c.name,()=>pick(c.name),<><Art sources={[feeds[c.feed]?.items?.[0]?.large_capsule_image].filter(Boolean)}/><strong>{c.name}</strong></>,'cs-editorial'));
 const feed=feeds[collections.find(c=>c.name===collection)?.feed||'top_sellers']?.items||[];
 const [dlc,setDlc]=useState<any[]>([]);
 useEffect(()=>{let live=true;setDlc([]);if(details?.dlc?.length)void catalogItems(details.dlc.slice(0,50).map((appid:number)=>({appid}))).then(rows=>{if(live)setDlc(rows.filter(x=>x.visible&&x.success===1).map(x=>({id:x.id,name:x.name}))) }).catch(()=>{});return()=>{live=false}},[details]);
 const d=details,gallery=mediaItems(d);
 const cartLock=useRef(false);
 const buy=async(pkg:number)=>{if(cartLock.current)return;cartLock.current=true;try{await addPackage(pkg);Navigation.Navigate('/game-hub/store/cart')}catch(e){setError(String(e))}finally{cartLock.current=false}};
 return <Focusable noFocusRing ref={root} data-motion={motion} className="cs-store" onCancel={back} onButtonDown={e=>{if(!route&&!collection&&e.detail.button===GamepadButton.SECONDARY){e.preventDefault();e.stopPropagation();focusNavigation(root.current?.querySelector('[aria-label="Search"]'));return;}if(!search&&!account&&!product&&!collection&&(e.detail.button===GamepadButton.BUMPER_LEFT||e.detail.button===GamepadButton.BUMPER_RIGHT)){e.preventDefault();e.stopPropagation();change((tab+(e.detail.button===GamepadButton.BUMPER_LEFT?3:1))%4)}}}>
 <style>{storeStyle}</style>{!!product&&art.hero&&<div className="cs-product-backdrop" aria-hidden="true"><img className="cs-bg" src={art.hero} alt=""/></div>}
 <header>{d?<img src={d.header_image}/>:<MdShoppingBag/>}{product?d?.name||'Steam Store':'Steam Store'}</header>
 {!search&&!account&&!product&&!collection&&<nav>{tabs.map((t,i)=>control(t,()=>change(i),t,i===tab?'active':''))}<aside/>{[MdSearch,MdFavoriteBorder,MdShoppingCart,MdMoreHoriz].map((Icon,i)=>control(['Search','Wishlist','Shopping cart','More options'][i],()=>i<3?Navigation.Navigate('/game-hub/store/'+['search','wishlist','cart'][i]):web('account/'),<Icon/>))}</nav>}
 <div className="cs-scroll" ref={scroller} key={product||'store'}>
  {account?<AccountPage key={route} cart={route==='cart'} checkout={()=>web('cart/')}/>:search?<CatalogSearch open={open} discovery={recommended} viewed={viewed}/>:product?<>{d?<><article><small>{d.type}</small>{art.logo?<img className="cs-logo" src={art.logo}/>:<h1>{d.name}</h1>}<p>{d.short_description}</p><div className="cs-actions">{control(offer?.best_purchase_option?.formatted_final_price||(offer?.is_free?'Play on Steam':'View on Steam'),()=>offer?.best_purchase_option?.packageid?void buy(offer.best_purchase_option.packageid):web('app/'+product+'/'))}<WishAction key={product} id={product} name={d.name}/>{control('More options',()=>web('app/'+product+'/discussion/'),'•••')}</div><summary>{d.publishers?.join(', ')}<br/>{d.release_date?.date}</summary></article>
 {error&&<p role="alert">{error}</p>}{section('Media',gallery.map((m,i)=>control(m.name,()=>{mediaAnchor.current=scroller.current?.ownerDocument.activeElement as HTMLElement;playSound('ShowModal');setMedia(String(i+1))},<><img src={m.thumb} alt=""/>{m.video&&<b>Play</b>}</>,m.video?'cs-trailer-preview':'')),'strip')}
 {offer?.purchase_options?.some((s:any)=>s.packageid||s.bundleid)&&section('Choose edition',offer.purchase_options.filter((s:any)=>s.packageid||s.bundleid).map((s:any)=>control([s.purchase_option_name,s.formatted_final_price].filter(Boolean).join(' � '),()=>s.packageid?void buy(s.packageid):web('bundle/'+s.bundleid+'/'))),'cs-editions')}
 {dlc.length>0&&section('Add-ons',grid(dlc),'strip')}<ProductCommunity id={product}/>{section('Game and legal information',<p>{new DOMParser().parseFromString(d.about_the_game||'','text/html').body.textContent}</p>,'legal')}</>:<p>{error||'Loading game…'}</p>}</>:
 collection?<><h1>{collection}</h1>{control('Sort by: '+(sorted?'Name':'Default'),()=>setSorted(!sorted))}{section(collection,grid(sorted?[...feed].sort((a,b)=>a.name.localeCompare(b.name)):feed),'five')}</>:
 tab===0?<>{section("What's hot",grid(items.filter(i=>i.category==='Featured').slice(0,6)),'mosaic')}{section('Coming soon',grid(items.filter(i=>i.category==='Coming soon')),'strip')}{recommended.length>0&&section('Recommended for you',grid(recommended),'strip')}{played&&section('Because you played '+played.name,grid(played.items),'strip')}{collections.map(c=>feeds[c.feed]?.items?.length?section(c.feed==='top_sellers'?'Top sellers':c.name,grid(feeds[c.feed].items.filter(p=>p.type===0)),'strip'):null)}{wishes.some(p=>p.best_purchase_option?.discount_pct>0)&&section('On sale on your wishlist',grid(wishes.filter(p=>p.best_purchase_option?.discount_pct>0)),'strip')}{viewed.length>0&&section('Recently viewed',grid(viewed),'strip')}{section('See more',['Games','Steam Deck','Free to Play','Demos'].map((n,i)=>{const Icon=[MdGames,MdVideogameAsset,MdSportsEsports,MdPlayCircleOutline][i];return control(n,()=>i===2?change(2):web(['search/','steamdeck/','','demos/'][i]),<><Icon/>{n}</>,'cs-category')}),'four')}</>:
 tab===1?<>{section('Featured collections',groups,'three')}{section('Curated by Steam',groups.slice(1),'two')}{section('Explore now',groups.slice(0,1),'banner')}</>:
 tab===2?<FreeCatalog open={open} recommended={recommended}/>:
 <>{section('Browse',groups,'three')}{section('Upcoming releases',grid(items.filter(x=>x.category==='Coming soon')),'strip')}{section('Top sellers',grid((feeds.top_sellers?.items||[]).filter(p=>p.type===0)),'five')}{section('Explore Steam',destinations.map(([label,path])=>control(label,()=>web(path),<><MdShoppingBag/>{label}</>,'cs-category')),'four')}</>}
 </div>{media&&<MediaViewer items={gallery} index={Number(media)-1} select={n=>setMedia(String(n+1))} close={closeMedia}/>}</Focusable>;
}




