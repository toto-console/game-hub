import {focusControl} from './navigation';
type HomeWindow={BrowserWindow:Window;LocationPathName:string;m_history?:{listen:(fn:()=>void)=>()=>void}};
/** PS5 Dashboard's verified 1.8 DOM. No changes to its plugin files or preferences. */
export function connectHomeFocus(instance:HomeWindow,enabled:()=>boolean,motion:()=>boolean){
 const doc=instance.BrowserWindow.document,style=doc.createElement('style');let pending=false,frame=0,disposed=false;
 style.textContent=`
 html[data-gh-home-polish] .psd-tile .psd-tile-box{transition:transform 260ms cubic-bezier(.2,.75,.25,1)!important}
 html[data-gh-home-polish] .psd-tile-home.psd-focused .psd-tile-box{transform:translateY(-12px) scale(1.04)!important}
 html[data-gh-home-polish] .psd-tile.psd-focused .psd-tile-ring{box-shadow:0 0 0 2px #fff,0 0 16px #a9d4ff55!important;opacity:1!important}
 html[data-gh-home-polish] .psd-tile:not(.psd-focused) .psd-tile-ring{box-shadow:none!important;opacity:0!important}
 html[data-gh-home-polish] .psd-tile-aura-spin{animation:none!important}
 html[data-gh-home-polish=quiet] .psd-tile,html[data-gh-home-polish=quiet] .psd-tile *{transition:none!important;animation:none!important}
 html[data-gh-home-polish=quiet] .psd-tile-home.psd-focused .psd-tile-box{transform:none!important}
 @media(prefers-reduced-motion:reduce){html[data-gh-home-polish] .psd-tile,html[data-gh-home-polish] .psd-tile *{transition:none!important;animation:none!important}html[data-gh-home-polish] .psd-tile-home.psd-focused .psd-tile-box{transform:none!important}}
 `;
 doc.head.append(style);
 const update=()=>{
  if(disposed)return;
  const home=enabled()&&instance.LocationPathName==='/library/home';
  if(home)doc.documentElement.setAttribute('data-gh-home-polish',motion()?'motion':'quiet');else doc.documentElement.removeAttribute('data-gh-home-polish');
  if(!home||!pending||doc.querySelector('#game-hub-control-center,.gbs-modal-owner'))return;
  const tile=doc.querySelector<HTMLElement>('.psd-row-anchor .psd-tile-home:has(img.psd-cover)');
  if(tile){pending=false;frame=instance.BrowserWindow.requestAnimationFrame(()=>{if(!disposed&&instance.LocationPathName==='/library/home'&&!doc.querySelector('#game-hub-control-center'))focusControl(tile);});}
 };
 const observer=new (instance.BrowserWindow as Window & typeof globalThis).MutationObserver(update);observer.observe(doc.body,{childList:true,subtree:true});
 const unlisten=instance.m_history?.listen(update);
 const cancel=()=>{pending=false;instance.BrowserWindow.cancelAnimationFrame(frame);};
 for(const name of ['keydown','pointerdown','vgp_ondirection'])doc.addEventListener(name,cancel,true);
 update();
 return {refresh:update,navigate(fn:()=>void){cancel();pending=true;try{fn();update();}catch(e){pending=false;throw e;}},dispose(){disposed=true;cancel();observer.disconnect();unlisten?.();style.remove();doc.documentElement.removeAttribute('data-gh-home-polish');for(const name of ['keydown','pointerdown','vgp_ondirection'])doc.removeEventListener(name,cancel,true);}};
}
