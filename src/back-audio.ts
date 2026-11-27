import type {NavigationSound} from './native-navigation-audio';

/** Fill silent Game Hub gestures after the receiving control and Steam have handled them. */
export function connectBackAudio(doc:Document,enabled:()=>boolean,play:(kind:NavigationSound)=>void,revision=()=>0){
 const win=doc.defaultView;if(!win)return()=>{};
 const scopes='.gh-home-module,#game-hub-control-center,.gbs-root,.gbs-room,.gh-music-route,.gh-media-manager,.ghl-root,.gh-detail,.gh-welcome,.gha-root,.gh-game-friends,.gh-post-game,.cs-store';
 const events=['keydown','vgp_oncancel','vgp_ondirection','vgp_onok','vgp_onmenu','click'];
 let disposed=false,lastBack=-Infinity;
 const observe=(e:Event)=>{
  const target=e.target as HTMLElement,key=(e as KeyboardEvent).key,detail=(e as CustomEvent).detail;
  if(!enabled()||!target?.closest?.(scopes)||target.closest('[disabled],[aria-disabled="true"],[inert]'))return;
  const control=target.closest<HTMLElement>('button,[role="button"],[tabindex]');
  const back=e.type==='vgp_oncancel'||key==='Escape';
  const move=e.type==='vgp_ondirection'||key?.startsWith('Arrow');
  const menu=e.type==='vgp_onmenu'||key==='ContextMenu';
  const select=e.type==='vgp_onok'||(e.type==='click'&&!!control)||key==='Enter'||key===' ';
  if(!(back||move||menu||select)||(!move&&((e as KeyboardEvent).repeat||detail?.is_repeat)))return;
  if(target.closest('input,textarea,[contenteditable="true"]')&&!back)return;
  const before=revision(),focus=doc.activeElement;
  const backButton=control?.matches('[data-gamehub-back]')||/^Back(?: to .+)?$/i.test(control?.textContent?.trim()??'');
  const kind:NavigationSound=back||backButton?(target.closest('.gh-detail,.gha-root,.gh-post-game')?'OutOfGameDetail':'CloseSideMenu'):move?'BasicNav':menu?'ShowModal':'DefaultOk';
  // A macrotask also covers trusted input, whose listeners can run in separate microtasks.
  win.setTimeout(()=>{
   if(disposed||!enabled()||revision()!==before)return;
   if(move&&(focus===doc.activeElement||!doc.activeElement?.closest(scopes)))return;
   if((back||menu)&&!e.defaultPrevented&&focus===doc.activeElement&&target.isConnected)return;
   if(back||backButton){const now=performance.now();if(now-lastBack<100)return;lastBack=now;}
   play(kind);
  },0);
 };
 for(const name of events)win.addEventListener(name,observe,true);
 return()=>{disposed=true;for(const name of events)win.removeEventListener(name,observe,true);};
}
