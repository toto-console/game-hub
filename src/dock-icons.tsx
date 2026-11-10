// Dock-only silhouettes; social cards retain their original icon renderer.
export function DockIcon({name}:{name:string}){
 const solid:Record<string,string>={
 home:'M3 10.3 12 2l9 8.3V22h-6v-8H9v8H3Z',
 games:'M6 2h12v2H6ZM4 6h16v2H4ZM2 10h20v12H2Z',
 bell:'M12 2a2 2 0 0 1 2 2v.4c3 .8 4.5 3.3 4.5 6.6v4l2.2 3H3.3l2.2-3v-4c0-3.3 1.5-5.8 4.5-6.6V4a2 2 0 0 1 2-2ZM9.5 20h5a2.5 2.5 0 0 1-5 0Z',
 people:'M10 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm7 1a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM4.5 15v-1a5.5 5.5 0 0 1 11 0v1c-3 1.1-8 1.1-11 0Zm12-4c3-.3 5 1.5 5 4-1 .6-2.5 1-4 1 .3-1.8-.1-3.6-1-5ZM2 12.5v3c0 3.4 20 3.4 20 0v-3c5 8.5-25 8.5-20 0Z',
 sound:'M2 8h5l6-5v18l-6-5H2Z',
 controller:'M6 6h12c2.5 0 3.7 5 4.5 12 .3 3-2.5 3-5.5-1H7c-3 4-5.8 4-5.5 1C2.3 11 3.5 6 6 6Zm.5 3v2h-2v2h2v2h2v-2h2v-2h-2V9Zm9.5 1a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Zm3 3a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z',
 profile:'M12 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10ZM3 22v-2a9 9 0 0 1 18 0v2Z'
 };
 const line:Record<string,string>={music:'M9 18V5l12-3v14M9 8l12-3M9 18a3 2 0 1 1-6-1 3 2 0 0 1 6 1Zm12-2a3 2 0 1 1-6-1 3 2 0 0 1 6 1Z',download:'M12 2v13m-5-5 5 5 5-5M3 17v5h18v-5',mic:'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8',power:'M12 2v10M6 5a9 9 0 1 0 12 0'};
 return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="gcc-console-icon">{solid[name]?<path d={solid[name]} fill="currentColor" fillRule="evenodd"/>:<path d={line[name]??line.power} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}{name==='sound'&&<path d="M16 7a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>}</svg>;
}
export function dockSelectionLeft(index:number,count:number){const ratio=count>1?Math.max(0,Math.min(index,count-1))/(count-1):0;return `calc(${ratio*100}% + ${2.75-ratio*5.5}vw)`;}
export const dockIconCSS=`
/* Paint only: retain every dock hitbox, action, badge and position. */
#game-hub-control-center .gcc-dock .gcc-dock-row{position:relative;z-index:1}
#game-hub-control-center .gcc-dock .gcc-dock-selection{position:absolute;top:50%;width:4.2vw;height:4.2vw;transform:translate(-50%,-50%);border-radius:50%;border:1px solid #282b30;background:linear-gradient(150deg,#fff,#edf0f3);box-shadow:0 0 0 2px #e8ecf285,0 0 12px #ffffff26;pointer-events:none;opacity:0;transition:left 170ms cubic-bezier(.2,.75,.25,1),opacity 100ms ease;overflow:hidden}
#game-hub-control-center .gcc-dock:has(.gcc-dock-item[data-gh-focus]) .gcc-dock-selection{opacity:1}
#game-hub-control-center .gcc-dock .gcc-dock-selection::after{content:'';position:absolute;inset:-40%;background:linear-gradient(115deg,transparent 35%,#ffffff65 49%,transparent 63%);transform:translateX(-70%)}
#game-hub-control-center .gcc-dock:has(.gcc-dock-item[data-gh-focus]) .gcc-dock-selection::after{animation:gcc-dock-sheen 3.8s ease-in-out infinite}
@keyframes gcc-dock-sheen{0%,35%{transform:translateX(-70%);opacity:0}50%{opacity:.5}75%,100%{transform:translateX(70%);opacity:0}}
#game-hub-control-center .gcc-dock .gcc-dock-item,#game-hub-control-center .gcc-dock .gcc-dock-item[data-gh-focus]{transform:none!important;background:transparent!important;border-color:transparent!important;box-shadow:none!important;outline:none!important}
#game-hub-control-center .gcc-dock .gcc-dock-item>svg{width:2.05vw!important;height:2.05vw!important;color:#f8f9fb!important;transition:color 100ms ease!important}
#game-hub-control-center .gcc-dock .gcc-dock-item[data-gh-focus]>svg{color:#24272b!important}
#game-hub-control-center .gcc-dock .gcc-dock-item[data-gh-gloss]::after{display:none!important}
#game-hub-control-center[data-motion=false] .gcc-dock-selection,#game-hub-control-center[data-motion=false] .gcc-dock-selection::after{animation:none!important;transition:none!important}
@media(prefers-reduced-motion:reduce){#game-hub-control-center .gcc-dock-selection,#game-hub-control-center .gcc-dock-selection::after{animation:none!important;transition:none!important}}
`;
