import {useEffect,useRef,useState} from 'react';
import type {WelcomeSettings} from './welcome-layout';
import {heroUrls,type App} from './upstream/steam';
import {motionAllowed} from '../focus-motion';
import {welcomeCSS} from './welcome-style';
function Media({src,animate}:{src:string;animate:boolean}){
 const video=useRef<HTMLVideoElement>(null),canvas=useRef<HTMLCanvasElement>(null);const [failed,setFailed]=useState(false),[frozen,setFrozen]=useState(false);
 const isVideo=src.startsWith('data:video/');
 useEffect(()=>{setFailed(false);setFrozen(false);},[src,animate]);
 useEffect(()=>{const el=video.current;if(!el)return;let stopped=false;
  const update=()=>{if(!animate||el.ownerDocument.hidden)el.pause();else void el.play().catch(()=>{if(!stopped)setFailed(true);});};
  update();el.ownerDocument.addEventListener('visibilitychange',update);return()=>{stopped=true;el.ownerDocument.removeEventListener('visibilitychange',update);el.pause();};
 },[src,animate]);
 if(failed)return <div className="ghw-wallpaper-error">Wallpaper unavailable. Choose another file in Customize Welcome.</div>;
 return isVideo?<video ref={video} src={src} muted loop playsInline autoPlay={animate} preload="auto" onError={()=>setFailed(true)}/>:<>{!frozen&&<img src={src} alt="" onError={()=>setFailed(true)} onLoad={e=>{if(animate)return;const img=e.currentTarget,c=canvas.current;if(c){c.width=Math.min(img.naturalWidth,3840);c.height=Math.round(img.naturalHeight*c.width/img.naturalWidth);c.getContext('2d')?.drawImage(img,0,0,c.width,c.height);setFrozen(true);}}}/>}<canvas ref={canvas} hidden={!frozen}/></>;
}
export function WelcomeBackground({settings,app,home=false,hidden=false,active=true}:{settings:WelcomeSettings;app?:App;home?:boolean;hidden?:boolean;active?:boolean}){
 const root=useRef<HTMLDivElement>(null);
 const [visible,setVisible]=useState(true),[reduced,setReduced]=useState(false);
 useEffect(()=>{const doc=root.current?.ownerDocument;if(!doc)return;const change=()=>setVisible(!doc.hidden),mq=doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)'),motion=()=>setReduced(mq?.matches??false);change();motion();doc.addEventListener('visibilitychange',change);mq?.addEventListener?.('change',motion);return()=>{doc.removeEventListener('visibilitychange',change);mq?.removeEventListener?.('change',motion);};},[]);
 const bg=settings.background==='local'?settings.image:settings.background==='game'&&app?heroUrls(app)[0]:undefined;
 const animate=settings.animateWallpaper!==false&&!settings.reducedMotion&&!reduced;
 // Keep animated media painted during the exit, then release its decoder.
 const [exitingMedia,setExitingMedia]=useState(false);
 useEffect(()=>{
  if(!home||!active||!visible||settings.reducedMotion||!root.current||!motionAllowed(root.current)){
   setExitingMedia(false);
  }else if(!hidden)setExitingMedia(true);
 },[home,hidden,active,visible,settings.reducedMotion,reduced]);
 const moving=bg&&/^data:(video\/|image\/(gif|webp|apng))/.test(bg);
 const showMedia=!moving||(active&&visible&&(!hidden||exitingMedia));
 return <><style>{welcomeCSS}</style>
  <div ref={root} hidden={!active||(!home&&hidden)} data-shown={!hidden} data-motion={!settings.reducedMotion}
   onTransitionEnd={e=>{if(e.target===e.currentTarget&&e.propertyName==='opacity'&&hidden)setExitingMedia(false);}}
   className={`ghw-background ${home?'ghw-home-background':''} ${settings.background==='existing'?'ghw-existing':''}`} aria-hidden="true">
   {bg?(showMedia&&<Media src={bg} animate={animate}/>):<div className="ghw-sculpture"><i/><b/><em/></div>}
  </div></>;
}
