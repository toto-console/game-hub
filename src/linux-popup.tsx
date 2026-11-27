import {toaster} from '@decky/api';
import psMark from '../third_party/playhub-notifications/assets/brands/playstation-black.png';

const popupStyle = `
.DeckyGamepadUIPopupToast.gh-ps5-popup {
  position:relative; box-sizing:border-box; padding:.7rem 3.75rem .7rem .85rem;
  border:0; border-radius:1rem; color:white;
  background:linear-gradient(105deg,#23252bf8,#2a2c33f8);
  animation:gh-ps5-enter .38s cubic-bezier(.22,1,.36,1) both,
            gh-ps5-exit .3s ease-in calc(var(--toast-duration,5500ms) - .35s) forwards;
}
.gh-ps5-badge { display:none }
.gh-ps5-popup.DeckyGamepadUIPopupToast .gh-ps5-badge {
  display:grid; place-items:center; position:absolute; right:.9rem; top:50%;
  width:2rem; height:2rem; margin-top:-1rem; border-radius:50%; background:white;
  animation:gh-ps5-badge .36s ease-out .4s both;
}
.gh-ps5-badge img { width:68%; height:auto }
@keyframes gh-ps5-enter { from {opacity:0;transform:translateX(1rem)} to {opacity:1;transform:none} }
@keyframes gh-ps5-exit { to {opacity:0;transform:translateX(.75rem)} }
@keyframes gh-ps5-badge { from {opacity:0;transform:scale(.72)} to {opacity:1;transform:scale(1)} }
@media (prefers-reduced-motion:reduce) {
  .DeckyGamepadUIPopupToast.gh-ps5-popup,.gh-ps5-popup.DeckyGamepadUIPopupToast .gh-ps5-badge { animation:none }
}`;

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
    className:'gh-ps5-popup',
    title: <span style={{fontWeight:600,color:'#fff'}}>{notice.title}<style>{popupStyle}</style><span aria-hidden="true" className="gh-ps5-badge"><img src={psMark} alt=""/></span></span>,
    body: <span style={{color:'#d4d9e3'}}>{notice.kind==='achievement'?'Trophy earned!':notice.body || notice.subtitle}</span>,
    logo: <span style={{display:'grid',placeItems:'center',width:'3rem',height:'3rem',background:art?'#161923':'#fff',borderRadius:10}}>
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
