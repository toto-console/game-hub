import {useLayoutEffect,type RefObject} from 'react';
/** Verified Steam BasicFooter module, not a guessed theme selector. Scope suppression to Game Hub. */
export function footerSelector(modules:unknown):string{
 if(!Array.isArray(modules))return '';
 return modules.filter(m=>m&&typeof m.BasicFooter==='string'&&m.FooterLegend&&/^[\w-]+$/.test(m.BasicFooter)).map(m=>'.'+m.BasicFooter).join(',');
}
export function useCenterFooter(root:RefObject<HTMLElement|null>,modules:unknown){
 useLayoutEffect(()=>{
  const el=root.current,selector=footerSelector(modules);if(!el||!selector)return;
  const doc=el.ownerDocument,style=doc.createElement('style');
  // Game Hub supplies its own hints. Hide only Steam's identified footer while
  // our surface exists; native pages regain their footer on unmount.
  style.textContent=selector.split(',').map(s=>`body:has(#game-hub-control-center) ${s}{display:none!important}`).join('\n');
  doc.head.append(style);
  el.style.setProperty('--gh-footer-clearance','0px');
  return()=>{style.remove();el.style.removeProperty('--gh-footer-clearance');};
 },[root,modules]);
}
