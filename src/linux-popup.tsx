import {toaster} from '@decky/api';
import psMark from '../third_party/playhub-notifications/assets/brands/playstation-white.png';

export type PopupPayload = {kind:string; title:string; body:string; subtitle?:string; image?:string};
export function linuxPopupAvailable() {
  return /Linux.*x86_64/i.test(navigator.platform) && typeof toaster?.toast === 'function'
    && typeof (window as any).NotificationStore?.ProcessNotification === 'function';
}
export function showLinuxPopup(notice:PopupPayload) {
  if (!linuxPopupAvailable()) return {ok:false,queued:false};
  const duration=notice.kind==='achievement'?6000:5500;
  const art=/^https:\/\//i.test(notice.image||'') ? notice.image : undefined;
  toaster.toast({
    title: <span style={{fontWeight:600,color:'#fff'}}>{notice.title}</span>,
    body: <span style={{color:'#d4d9e3'}}>{notice.body || notice.subtitle}</span>,
    logo: <span style={{display:'grid',placeItems:'center',width:'3rem',height:'3rem',background:'#161923',borderRadius:10}}>
      <img alt="" src={art || psMark} style={{maxWidth:'85%',maxHeight:'85%'}} onError={event=>{event.currentTarget.onerror=null;event.currentTarget.src=psMark}}/>
    </span>,
    duration, expiration:duration+1000, playSound:false
  });
  const cue=notice.kind==='achievement'||notice.kind==='message'?notice.kind:'system';
  const audio=new Audio('http://127.0.0.1:1337/plugins/Game%20Base%20Social/assets/notifications/'+cue+'.wav');
  audio.volume=.72;
  void audio.play().catch(()=>{});
  return {ok:true,queued:true};
}
