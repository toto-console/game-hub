import {useEffect,type RefObject} from 'react';
import {focusControl,type KeyboardBridge} from './navigation';
export type MessagePosition={id?:string;top:number};
export function useMessageNavigation(root:RefObject<HTMLElement|null>,history:RefObject<HTMLDivElement|null>,position:MessagePosition,keyboard:KeyboardBridge|undefined,reading:()=>void){
 const current={position,reading};
 useEffect(()=>{const el=root.current;if(!el)return;
 const bubbles=()=>Array.from(el.querySelectorAll<HTMLElement>('[data-message-id]'));
 const valid=(selector:string)=>Array.from(el.querySelectorAll<HTMLElement>(selector)).filter(e=>!e.matches(':disabled')&&e.getClientRects().length>0);
 const take=(n:HTMLElement|undefined|null,scroll=true)=>{if(!n)return;focusControl(n);const h=history.current;if(h&&n.dataset.messageId){current.position.id=n.dataset.messageId;current.reading();if(scroll){const a=n.getBoundingClientRect(),b=h.getBoundingClientRect();if(a.top<b.top+5)h.scrollTop-=b.top+5-a.top;else if(a.bottom>b.bottom-5)h.scrollTop+=a.bottom-b.bottom+5;}current.position.top=h.scrollTop;}};
 const focused=(e:Event)=>{const n=(e.target as HTMLElement).closest<HTMLElement>('[data-message-id]');if(n){current.position.id=n.dataset.messageId;current.reading();const h=history.current;if(h)current.position.top=h.scrollTop;}};
 const handle=(e:Event)=>{if(keyboard?.visible())return;const k=e as KeyboardEvent;const d=e.type==='vgp_ondirection'?(e as CustomEvent).detail?.button:({ArrowUp:9,ArrowDown:10,ArrowLeft:11,ArrowRight:12} as Record<string,number>)[k.key];
 const target=e.target as HTMLElement,b=target.closest<HTMLElement>('[data-message-id]'),side=target.closest('.gbs-chat-sidebar'),composer=target.closest('.gbs-composer-host'),back=target.closest('.gq-chat-back');
 if(e.type==='vgp_onmenu'&&b){e.preventDefault();e.stopImmediatePropagation();return;}
 if(!d)return;if(composer&&(d===11||d===12))return;
 if(!b&&!side&&!composer&&!back&&!target.closest('.gbs-chat-history'))return;
 e.preventDefault();e.stopImmediatePropagation();const all=bubbles(),input=valid('.gbs-composer input')[0],actions=valid('.gbs-chat-sidebar .gbs-chat-action'),top=valid('.gq-chat-back')[0];
 if(b){const i=all.indexOf(b);if(d===9){if(i>0)take(all[i-1]);else{const more=valid('.gbs-history-more')[0];if(more)more.click();else if(top)take(top);}}else if(d===10)take(all[i+1]??input??b);else if(d===12)take(actions[0]??b);return;}
 if(side){const i=actions.findIndex(a=>a.contains(target));if(d===11)take(all.find(a=>a.dataset.messageId===current.position.id)??all.at(-1)??input,false);else if(d===9||d===10)take(actions[Math.max(0,Math.min(actions.length-1,i+(d===9?-1:1)))]);return;}
 if(composer){if(d===9)take(all.at(-1)??top??actions[0]);return;}
 if(back){if(d===10)take(all.find(a=>a.dataset.messageId===current.position.id)??all.at(-1)??input);return;}
 if(d===9)take(all[0]??top??actions[0]);else if(d===10)take(all.at(-1)??input);else if(d===12)take(actions[0]??top);
 };
 const scroll=()=>{if(history.current)current.position.top=history.current.scrollTop;};
 el.addEventListener('focusin',focused);history.current?.addEventListener('scroll',scroll);
 for(const n of ['vgp_ondirection','keydown','vgp_onmenu'])el.addEventListener(n,handle,true);
 const h=history.current;return()=>{el.removeEventListener('focusin',focused);h?.removeEventListener('scroll',scroll);for(const n of ['vgp_ondirection','keydown','vgp_onmenu'])el.removeEventListener(n,handle,true);};
 },[root,history,position,keyboard]);
}
