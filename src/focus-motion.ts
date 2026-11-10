import {useLayoutEffect,type RefObject} from 'react';

const targets='button,[role="button"],input,select,textarea,[role="slider"],[data-gh-control],.gbs-message';
/** One painted target per owned document subtree. Hover never changes controller focus. */
export function useFocusPresentation(root:RefObject<HTMLElement|null>){
 useLayoutEffect(()=>{
  const el=root.current;if(!el)return;
  el.setAttribute('data-gh-focus-scope','');
  let active:HTMLElement|null=null;
  const mark=(target:EventTarget|null)=>{
   const next=(target as HTMLElement|null)?.closest?.<HTMLElement>(targets)??null;
   if(next===active)return;
   active?.removeAttribute('data-gh-focus');active=next&&el.contains(next)?next:null;
   active?.setAttribute('data-gh-focus','');
   if(active&&!active.matches('input,textarea,select')&&!active.closest('[data-plugin-host]'))active.setAttribute('data-gh-gloss','');
   el.dataset.ghHint=active?.closest('.ga-game')?'Options':active?.closest('.ga-achievement')?'Details':'';
  };
  const focus=(e:Event)=>mark(e.target);
  const blur=(e:FocusEvent)=>{if(!el.contains(e.relatedTarget as Node|null))mark(null);};
  el.addEventListener('focusin',focus);el.addEventListener('vgp_onfocus',focus);
  el.addEventListener('focusout',blur);mark(el.ownerDocument.activeElement);
  return()=>{el.removeEventListener('focusin',focus);el.removeEventListener('vgp_onfocus',focus);el.removeEventListener('focusout',blur);active?.removeAttribute('data-gh-focus');el.removeAttribute('data-gh-focus-scope');};
 },[root]);
}
export function motionAllowed(el:HTMLElement){return el.closest('[data-motion="false"]')===null&&!el.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;}

export const focusMotionCSS=`
:is(#game-hub-control-center,.gbs-root)[data-gh-focus-scope] [data-gh-gloss]{position:relative!important}
:is(#game-hub-control-center,.gbs-root)[data-gh-focus-scope] [data-gh-gloss]::after{content:""!important;display:block!important;position:absolute;inset:1px;border-radius:inherit;pointer-events:none;z-index:4;background:linear-gradient(155deg,#ffffff17 0%,#d9eeff09 22%,transparent 48%);box-shadow:inset 0 1px 0 #e7f4ff35;opacity:0;transition:opacity 150ms ease-out!important}
:is(#game-hub-control-center,.gbs-root)[data-gh-focus-scope] [data-gh-gloss][data-gh-focus]::after{opacity:1;transition-duration:200ms!important}
@media(prefers-reduced-motion:reduce){:is(#game-hub-control-center,.gbs-root)[data-gh-focus-scope] [data-gh-gloss]::after{transition:none!important}}
:is(#game-hub-control-center,.gbs-root)[data-motion=false] [data-gh-gloss]::after{transition:none!important}

:is(#game-hub-control-center,.gbs-root)[data-gh-focus-scope]{--gh-focus-time:240ms;--gh-focus-ease:cubic-bezier(.2,.75,.25,1);--gh-focus-shadow:0 0 0 1px #fff,0 0 16px #a9d4ff55;--gh-card-lift:-12px;--gh-card-scale:1.045}
:is(#game-hub-control-center,.gbs-root)[data-gh-focus-scope] :is(button,[role=button],input,textarea,[role=slider],[data-gh-control]){transition:transform var(--gh-focus-time) var(--gh-focus-ease),box-shadow var(--gh-focus-time) ease,border-color var(--gh-focus-time) ease!important;transform-origin:center center}
:is(#game-hub-control-center,.gbs-root)[data-gh-focus-scope] :is(button,[role=button],input,textarea,[role=slider],[data-gh-control]):not([data-gh-focus]){outline:none!important}
:is(#game-hub-control-center,.gbs-root)[data-gh-focus-scope] :is(.gbs-focus,.gbs-message-focus,.gpfocus):not([data-gh-focus]){box-shadow:none!important;outline:none!important}
:is(#game-hub-control-center,.gbs-root)[data-gh-focus-scope] [data-gh-focus]{outline:2px solid #ecf5ff!important;outline-offset:2px!important;box-shadow:0 0 12px #a9d4ff45!important;position:relative;z-index:2}
#game-hub-control-center[data-gh-focus-scope] :is(.gcc-card,.gcc-dock-item){transform:none!important;border-color:#d3dfef42!important;outline:none!important}
#game-hub-control-center[data-gh-focus-scope] .gcc-card:not([data-gh-focus]){box-shadow:inset 0 0 7px #dce5f510,0 7px 20px #0004!important}
#game-hub-control-center[data-gh-focus-scope] .gcc-card[data-gh-focus]{transform:translateY(var(--gh-card-lift)) scale(var(--gh-card-scale))!important;border-color:white!important;outline:none!important;box-shadow:var(--gh-focus-shadow),0 14px 25px #0006!important;z-index:3}
#game-hub-control-center[data-gh-focus-scope] .gcc-dock-item{border-color:transparent!important;box-shadow:none!important}
#game-hub-control-center[data-gh-focus-scope] .gcc-dock-item[data-gh-focus]{transform:translateY(-3px) scale(1.08)!important;border-color:#fff!important;box-shadow:var(--gh-focus-shadow)!important;outline:none!important}
#game-hub-control-center[data-gh-focus-scope] .gcc-dock-label{opacity:0;transform:translate(-50%,5px);transition:opacity 180ms ease,transform 180ms ease;max-width:15vw;overflow:hidden;text-overflow:ellipsis}
#game-hub-control-center[data-gh-focus-scope] .gcc-dock-item[data-gh-focus] .gcc-dock-label{opacity:1;transform:translate(-50%,0)}
#game-hub-control-center[data-gh-focus-scope] :is(.gcc-utility,.gcc-setting-row)[data-gh-focus]{border-radius:5px!important;outline-offset:-2px!important;background-color:#d8eaff12!important}
#game-hub-control-center .ga-options-hint{opacity:0;transition:opacity 180ms ease;bottom:calc(var(--gh-footer-clearance,0px) + 44px)!important}
#game-hub-control-center[data-gh-hint="Options"] .ga-options-hint,#game-hub-control-center[data-gh-hint="Details"] .ga-options-hint{opacity:1}
#game-hub-control-center .ga-options-hint::after{content:attr(data-label)}
#game-hub-control-center[data-gh-hint="Details"] .ga-options-hint::after{content:'Details'}
#game-hub-control-center .gcc-bottom>footer[data-cc-row="2"]{bottom:max(2.5vh,12px,env(safe-area-inset-bottom))!important;opacity:.85!important;font-size:clamp(10px,.85vw,20px)!important}
#game-hub-control-center footer .gcc-utility{font-size:inherit!important;padding:.45em!important}
#game-hub-control-center .gcc-preview{position:absolute;inset:0;opacity:0;visibility:hidden;pointer-events:none;transform:translateY(12px);transition:opacity 220ms ease,transform 220ms var(--gh-focus-ease),visibility 0s 220ms}
#game-hub-control-center .gcc-preview[data-active=true]{opacity:1;visibility:visible;pointer-events:auto;transform:none;transition:opacity 220ms ease,transform 220ms var(--gh-focus-ease),visibility 0s}
#game-hub-control-center .gcc-preview:not([data-preview=game]){width:min(74vw,100%);height:100%;padding:22px 12px}
#game-hub-control-center .gcc-preview .gcc-section{width:min(50vw,100%);height:100%;max-height:100%;overflow:auto;padding:1.2vw 1.6vw}
#game-hub-control-center .gcc-preview .gcc-section-list{height:auto;max-height:65%}
#game-hub-control-center .gcc-preview .gcc-section h2{margin:0 0 1vh}
#game-hub-control-center .gcc-preview .gcc-section-item{font-size:clamp(13px,1.35vw,28px)!important}
#game-hub-control-center .gcc-preview .gcc-section-item span{font-size:clamp(11px,1vw,21px)}
@media(max-height:650px){#game-hub-control-center .gcc-dock{top:79%!important}#game-hub-control-center .gcc-cards{top:30%!important}#game-hub-control-center .ga-options-hint{bottom:calc(var(--gh-footer-clearance,0px) + 41px)!important}#game-hub-control-center footer{left:3%;right:3%}}
@media(prefers-reduced-motion:reduce){:is(#game-hub-control-center,.gbs-root)[data-gh-focus-scope]{--gh-card-lift:0px;--gh-card-scale:1}:is(#game-hub-control-center,.gbs-root)[data-gh-focus-scope] *{transition:none!important;animation:none!important}#game-hub-control-center[data-gh-focus-scope] .gcc-dock-item[data-gh-focus]{transform:none!important}}
:is(#game-hub-control-center,.gbs-root)[data-motion=false]{--gh-card-lift:0px;--gh-card-scale:1}
:is(#game-hub-control-center,.gbs-root)[data-motion=false] *{transition:none!important;animation:none!important}
#game-hub-control-center[data-motion=false] .gcc-dock-item[data-gh-focus]{transform:none!important}
`;
