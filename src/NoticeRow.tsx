import {useState} from 'react';
import type {HubNotice} from './notification-store';
import type {Controls} from './Panel';
import {safeNoticeArtwork} from './system-adapters';
import {safeAvatar} from './model';
export function NoticeRow({notice:n,controls,open}:{notice:HubNotice;controls:Controls;open:()=>void}){
 const {Button}=controls;const src=safeAvatar(n.avatar)??safeNoticeArtwork(n.artwork);const [failed,setFailed]=useState<string>();
 const description=n.conversation?'New message':n.detail.startsWith('No supported')?n.kind:n.detail;
 return <div data-row-id={n.id}><Button className="gcc-utility gcc-setting-row gh-notice-row" onClick={open}>
 <span className={`gh-notice-image${n.avatar?' gh-notice-avatar':''}`} aria-hidden="true">{src&&failed!==src?<img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(src)}/>:<span>{/Message|Friend|Voice/.test(n.kind)?'●':/Achievement/.test(n.kind)?'★':'♢'}</span>}</span>
 <span className="gh-notice-copy"><strong>{n.title}</strong><small>{description}</small></span>
 <span className="gh-notice-meta">{n.time>0&&<time dateTime={new Date(n.time).toISOString()}>{new Date(n.time).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</time>}{n.unread&&<i aria-label="Unread"/>}</span>
 </Button></div>;
}
export const noticeCSS=`#game-hub-control-center .gh-notifications{background:linear-gradient(145deg,#203650ed,#101b2bed 48%,#09111eF5);border:1px solid #ffffff20;border-radius:1.2vw;padding:1.8vw;box-sizing:border-box}#game-hub-control-center .gh-notifications .gh-notice-row{display:flex!important;align-items:center;gap:1vw;min-height:5.8vw;border-radius:.7vw!important;padding:.8vw!important;text-align:left;transition:background 120ms ease}#game-hub-control-center .gh-notice-image{width:3.6vw;height:3.6vw;flex:0 0 3.6vw;border-radius:.55vw;overflow:hidden;background:#ffffff0d;display:grid;place-items:center;font-size:1.8vw;color:#d5e4f7}#game-hub-control-center .gh-notice-avatar{border-radius:50%}#game-hub-control-center .gh-notice-image img{width:100%;height:100%;object-fit:cover}#game-hub-control-center .gh-notice-copy{flex:1;min-width:0}#game-hub-control-center .gh-notice-copy strong{display:block;font-size:1.15vw;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#game-hub-control-center .gh-notice-copy small{font-size:1vw;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}#game-hub-control-center .gh-notice-meta{font-size:.8vw;color:#aebaca;display:flex;align-items:center;gap:.6vw;white-space:nowrap}#game-hub-control-center .gh-notice-meta i{width:.3vw;height:.3vw;border-radius:50%;background:#e9f4ff}#game-hub-control-center .gh-notice-status{font-size:.9vw;color:#aebaca} @media(prefers-reduced-motion:reduce){#game-hub-control-center .gh-notice-row{transition:none}}`;
