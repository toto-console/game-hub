/** CSS-module keys are a capability contract, not a Steam channel detector.
 * No Beta hash mappings are assumed. Unknown shapes leave native UI available. */
export type SteamCSS = Record<string, string>;
export const steamUIShapes = {
 header: ['DashboardBar', 'CurrentUserAvatar', 'Clock'],
 browser: ['MainBrowserContainer', 'BrowserContainer', 'URLBar'],
 footer: ['BasicFooter', 'FooterLegend'],
} as const;
export type SteamUIRole = keyof typeof steamUIShapes;
export function classTokens(value: unknown): string[] {
 if (typeof value !== 'string' || !value.trim()) return [];
 const tokens = value.trim().split(/\s+/);
 return tokens.every(t => /^[a-zA-Z0-9_-]+$/.test(t) && t !== '-') ? [...new Set(tokens)] : [];
}
export function classSelector(value: unknown): string {
 return classTokens(value).map(t => /^-?[0-9]/.test(t) ? `[class~="${t}"]` : '.' + t).join('');
}
export function resolveSteamUI(modules: unknown, role: SteamUIRole): SteamCSS | undefined {
 if (!Array.isArray(modules)) return;
 const keys: readonly string[] = steamUIShapes[role];
 const matches = modules.filter((m): m is SteamCSS => !!m && typeof m === 'object' && keys.every(k => classTokens(m[k]).length > 0));
 if (!matches.length) return;
 // Duplicate identical exports are harmless; conflicting roles are not evidence.
 const identity = (m: SteamCSS) => JSON.stringify([...keys, ...(role === 'header' ? ['Header'] : [])].map(k => classSelector(m[k])));
 if (new Set(matches.map(identity)).size !== 1) return;
 return matches[0];
}
export function steamUIReport(modules: unknown) {
 return Object.fromEntries((Object.keys(steamUIShapes) as SteamUIRole[]).map(role => {
  const found = resolveSteamUI(modules, role);
  return [role, {status: found ? 'resolved' : 'unresolved', selectors: found ? Object.fromEntries(steamUIShapes[role].map(k => [k, classSelector(found[k])])) : {}}];
 }));
}
