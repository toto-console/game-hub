import {useEffect,useRef,useState} from 'react';
import {findModuleExport} from '@decky/ui';
type Media={image?:string;videos:string[]};
const cache=new Map<string,{at:number;value:Media}>();
async function equipped(id:string):Promise<Media>{
 const host=window as unknown as {userProfileStore?:{GetEquippedProfileItemsForUser:(id:{ConvertTo64BitString:()=>string})=>Promise<{mini_profile_background?:{image_large?:string;movie_webm?:string;movie_mp4?:string}}>} };
 const hit=cache.get(id);if(hit&&Date.now()-hit.at<120000)return hit.value;
 if(!/^\d{17}$/.test(id)||!host.userProfileStore)return {videos:[]};
 const data=await host.userProfileStore.GetEquippedProfileItemsForUser({ConvertTo64BitString:()=>id});
 const config=findModuleExport((v:unknown)=>!!v&&typeof v==='object'&&typeof (v as {MEDIA_CDN_COMMUNITY_URL?:unknown}).MEDIA_CDN_COMMUNITY_URL==='string');
 const url=(path?:string)=>{try{if(!path)return;const u=new URL(path.startsWith('https://')?path:config.MEDIA_CDN_COMMUNITY_URL+'images/'+path);if(u.protocol==='https:'&&!u.username&&!u.password&&(u.hostname.endsWith('.steamstatic.com')||u.hostname.endsWith('.steamusercontent.com')))return u.href;}catch{}};
 const item=data?.mini_profile_background,value={image:url(item?.image_large),videos:[url(item?.movie_webm),url(item?.movie_mp4)].filter((v):v is string=>!!v)};
 cache.set(id,{at:Date.now(),value});if(cache.size>40)cache.delete(cache.keys().next().value!);return value;
}
export function MiniProfile({id,motion}:{id:string;motion:boolean}){
 const [media,setMedia]=useState<Media>({videos:[]}),[failed,setFailed]=useState(false),[ready,setReady]=useState(false),[reduced,setReduced]=useState(true);const video=useRef<HTMLVideoElement>(null),layer=useRef<HTMLDivElement>(null);
 useEffect(()=>{let alive=true;const timer=setTimeout(()=>{equipped(id).then(v=>{if(alive)setMedia(v);}).catch(()=>{});},180);return()=>{alive=false;clearTimeout(timer);};},[id]);
 useEffect(()=>{const q=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReduced(q.matches);update();q.addEventListener('change',update);return()=>q.removeEventListener('change',update);},[]);
 const animate=motion&&!reduced&&!failed&&media.videos.length>0;
 useEffect(()=>{const el=video.current,box=layer.current;if(!el||!box)return;const doc=el.ownerDocument;let visible=true;const sync=()=>{if(doc.hidden||!visible)el.pause();else {el.muted=true;el.play().catch(()=>setFailed(true));}};const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;sync();});observer.observe(box);doc.addEventListener('visibilitychange',sync);sync();return()=>{observer.disconnect();doc.removeEventListener('visibilitychange',sync);el.pause();el.removeAttribute('src');el.querySelectorAll('source').forEach(s=>s.removeAttribute('src'));el.load();};},[animate,media]);
 return <div ref={layer} className="gbs-mini" aria-hidden="true"><style>{`.gbs-root .gbs-detail{position:relative;isolation:isolate;overflow:hidden}.gbs-root .gbs-mini{position:absolute;inset:0;z-index:-1;pointer-events:none;background:#171b21}.gbs-mini img,.gbs-mini video{width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 200ms ease}.gbs-mini[data-ready]{} .gbs-mini .ready{opacity:.65}.gbs-mini:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#11151bd9,#11151b80),linear-gradient(0deg,#11151bd9,transparent 65%)}@media(prefers-reduced-motion:reduce){.gbs-mini img,.gbs-mini video{transition:none}}`}</style>{animate?<video ref={video} className={ready?'ready':''} muted autoPlay loop playsInline preload="metadata" poster={media.image} onCanPlay={()=>setReady(true)} onError={()=>{setFailed(true);setReady(false);}}>{media.videos.map(src=><source key={src} src={src} type={src.includes('.webm')?'video/webm':'video/mp4'}/>)}</video>:media.image?<img className={ready?'ready':''} src={media.image} alt="" onLoad={()=>setReady(true)} onError={()=>setReady(false)}/>:null}</div>;
}
