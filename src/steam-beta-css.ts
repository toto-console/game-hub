/** Decky 4 / Steam ES-module adapter. Read component source and its lexical
 * scope; never execute Steam functions or store build-specific class hashes.
 * Evidence: Windows Steam Beta 1795048523. Changed signatures fail closed. */
type Scope = Record<string, unknown>;
type CSS = Record<string, string>;
const identifier = '[A-Za-z_$][\\w$]*';
function source(value: unknown): string {
 const item = value as {type?: unknown;render?: unknown}|null;
 const fn = typeof value === 'function' ? value : typeof item?.type === 'function' ? item.type : item?.render;
 return typeof fn === 'function' ? Function.prototype.toString.call(fn) : '';
}
function token(value: unknown): string {
 return typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value) && value !== '-' ? value : '';
}
function firstClass(text: string, scope: Scope): string {
 const match = text.match(new RegExp('className:(?:'+identifier+'\\()?('+identifier+')'));
 return match ? token(scope[match[1]]) : '';
}
function unique(items: CSS[]): CSS|undefined {
 const valid = items.filter(item => Object.values(item).every(Boolean));
 return valid.length && new Set(valid.map(item => JSON.stringify(item))).size === 1 ? valid[0] : undefined;
}
export function resolveBetaCSS(scopes: Iterable<Scope>): Partial<Record<'header'|'footer'|'browser', CSS>> {
 const headers: CSS[] = [], footers: CSS[] = [], browsers: CSS[] = [];
 for (const scope of scopes) {
  const functions = Object.values(scope).map(value => source(value)).filter(Boolean);
  for (const text of functions) {
   if (text.includes('id:`header`') && text.includes('--gamepadui-header-opacity') && text.includes('GetFlexGrowPriority')) {
    const cls = firstClass(text, scope);
    headers.push({DashboardBar:cls,Header:cls});
   }
   if (text.includes('id:`Footer`') && text.includes('m_flCurrentFooterHeight') && text.includes('quick-access')) {
    const child = text.match(new RegExp('children:\\(0,'+identifier+'\\.jsx\\)\\(('+identifier+'),\\{location:'));
    footers.push({BasicFooter:firstClass(text, scope),FooterLegend:child ? firstClass(source(scope[child[1]]),scope) : ''});
   }
   if (text.includes('BExternalTriggeredLoad') && text.includes('GetConnectionError') && text.includes('displayURLBar')) {
    // The unconditional third argument is the browser root class, not the
    // caller's class or the conditional visible/loading class.
    const main = text.match(new RegExp('className:'+identifier+'\\('+identifier+','+identifier+'&&`[^`]+`,('+identifier+'),'));
    const inner = text.match(/classNameContainer:`([^`]+)`/);
    const bars = functions.filter(s => s.includes('#BrowserContextMenu_GoBack') && s.includes('DisplayURL') && s.includes('CanGoForward'));
    for (const bar of bars) browsers.push({MainBrowserContainer:main ? token(scope[main[1]]) : '',BrowserContainer:token(inner?.[1]),URLBar:firstClass(bar,scope)});
   }
  }
 }
 return {header:unique(headers),footer:unique(footers),browser:unique(browsers)};
}
let cachedScopes: Map<unknown,Scope>|undefined, cachedSize = -1;
let cached: ReturnType<typeof resolveBetaCSS> = {};
export function runtimeBetaCSS() {
 const scopes = (globalThis as typeof globalThis & {DFLModules?:{moduleScopes?:Map<unknown,Scope>}}).DFLModules?.moduleScopes;
 if (!(scopes instanceof Map)) return {};
 if (scopes !== cachedScopes || scopes.size !== cachedSize) {
  cachedScopes=scopes;cachedSize=scopes.size;cached=resolveBetaCSS(scopes.values());
 }
 return cached;
}
