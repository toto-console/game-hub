import {homeSequence} from './console-motion';
export const homeHubCSS=`
.gh-home-game-stats{margin-left:auto;align-self:center;display:flex;gap:2.2vw;transform:translateY(-5vh);pointer-events:none;color:white;font-variant-numeric:tabular-nums}
.gh-home-game-stats>span{display:inline-flex;align-items:center;justify-content:center;gap:.75vw;min-width:6.45vw;height:6.6vh;padding:0 1.15vw;border-radius:1.35vw;background:rgba(0,0,0,.84);font-size:1.65vw;font-weight:600;line-height:1;white-space:nowrap}
.gh-home-game-stats svg{width:1.55vw;height:1.55vw;flex:none}
.gh-home-game-heading{position:absolute;z-index:4;top:2.3vh;left:4vw;height:5.4vh;max-width:55vw;display:flex;align-items:center;gap:1.1vw;pointer-events:none;opacity:0;visibility:hidden;transform:translateY(8px);transition:opacity 240ms ease,transform 280ms cubic-bezier(.2,.75,.25,1),visibility 0s 280ms}
.gh-home-game-heading[data-visible=true]{opacity:1;visibility:visible;transform:none;transition:opacity 240ms ease,transform 280ms cubic-bezier(.2,.75,.25,1),visibility 0s}
.gh-home-game-thumb{width:4.4vh;height:4.4vh;flex-shrink:0;border-radius:.45vh;overflow:hidden;background:#192334;display:grid;place-items:center}
.gh-home-welcome-thumb{background:#25272d;color:#fff;font-size:3.4vh}
.ghd-scroller[data-welcome-hub][data-expanded=true] .ghd-home-row{visibility:hidden;opacity:0;pointer-events:none;transform:translateY(-2vh);transition:opacity 240ms ease,transform 280ms ease}
.gh-home-game-thumb img{width:100%;height:100%;object-fit:cover;object-position:center}
.gh-home-game-name{font-size:clamp(14px,2vh,44px);font-weight:400;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 5px #0009}
.ghd-root.ghd-tab-games>.ghd-tabbar{transition:opacity 180ms ease,visibility 0s 180ms}
.ghd-root.ghd-tab-games:has(.gh-home-game-heading[data-visible=true])>.ghd-tabbar{opacity:0;visibility:hidden;pointer-events:none}
@media(prefers-reduced-motion:reduce){.gh-home-game-heading,.ghd-root.ghd-tab-games>.ghd-tabbar{transition:none!important}}

.ghd-scroller[data-game-hub]{overflow-x:hidden;overflow-y:auto;scrollbar-width:none;overscroll-behavior:contain;scroll-behavior:auto;overflow-anchor:none}
.ghd-scroller[data-game-hub] .ghd-hero{height:56vh;padding-bottom:6vh;transition:opacity 250ms ease}
.ghd-scroller[data-game-hub][data-expanded=true] .ghd-hero{height:56vh;padding-bottom:6vh}
.ghd-scroller[data-game-hub][data-expanded=true] .ghd-home-row{opacity:0;pointer-events:none;animation:none}
.ghd-scroller[data-game-hub] .ghd-buttons .ghd-button.ghd-focused,.ghd-scroller[data-game-hub] .ghd-buttons .ghd-button:focus{background:#f9fbff!important;color:#15171a!important;outline:1px solid #fff;outline-offset:3px;box-shadow:0 0 12px #ffffff30;transform:none}
.ghd-scroller[data-game-hub] .ghd-hero .ghd-trophy{display:none}
.gh-home-details.gh-detail{position:relative;inset:auto;z-index:auto;background:transparent;isolation:auto;opacity:1;transition:opacity 280ms ease,transform 280ms ease}
.ghd-scroller[data-expanded=false] .gh-home-details .gh-detail-main>:not(.gh-home-summary){visibility:hidden}
.gh-home-details .gh-detail-main{height:auto;overflow:visible;padding:0 0 5vh}
.gh-home-details .gh-detail-main[inert]{visibility:visible;pointer-events:none}
.gh-home-details .gh-detail-section{padding-left:6.4vw;padding-right:4vw;margin:3vh 0 5vh}
.gh-home-details .gh-detail-section h2{font-size:clamp(18px,1.4vw,38px)}
.gh-home-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.9vw;padding:0 6.4vw;margin-bottom:3vh}
.gh-home-summary .gh-detail-control{box-sizing:border-box;display:flex;flex-direction:column;align-items:stretch;justify-content:center;gap:1.25vh;min-height:12vh;padding:1.2vh 1.05vw;background:rgba(3,3,6,.9);border:0;border-radius:1vw;color:white;font-size:1.15vw;font-weight:600;text-align:left}
.gh-summary-heading,.gh-summary-count,.gh-summary-medals,.gh-summary-medals>span,.gh-friends-faces{display:flex;align-items:center}
.gh-summary-heading{gap:.5vw}.gh-summary-heading>svg{width:1.6vw;height:1.6vw}.gh-summary-count{margin-left:auto;gap:.35vw}
.gh-summary-count i{width:.9vw;height:.9vw;background:#63c17b;border-radius:50%}
.gh-summary-medals{justify-content:space-between;padding-right:2vw}.gh-summary-medals>span{gap:.5vw}.gh-summary-medals svg{width:1.55vw;height:1.8vw;color:#afdbff}.gh-summary-medals>span:nth-child(2) svg{color:#e8b45f}.gh-summary-medals>span:nth-child(3) svg{color:#c3c8ce}.gh-summary-medals>span:nth-child(4) svg{color:#bd876b}
.gh-friends-faces{gap:.4vw;min-height:2vw}.gh-friend-face{width:2vw;height:2vw;border-radius:50%;overflow:hidden;background:#364059;display:grid;place-items:center}.gh-friend-face img{width:100%;height:100%;object-fit:cover}
.gh-home-summary .gh-home-controller{flex-direction:row;align-items:center;justify-content:flex-start;gap:1.2vw}
.gh-device-ring{width:5.2vw;height:5.2vw;border:.23vw solid #818795;border-radius:50%;display:grid;place-items:center}.gh-device-ring[data-connected=true]{border-color:#42c898}.gh-device-ring svg{width:2.4vw;height:2.4vw}.gh-home-controller small{display:block;margin-top:.4vh}
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

.gh-game-presentation{transition:opacity ${homeSequence.exit}ms ease-out,transform ${homeSequence.exit}ms ease-out}
.gh-game-presentation[data-leaving=true]{opacity:0;transform:translateY(-5px);pointer-events:none}
.gh-game-presentation[data-leaving=false] .ghd-info>:is(.ghd-info-title,.ghd-info-logo,.ghd-info-icon,.ghd-info-sub){animation:gh-content-arrive ${homeSequence.reveal}ms ${homeSequence.glide} both}
.gh-game-presentation .ghd-info>.ghd-info-sub{animation-delay:${homeSequence.textLag}ms}
.gh-game-presentation:focus-within .ghd-buttons{animation:none}
@keyframes gh-content-arrive{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}

.gh-home-module .ghd-row-anchor,.gh-home-module .ghd-tile-home{transition:transform ${homeSequence.rail}ms ${homeSequence.glide},opacity 160ms ease-out}
.gh-home-module .ghd-tile-home .ghd-tile-box{transition:transform ${homeSequence.tile}ms ${homeSequence.glide}}
.ghd-scroller[data-game-hub] .ghd-hero{height:56vh;padding-bottom:6vh;transition:transform ${homeSequence.detail}ms ${homeSequence.glide},opacity 200ms ease}
.ghd-scroller[data-game-hub][data-expanded=true] .ghd-hero{height:56vh;padding-bottom:6vh}

.gh-game-presentation:focus-within{opacity:1;transform:none;transition:none;pointer-events:auto}
.gh-game-presentation:focus-within .ghd-info>*{animation:none}

.gh-game-presentation .gh-home-synopsis{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;max-width:43vw}
.gh-game-presentation[data-leaving=false] .ghd-info>.gh-home-synopsis~.gh-home-meta{animation-delay:${homeSequence.secondaryAt-homeSequence.titleAt}ms}
.ghd-scroller[data-game-hub] .gh-primary-action .ghd-button{transition:background-color 160ms ease,color 160ms ease,transform 160ms ${homeSequence.glide}}
.ghd-scroller[data-game-hub] .ghd-buttons .ghd-button:is(.ghd-focused,:focus){transform:scale(1.025)}
.gh-summary-heading .gh-summary-trophy-art,.gh-summary-medals .gh-summary-trophy-art{width:1.75vw;height:3.8vh;object-fit:contain;flex:none}
.gh-home-module[data-motion=true] .gh-home-secondary{opacity:1;transition:opacity 600ms ease}
.gh-home-module[data-motion=true] .gh-home-secondary[data-leaving=true]{opacity:0;transition-duration:310ms}
.gh-home-module[data-motion=true] .gh-home-summary{translate:0 0;transition:translate 610ms cubic-bezier(.2,.74,.22,1)}
.gh-home-module[data-motion=true] .gh-home-secondary[data-leaving=true] .gh-home-summary{translate:0 1.5vh}
@supports (animation-timeline:view()){
 .gh-home-module[data-motion=true] .gh-home-summary{view-timeline-name:--gh-summary}
 .gh-home-module[data-motion=true] .gh-home-summary>.gh-detail-control{
  animation:gh-summary-scroll linear both;animation-timeline:--gh-summary;animation-range:entry 0% exit 100%
 }
 @keyframes gh-summary-scroll{
  0%{opacity:0;translate:0 2.5vh}
  10%,78%{opacity:1;translate:0 0}
  100%{opacity:0;translate:0 -1.8vh}
 }
}
`;
