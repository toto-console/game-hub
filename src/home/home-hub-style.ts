export const homeHubCSS=`
.gh-home-game-heading{position:absolute;z-index:4;top:2.3vh;left:4vw;height:5.4vh;max-width:55vw;display:flex;align-items:center;gap:1.1vw;pointer-events:none;opacity:0;visibility:hidden;transform:translateY(8px);transition:opacity 240ms ease,transform 280ms cubic-bezier(.2,.75,.25,1),visibility 0s 280ms}
.gh-home-game-heading[data-visible=true]{opacity:1;visibility:visible;transform:none;transition:opacity 240ms ease,transform 280ms cubic-bezier(.2,.75,.25,1),visibility 0s}
.gh-home-game-thumb{width:4.4vh;height:4.4vh;flex-shrink:0;border-radius:.45vh;overflow:hidden;background:#192334;display:grid;place-items:center}
.gh-home-welcome-thumb{background:#25272d;color:#fff;font-size:3.4vh}
.ghd-scroller[data-welcome-hub][data-expanded=true] .ghd-home-row{opacity:0;pointer-events:none;transform:translateY(-2vh);transition:opacity 240ms ease,transform 280ms ease}
.gh-home-game-thumb img{width:100%;height:100%;object-fit:cover;object-position:center}
.gh-home-game-name{font-size:clamp(14px,2vh,44px);font-weight:400;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 5px #0009}
.ghd-root.ghd-tab-games>.ghd-tabbar{transition:opacity 180ms ease,visibility 0s 180ms}
.ghd-root.ghd-tab-games:has(.gh-home-game-heading[data-visible=true])>.ghd-tabbar{opacity:0;visibility:hidden;pointer-events:none}
@media(prefers-reduced-motion:reduce){.gh-home-game-heading,.ghd-root.ghd-tab-games>.ghd-tabbar{transition:none!important}}

.ghd-scroller[data-game-hub]{overflow-x:hidden;overflow-y:auto;scrollbar-width:none;overscroll-behavior:contain;scroll-behavior:smooth}
.ghd-scroller[data-game-hub] .ghd-hero{height:70vh;padding-bottom:20vh;transition:height 280ms ease,padding 280ms ease,opacity 250ms ease}
.ghd-scroller[data-game-hub][data-expanded=true] .ghd-hero{height:53vh;padding-bottom:3vh}
.ghd-scroller[data-game-hub][data-expanded=true] .ghd-home-row{opacity:0;pointer-events:none;animation:none}
.ghd-scroller[data-game-hub] .ghd-buttons .ghd-button.ghd-focused,.ghd-scroller[data-game-hub] .ghd-buttons .ghd-button:focus{background:#f9fbff!important;color:#15171a!important;outline:1px solid #fff;outline-offset:3px;box-shadow:0 0 12px #ffffff30;transform:none}
.ghd-scroller[data-game-hub] .ghd-hero .ghd-trophy{display:none}
.gh-home-details.gh-detail{position:relative;inset:auto;z-index:auto;background:transparent;isolation:auto;opacity:1;transition:opacity 280ms ease,transform 280ms ease}
.ghd-scroller[data-expanded=false] .gh-home-details{visibility:hidden;height:0;overflow:hidden;opacity:0;transform:translateY(14px)}
.gh-home-details .gh-detail-main{height:auto;overflow:visible;padding:0 0 5vh}
.gh-home-details .gh-detail-main[inert]{visibility:visible;pointer-events:none}
.gh-home-details .gh-detail-section{padding-left:6.4vw;padding-right:4vw;margin:3vh 0 5vh}
.gh-home-details .gh-detail-section h2{font-size:clamp(18px,1.4vw,38px)}
.gh-home-summary{display:flex;gap:1.2vw;padding:0 6.4vw;margin-bottom:3vh}
.gh-home-summary .gh-detail-control{flex:0 1 28vw;width:28vw;min-height:12vh;padding:1.4vh 1.2vw;background:#111c30c9;border-radius:.65vw;display:flex;align-items:center;gap:1vw}
.gh-home-summary svg{font-size:clamp(24px,2vw,65px);flex-shrink:0}
.gh-home-summary strong,.gh-home-summary small{display:block;line-height:1.4}
.gh-home-summary strong{font-size:clamp(17px,1.2vw,32px);font-weight:400}
.gh-home-summary small{font-size:clamp(13px,.9vw,26px);color:#c7cfdc}
.gh-home-friend-avatars{display:flex;gap:4px}.gh-home-friend-avatars img{width:2.5vw;height:2.5vw;min-width:24px;min-height:24px;object-fit:cover;border-radius:50%;border:1px solid #40d787}
.gh-home-details .gh-detail-control.ghd-focused,.gh-home-details .gh-detail-control:focus{outline:1px solid white;outline-offset:3px;box-shadow:0 0 9px #ffffff30;transform:none}
.gh-home-details .gh-detail-control:after{pointer-events:none}
.gh-home-details .gh-detail-control.ghd-focused:before{content:'';position:absolute;inset:0;border-radius:inherit;z-index:3;pointer-events:none;background:linear-gradient(130deg,#ffffff12,transparent 40%,#ffffff06 55%,transparent);background-size:220% 220%;animation:gh-home-reflection 5s ease-in-out infinite}
@keyframes gh-home-reflection{50%{background-position:100% 100%}}
.gh-home-details .gh-detail-dialog{position:fixed;inset:12vh 10vw 7vh;z-index:12;box-shadow:0 20px 70px #0008}
.gh-home-details .gh-detail-bottom{padding-left:6.4vw}
.gh-home-details .gh-detail-control h3{font-size:clamp(17px,1.3vw,36px)}
.gh-home-details .gh-detail-empty,.gh-home-details .gh-detail-caption,.gh-home-details .gh-detail-control small{font-size:clamp(12px,.9vw,26px)}
.gh-home-details .gh-detail-control p{font-size:clamp(14px,.95vw,28px)}
@media(prefers-reduced-motion:reduce){.ghd-scroller[data-game-hub]{scroll-behavior:auto}.ghd-scroller[data-game-hub] *{animation:none!important;transition:none!important}}
.gh-home-module[data-motion=false] .ghd-scroller[data-game-hub]{scroll-behavior:auto}
`;
