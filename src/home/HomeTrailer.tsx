import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {DialogButton,Focusable,Navigation,useParams} from '@decky/ui';
import Hls from 'hls.js';
import {decky,pluginInventory} from '../decky-adapter';
import {boundedJSON} from '../store-content';
import {mediaItems} from './StoreMedia';
import {motionAllowed} from '../focus-motion';

export const TRAILER_SETTINGS='/game-hub/trailers';
const preference='game-hub.home-trailers';
const change='game-hub:trailer-preferences';

function subscribe(update:()=>void){
 const bus=decky()?.deckyState.eventBus;
 bus?.addEventListener('update',update);
 window.addEventListener(change,update);
 return ()=>{bus?.removeEventListener('update',update);window.removeEventListener(change,update);};
}
function mode(){
 const loader=decky(),state=loader?.deckyState.publicState();
 if(!loader||!state)return 'loading';
 if(state.disabledPlugins.some(p=>p.name==='TrailerHero'))return 'disabled';
 if(loader.plugins.some(p=>p.name==='TrailerHero'))return 'installed';
 if(state.installedPlugins.some(p=>p.name==='TrailerHero'))return 'loading';
 return localStorage.getItem(preference)==='off'?'off':'builtin';
}
export function TrailerSettings(){
 const {appid}=useParams<{appid?:string}>(),provider=useSyncExternalStore(subscribe,mode);
 const entry=provider==='installed'?pluginInventory().find(p=>p.name==='TrailerHero'):undefined;
 return <Focusable className="gh-trailer-settings" flow-children="column" onCancelButton={e=>{e.preventDefault();e.stopPropagation();Navigation.NavigateBack();}}>
  <style>{'.gh-trailer-settings{position:fixed;inset:0;z-index:10;background:#101624;color:white;overflow:auto;padding:4vh max(6vw,calc((100vw - 52rem)/2));box-sizing:border-box}.gh-trailer-settings h1{font-weight:500}.gh-trailer-settings button{margin-block:.25rem}'}</style>
  <h1>TrailerHero</h1>
  {entry?.compatible?<>{appid&&<DialogButton onClick={()=>Navigation.Navigate('/trailerhero/'+appid)}>Trailers for this game</DialogButton>}{entry.content}</>:
   provider==='builtin'||provider==='off'?<DialogButton onClick={()=>{localStorage.setItem(preference,provider==='builtin'?'off':'on');window.dispatchEvent(new Event(change));}}>Home game trailers · {provider==='builtin'?'On':'Off'}</DialogButton>:
   <p>{provider==='disabled'?'TrailerHero is disabled in Decky.':provider==='loading'?'Waiting for Decky to load trailer settings…':'Use the TrailerHero panel in Decky for this version.'}</p>}
  <DialogButton onClick={()=>Navigation.NavigateBack()}>Back</DialogButton>
 </Focusable>;
}

// With the companion installed its existing player owns the wallpaper, including
// custom trailers and audio. The built-in player serves Steam trailers on its own.
export function HomeTrailer({appid}:{appid?:number}){
 const provider=useSyncExternalStore(subscribe,mode),ref=useRef<HTMLVideoElement>(null);
 const [playing,setPlaying]=useState(false);
 useEffect(()=>{
  const el=ref.current;
  if(provider!=='builtin'||!appid||!el||!motionAllowed(el))return;
  let live=true,stream:Hls|undefined;
  const doc=el.ownerDocument;
  const visibility=()=>{if(doc.hidden){el.pause();}else if(el.currentSrc||stream)void el.play().catch(()=>{});};
  const timer=setTimeout(async()=>{
   try{
    const data=await boundedJSON('https://store.steampowered.com/api/appdetails?appids='+appid+'&filters=movies');
    const item=mediaItems(data?.[appid]?.data).find(i=>i.video);
    if(!live||!item)return;
    if(new URL(item.url).pathname.endsWith('.m3u8')&&!el.canPlayType('application/vnd.apple.mpegurl')){
     if(!Hls.isSupported())return;
     stream=new Hls({enableWorker:false,maxBufferLength:15});
     stream.on(Hls.Events.ERROR,(_,error)=>{if(error.fatal){setPlaying(false);stream?.destroy();stream=undefined;}});
     stream.attachMedia(el);stream.loadSource(item.url);
    }else el.src=item.url;
    if(!doc.hidden)await el.play();
   }catch{/* Keep the decoded wallpaper visible if the trailer is unavailable. */}
  },3000);
  doc.addEventListener('visibilitychange',visibility);
  return ()=>{live=false;clearTimeout(timer);doc.removeEventListener('visibilitychange',visibility);stream?.destroy();el.pause();el.removeAttribute('src');el.load();setPlaying(false);};
 },[appid,provider]);
 return provider==='builtin'&&appid?<video aria-hidden="true" muted loop playsInline ref={ref} onPlaying={()=>setPlaying(true)} onError={()=>setPlaying(false)} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none',opacity:playing?1:0,transition:'opacity 600ms ease'}}/>:null;
}
