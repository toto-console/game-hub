import {useEffect,useState,useRef,type ComponentType} from 'react';
import {callable} from '@decky/api';
import type {ButtonProps} from './Panel';

type Bio={status:'ready'|'empty'|'unavailable'|'private'|'retry';text?:string;retryAfter?:number};
const readBio=callable<[steamid:string],Bio>('player_bio');
export function PlayerBio({id,Button}:{id:string;Button?:ComponentType<ButtonProps>}){
 const [bio,setBio]=useState<Bio>();
 const [attempt,setAttempt]=useState(0);
 const RetryButton=Button??'button';
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{let active=true,busy=false,visible=false,failures=0;setBio(undefined);
  const doc=root.current?.ownerDocument??document;
  let retry:ReturnType<typeof setTimeout>|undefined;
  const accept=(value:Bio)=>{if(!active)return;
   if(value.status==='retry'||value.status==='unavailable'){
    failures++;
    setBio(previous=>previous?.status==='ready'?previous:{status:failures>=3?'unavailable':'retry'});
    clearTimeout(retry);if(failures<3)retry=setTimeout(refresh,Math.max(15,Math.min(120,value.retryAfter??30))*1000);
   }else{failures=0;clearTimeout(retry);setBio(value);}
  };
  const refresh=()=>{if(!active||busy||!visible||doc.hidden||failures>=3)return;busy=true;
   void readBio(id).then(accept,()=>accept({status:'retry',retryAfter:15})).finally(()=>{busy=false;});
  };
  let timer:ReturnType<typeof setTimeout>;
  const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);clearTimeout(timer);if(visible)timer=setTimeout(refresh,250);});
  if(root.current)observer.observe(root.current);
  const interval=setInterval(refresh,60000);
  doc.addEventListener('visibilitychange',refresh);
  return()=>{active=false;clearTimeout(timer);clearTimeout(retry);clearInterval(interval);observer.disconnect();doc.removeEventListener('visibilitychange',refresh);};
 },[id,attempt]);
 return <div ref={root} className="gbs-note gbs-player-bio" aria-label="Player bio" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:'18vh',overflowY:'auto'}}>
  <strong>Bio</strong><p style={{margin:'8px 0 0'}}>{!bio?'Loading bio…':bio.status==='ready'?bio.text:bio.status==='empty'?'No bio added.':bio.status==='private'?'This profile’s bio is not public.':bio.status==='unavailable'?'Steam could not load this bio. Try again or use View profile.':'Waiting for Steam… Retrying automatically.'}</p>
  {bio?.status==='unavailable'&&<RetryButton className="gbs-button" onClick={()=>setAttempt(value=>value+1)}>Retry bio</RetryButton>}
 </div>;
}
