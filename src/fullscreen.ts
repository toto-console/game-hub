// Mounted with the Game Base route only. The :has guard also removes the effect
// immediately when the panel unmounts. Resolve Steam's header by its class module.
function headerClasses(modules:unknown):string[] {
  if(!Array.isArray(modules))return [];
  const headers=new Set<string>();
  for(const m of modules) {
    if(!m||typeof m!=='object'||!m.DashboardBar||!m.CurrentUserAvatar||!m.Clock)continue;
    for(const key of ['DashboardBar','Header'])if(typeof m[key]==='string'&&/^[\w-]+$/.test(m[key]))headers.add(m[key]);
  }
  return [...headers];
}
export function fullscreenCSS(modules:unknown):string {
  return headerClasses(modules).map(c=>`body:has(.gbs-root.gbs-room) .${c}{visibility:hidden!important;pointer-events:none!important;}`).join('\n');
}
/** Top Bar Padding animates all properties, including visibility and native opacity.
 * Keep transition suppression through the close style commit, not a timed delay. */
export function controlCenterHeaders(modules:unknown){
  const selectors=headerClasses(modules).map(c=>`.${c}`);
  return {selector:selectors.join(','),css:selectors.map(s=>
    `html[data-game-hub-center] body ${s}{transition:none!important;}\n`+
    `html[data-game-hub-center="open"] body ${s}{visibility:hidden!important;pointer-events:none!important;}`
  ).join('\n')};
}
