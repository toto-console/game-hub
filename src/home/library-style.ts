export const libraryCSS=`
.ghd-tab-library {background:#07080a}
.ghl-root {position:absolute;inset:0;background:radial-gradient(ellipse at 85% 38%,#15171d55,transparent 42%),#07080a;color:#eee;overflow:hidden}
.ghl-header {position:absolute;left:2.6vw;top:4.4vh;display:flex;align-items:center;gap:2.3vw;height:7.4vh}
.ghl-library-icon {height:7.4vh;width:7.4vh;display:flex;align-items:center;justify-content:center;background:#111318;border-radius:1vh;font-size:4vh}
.ghl-header h1 {font-size:2.8vh;font-weight:300;margin:0}
.ghl-tabs {position:absolute;top:12.8vh;left:8.9vw;display:flex;align-items:center;gap:3.3vw}
.ghl-control {padding:.7vh .25vw;color:#92939a;outline:none;font-size:2.7vh;font-weight:300;cursor:pointer}
.ghl-active {color:#f6f6f6}
.ghl-control.ghd-focused {color:white;box-shadow:0 0 0 1px #fff;border-radius:3px;background:#ffffff0d}
.ghl-sort {position:absolute;left:2.6vw;top:31.3vh;width:6.7vh;height:6.7vh;border-radius:50%;background:#17191e;display:flex;align-items:center;justify-content:center;color:#eee;font-size:4vh}
.ghl-sort.ghd-focused {border-radius:50%}
.ghl-count {position:absolute;left:8.9vw;right:9vw;top:22vh;color:#aaaeb7;font-size:1.6vh;text-align:right}
.ghl-grid.ghd-grid {position:absolute;left:8.9vw;right:8.9vw;top:25.8vh;bottom:0;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1.1vw;align-content:start;overflow-y:auto;overflow-x:hidden;padding:.4vh .3vw 6vh;scrollbar-width:none;overscroll-behavior:contain;scroll-behavior:auto}
.ghl-grid::-webkit-scrollbar {display:none}
.ghl-cell {position:relative;aspect-ratio:1;min-width:0;content-visibility:auto;contain-intrinsic-size:auto 15.6vw}
.ghl-cell:focus-within,.ghl-cell:has(.ghd-focused) {content-visibility:visible}
.ghl-grid .ghd-tile-small {width:100%;height:100%;border-radius:2px;transform:none!important}
.ghl-grid .ghd-tile-box,.ghl-grid .ghd-tile-art {border-radius:2px}
.ghl-grid .ghd-tile-ring {inset:-.35vh;box-shadow:0 0 0 1.5px #f5f5f5,0 0 1vh #ffffff25;border-radius:3px}
.ghl-grid .ghd-cover {object-fit:cover;object-position:center}
.ghl-grid .ghd-tile-name {font-size:2vh;font-weight:300;line-height:1.3;white-space:normal;min-height:6vh;padding:3.5vh 1.2vh 1.2vh;background:linear-gradient(transparent,#0a0b10ed);border-radius:0}
.ghl-progress {position:absolute;left:0;right:0;top:0;background:#080b12dc;padding:.6vh 1vh;font-size:1.4vh;pointer-events:none;display:flex;flex-direction:column;gap:.3vh}
.ghl-progress progress {width:100%;height:.4vh;accent-color:#e5eaf2}
.ghl-empty {position:absolute;top:30vh;left:9vw;right:9vw;font-size:2.2vh;color:#bbb}
.ghl-menu {position:absolute;top:15vh;left:8.9vw;bottom:6vh;width:40vw;max-width:650px;overflow:auto;background:#17191ff5;border:1px solid #ffffff38;border-radius:8px;padding:2vh 2vw;overscroll-behavior:contain}
.ghl-menu h2 {font-size:2.6vh;font-weight:400;margin:0 0 2vh}
.ghl-menu h3 {font-size:2vh;font-weight:400;color:#aaa;margin:2vh 0 1vh}
.ghl-menu .ghl-control {font-size:2.1vh;padding:1vh}
@media(prefers-reduced-motion:reduce){.ghl-root *{transition:none!important;animation:none!important}}
`;
