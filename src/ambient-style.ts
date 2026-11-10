import type {CSSProperties} from 'react';
// PS5 Dashboard 1.8.0 repaints stylesheet color declarations every keepalive.
// Own these static background values on the Game Hub root, not in CSSOM rules.
const bloom='radial-gradient(ellipse at 0% 0%,rgba(70,118,184,.27),rgba(28,57,100,.12) 42%,transparent 72%),linear-gradient(136deg,transparent 13%,rgba(191,218,255,.035) 24%,transparent 38%)';
export const ambientVariables={
 '--gbs-static-bloom':bloom,
 '--gbs-static-overlay':`${bloom},linear-gradient(180deg,rgba(5,12,23,.50),rgba(5,12,23,.43) 48%,rgba(3,8,15,.90))`,
 '--gbs-static-surface':`${bloom},linear-gradient(115deg,#131f32f5,#0c1422f5)`,
 '--gbs-static-downloads':`${bloom},linear-gradient(125deg,#15243a,#101c2e 60%,#0b1320)`,
 '--gbs-static-room':'radial-gradient(ellipse at 80% 15%,#26334a88,transparent 55%),#10131ce8',
} as CSSProperties;
export const ambientCSS=`
#game-hub-control-center[data-ambient=true]{background:var(--gbs-static-overlay)}
#game-hub-control-center[data-ambient=true] .gcc-settings:not(:has([data-plugin-host])),
#game-hub-control-center[data-ambient=true] .gq-panel,
#game-hub-control-center[data-ambient=true] .gq-party-details{background:var(--gbs-static-surface)}
#game-hub-control-center[data-ambient=true] .gcc-settings.gcd-page{background:var(--gbs-static-downloads)}
.gbs-root.gbs-room[data-ambient=true]{background:var(--gbs-static-room)}
.gbs-root.gbs-room[data-ambient=true]>.gbs-ambient{background:var(--gbs-static-bloom);animation:none;opacity:1}
/* Decorative surface reveals must not ramp the backdrop's opacity or move edges. */
#game-hub-control-center,#game-hub-control-center .gcc-settings,
#game-hub-control-center .gcc-section{animation:none!important;transition:none!important}
.gbs-root.gbs-room>.gbs-ambient::before,.gbs-root.gbs-room>.gbs-ambient::after{animation:none!important;transition:none!important}
.gbs-root.gbs-room>.gbs-shell{transition:none!important;opacity:1;transform:none}
`;
