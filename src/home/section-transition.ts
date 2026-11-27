import {motionAllowed} from '../focus-motion';

/** Snapshot the outgoing section across Steam's route commit. The incoming
 * route keeps ownership of focus throughout the reveal. */
export function changeSection(source:HTMLElement|null|undefined,navigate:()=>void){
 const doc=source?.ownerDocument,win=doc?.defaultView;
 if(!source||!doc||!win||!motionAllowed(source)||typeof doc.startViewTransition!=='function'){
  navigate();return;
 }
 doc.documentElement.classList.add('gh-section-transition');
 const transition=doc.startViewTransition(async()=>{
  navigate();
  await new Promise<void>(resolve=>win.requestAnimationFrame(()=>resolve()));
 });
 const interrupt=()=>transition.skipTransition();
 doc.addEventListener('vgp_ondirection',interrupt,true);
 doc.addEventListener('keydown',interrupt,true);
 const cleanup=()=>{
  doc.documentElement.classList.remove('gh-section-transition');
  doc.removeEventListener('vgp_ondirection',interrupt,true);
  doc.removeEventListener('keydown',interrupt,true);
 };
 void transition.finished.then(cleanup,cleanup);
}
