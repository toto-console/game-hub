import {footerSelector} from './center-footer';
import {resolveSteamUI,classSelector} from './steam-ui-compat';
// Mounted with the Game Base route only. The :has guard also removes the effect
// immediately when the panel unmounts. Resolve Steam's header by its class module.
function headerClasses(modules:unknown):string[] {
 const header=resolveSteamUI(modules,'header');
 return header?['DashboardBar','Header'].map(k=>classSelector(header[k])).filter(Boolean):[];
}
export function fullscreenCSS(modules:unknown):string {
  return [...headerClasses(modules),footerSelector(modules)].filter(Boolean).map(c=>`body:has(.gbs-root.gbs-room) ${c}{display:none!important;visibility:hidden!important;pointer-events:none!important;transition:none!important;animation:none!important;}`).join('\n');
}
/** Top Bar Padding animates all properties, including visibility and native opacity.
 * Keep transition suppression through the close style commit, not a timed delay. */
export function controlCenterHeaders(modules:unknown){
  const selectors=headerClasses(modules).map(c=>`${c}`);
  return {selector:selectors.join(','),css:selectors.map(s=>
    `html[data-game-hub-center] body ${s}{transition:none!important;}\n`+
    `html[data-game-hub-center="open"] body ${s}{visibility:hidden!important;pointer-events:none!important;}`
  ).join('\n')};
}

/** Home and Library own their header independently of the Control Center lifecycle. */
export function homeHeaderCSS(modules:unknown):string {
 return headerClasses(modules).map(c=>`body:has(.gh-home-module,.gha-root) ${c}{display:none!important;visibility:hidden!important;pointer-events:none!important;}`).join('\n');
}
