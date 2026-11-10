import {ambientCSS} from './ambient-style';
// Reference geometry: 1672 x 941. All rules stay inside the Control Center.
// Steam DialogButton has theme-dependent !important sizes/backgrounds. Reset only
// our three button classes, then explicitly own their dimensions and focus paint.
export const controlCenterCSS=`
#game-hub-control-center{position:fixed;inset:0;z-index:2147483000;isolation:isolate;color:#f5f6f8;font-family:"Bahnschrift SemiCondensed","Bahnschrift","Arial Narrow",sans-serif;font-weight:300;background:linear-gradient(180deg,rgba(5,12,23,.50) 0%,rgba(5,12,23,.43) 48%,rgba(3,8,15,.90) 100%);backdrop-filter:blur(2px);animation:gcc-reveal 160ms ease-out}
#game-hub-control-center *{box-sizing:border-box}
#game-hub-control-center .gcc-focus-root{width:100%;height:100%}
#game-hub-control-center .gcc-header{position:absolute;left:3%;right:3%;top:2.8%;display:flex;align-items:center;justify-content:flex-end;font-size:1.6vw;font-weight:300}
#game-hub-control-center .gcc-header>span{display:flex;align-items:center;gap:1.3vw}
#game-hub-control-center .gcc-header svg{width:2.65vw;height:2.65vw}
#game-hub-control-center .gcc-header i{height:1.8vw;width:1px;background:#e7ebf0b0;margin:0}
#game-hub-control-center .gcc-header time{font-size:2.15vw;font-variant-numeric:tabular-nums;font-weight:300}
#game-hub-control-center .gcc-bottom{position:absolute;inset:0;pointer-events:none}
#game-hub-control-center .gcc-cards{position:absolute;left:8.55%;top:38.5%;width:66.4%;height:35.8%;pointer-events:auto}
#game-hub-control-center .gcc-card-row{display:flex!important;flex-direction:row!important;gap:1vw!important;height:100%!important;width:100%!important;min-width:0!important}
#game-hub-control-center :is(.gcc-card,.gcc-dock-item,.gcc-utility){all:unset!important;box-sizing:border-box!important;font-family:inherit!important;font-weight:300!important;line-height:1.2!important;color:#f5f6f8!important;cursor:pointer!important;text-shadow:none!important;animation:none!important}
#game-hub-control-center :is(.gcc-card,.gcc-dock-item,.gcc-utility)::before,#game-hub-control-center :is(.gcc-card,.gcc-dock-item,.gcc-utility)::after{display:none!important;content:none!important}
#game-hub-control-center .gcc-card{position:relative!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:flex-end!important;flex:1 1 0!important;width:0!important;min-width:0!important;height:100%!important;padding:1.3vw!important;overflow:hidden!important;border:1px solid #d3dfef42!important;border-radius:1.2vw!important;background:linear-gradient(125deg,rgba(26,32,42,.94),rgba(16,21,30,.89))!important;box-shadow:inset 0 0 7px #dce5f510,0 7px 20px #0004!important;transition:border-color 130ms ease,box-shadow 130ms ease!important}
#game-hub-control-center .gcc-card>svg{position:absolute;top:1.25vw;left:1.25vw;width:2vw;height:2vw}
#game-hub-control-center .gcc-card small{color:#a6aab3;font-family:inherit;font-size:1.48vw;font-weight:300;line-height:1.25}
#game-hub-control-center .gcc-card strong{font-family:inherit;font-weight:400;font-size:1.85vw;line-height:1.2;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:.3vw}
#game-hub-control-center .gcc-card-center{position:absolute;left:10%;right:10%;top:26%;height:41%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.7vw}
#game-hub-control-center .gcc-card-center>svg{width:4.2vw;height:4.2vw}
#game-hub-control-center .gcc-avatars{display:flex;align-items:center;justify-content:center;padding-left:.5vw}
#game-hub-control-center .gcc-avatars>span{display:grid;place-items:center;width:4.55vw;height:4.55vw;border-radius:50%;overflow:hidden;background:#303745;border:1px solid #d7e0ed20;margin-left:-.5vw}
#game-hub-control-center .gcc-avatars img{width:100%;height:100%;object-fit:cover}
#game-hub-control-center .gcc-avatars svg{width:62%;height:62%}
#game-hub-control-center .gcc-pill{font-size:1.2vw;line-height:1.2;border:1px solid #f0f2f4;border-radius:2em;padding:.25em .85em;max-width:100%;white-space:nowrap}
#game-hub-control-center .gcc-badge{position:absolute;top:3%;left:57%;border-radius:50%;min-width:2.1vw;height:2.1vw;display:grid;place-items:center;padding:0 .25vw;background:#3789fa;color:white;font-size:1.35vw;box-shadow:inset 0 0 4px #ffffff40}
#game-hub-control-center .gcc-dock{position:absolute;left:12.9%;right:12%;top:83.3%;height:10.3%;pointer-events:auto}
#game-hub-control-center .gcc-dock-row{display:flex!important;flex-direction:row!important;justify-content:space-between!important;align-items:center!important;width:100%!important;height:100%!important;min-width:0!important;gap:0!important}
#game-hub-control-center .gcc-dock-item{position:relative!important;display:grid!important;place-items:center!important;flex:0 0 5.5vw!important;width:5.5vw!important;height:5.5vw!important;min-width:0!important;max-width:5.5vw!important;padding:1.45vw!important;border:2px solid transparent!important;border-radius:50%!important;background:transparent!important;box-shadow:none!important;overflow:visible!important;transition:border-color 130ms ease,box-shadow 130ms ease!important}
#game-hub-control-center .gcc-dock-item>svg{width:87.5%!important;height:87.5%!important;filter:none!important;color:#FFFFFF!important}
#game-hub-control-center .gcc-dock-item>.gcc-dock-avatar{width:87.5%!important;height:87.5%!important;object-fit:cover!important;border-radius:50%!important;pointer-events:none!important}
#game-hub-control-center .gcc-dock-label{position:absolute;bottom:calc(100% + .7vh);left:50%;transform:translateX(-50%);white-space:nowrap;font-size:1.6vw;font-weight:300;line-height:1.25;color:#f6f7fa;opacity:0;pointer-events:none}
#game-hub-control-center .gcc-selected .gcc-dock-label{opacity:1}
#game-hub-control-center .gcc-dock-item:is(.gbs-focus,:focus,:focus-visible){background:transparent!important;border-color:#fff!important;outline:none!important;box-shadow:0 0 9px #dbe7ff55,inset 0 0 6px #e6efff14!important;transform:scale(1.025)!important}
#game-hub-control-center .gcc-card:is(.gbs-focus,:focus,:focus-visible){border-color:#f5f7fa!important;outline:none!important;box-shadow:0 0 0 1px #f5f7fa70,inset 0 0 8px #ffffff12!important}
#game-hub-control-center footer{position:absolute;left:8.55%;right:8%;bottom:1.2%;display:flex;align-items:center;justify-content:space-between;gap:1vw;font-size:.85vw;color:#b0b8c6;pointer-events:auto;opacity:.55;transition:opacity 130ms ease}
#game-hub-control-center footer:focus-within,#game-hub-control-center footer:hover,#game-hub-control-center footer:has(.gbs-focus){opacity:1}
#game-hub-control-center .gcc-utilities{margin-left:auto!important;display:flex!important;flex-direction:row!important;align-items:center!important;flex-wrap:nowrap!important;gap:1.1vw!important}
#game-hub-control-center .gcc-bottom>footer[data-cc-row="2"]{width:auto!important;height:auto!important;min-height:0!important;margin:0!important;padding:0!important;transform:none!important;background:transparent!important}
#game-hub-control-center .gcc-bottom>footer[data-cc-row="2"]>span,#game-hub-control-center .gcc-utilities>.gcc-utility{white-space:nowrap!important;flex-shrink:0!important}
#game-hub-control-center .gcc-utility{display:block!important;font-size:.85vw!important;padding:.25em .35em!important;border-bottom:1px solid transparent!important;background:transparent!important}
#game-hub-control-center .gcc-utility:is(.gbs-focus,:focus,:focus-visible){border-bottom-color:white!important;outline:none!important}
#game-hub-control-center :is(.gcc-card,.gcc-dock-item,.gcc-utility):disabled{opacity:.4!important;cursor:default!important}
#game-hub-control-center .gcc-error{position:absolute;left:20%;right:20%;top:15%;padding:1em;background:#141b29f5;border:1px solid #ccd8e440;border-radius:.6vw;text-align:center;font-size:1.3vw}
@keyframes gcc-reveal{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
#game-hub-control-center[data-motion="false"],#game-hub-control-center[data-motion="false"] *{animation:none!important;transition:none!important}
@media(prefers-reduced-motion:reduce){#game-hub-control-center,#game-hub-control-center *{animation:none!important;transition:none!important}}

#game-hub-control-center .gcc-section{height:100%;width:100%;max-width:55vw;padding:1.25vw 1.5vw;background:linear-gradient(125deg,#1b222fef,#101722ed);border:1px solid #d3dfef35;border-radius:1vw;display:flex;flex-direction:column;box-shadow:0 8px 25px #0003;animation:gcc-reveal 140ms ease-out}
#game-hub-control-center .gcc-section h2{font-size:1.65vw;font-weight:300;margin:0 0 .7vw;color:#fff}
#game-hub-control-center .gcc-section p{font-size:1.15vw;color:#acb5c3;margin:1vw 0}
#game-hub-control-center .gcc-section-list{min-height:0;flex:1;overflow-y:auto;padding:3px;scrollbar-width:thin}
#game-hub-control-center .gcc-section-item{display:block!important;width:100%!important;padding:.7vw .8vw!important;font-size:1.25vw!important;border-bottom:1px solid #ffffff12!important;border-radius:.35vw!important;position:relative!important}
#game-hub-control-center .gcc-section-item span{display:block;font-size:1vw;color:#aeb8c6;margin-top:.25em}
#game-hub-control-center .gcc-section-item:is(.gbs-focus,:focus),#game-hub-control-center .gcc-setting-row:is(.gbs-focus,:focus){background:#ffffff0c!important;outline:1px solid #f4f5f6b0!important;outline-offset:-1px!important;border-color:transparent!important}
#game-hub-control-center .gcc-section-fallback{margin-top:.6vw!important;font-size:1vw!important;align-self:flex-start!important}
#game-hub-control-center progress{display:block;width:100%;height:3px;margin-top:.6vw;border:none;border-radius:2px;overflow:hidden;background:#ffffff17}
#game-hub-control-center progress::-webkit-progress-bar{background:#ffffff17}#game-hub-control-center progress::-webkit-progress-value{background:#d9e5f7}
#game-hub-control-center .gcc-unread-dot{display:inline-block;width:.35vw;height:.35vw;border-radius:50%;background:#deebff;margin-right:.6vw;vertical-align:middle}
#game-hub-control-center .gcc-dock-count{position:absolute;right:.6vw;top:.5vw;background:#347cdb;color:white;font-size:.8vw;border-radius:2em;padding:.12em .45em}
#game-hub-control-center .gcc-settings{position:absolute;inset:10% 9% 7%;background:linear-gradient(115deg,#111925fa,#0c111bfa);border:1px solid #ffffff16;border-radius:.8vw;padding:2.2vw 2.7vw;animation:gcc-reveal 150ms ease-out}
#game-hub-control-center .gcc-settings h1{font-size:2.5vw;font-weight:300;margin:0 0 2vw;color:white}
#game-hub-control-center .gcc-settings-columns{display:grid;grid-template-columns:32% minmax(0,1fr);gap:4vw;height:70%;min-height:0}
#game-hub-control-center .gcc-settings-columns>div{overflow-y:auto;scrollbar-width:thin;padding:2px}
#game-hub-control-center .gcc-settings h2{font-size:1.55vw;font-weight:300;margin:0 0 1vw}
#game-hub-control-center .gcc-setting-row{display:block!important;width:100%!important;padding:.85vw 1vw!important;font-size:1.25vw!important;border-radius:.35vw!important;border-bottom:1px solid #ffffff10!important}
#game-hub-control-center .gcc-category-active{color:#fff!important;background:#ffffff05!important}
#game-hub-control-center .gcc-settings p{color:#98a5b8;font-size:1vw;margin:1.2vw 0}
#game-hub-control-center .gcc-settings-help{margin-bottom:.5vw!important}
#game-hub-control-center[data-glass=false]{backdrop-filter:none} #game-hub-control-center .gcc-vertical-list{display:flex!important;flex-direction:column!important;min-width:0}

#game-hub-control-center .gcc-system-list{height:76%;overflow-y:auto;scrollbar-width:thin;padding:3px}
#game-hub-control-center .gcc-system-list h2{font-size:1.15vw;color:#b9c4d3;margin:1vw .7vw .35vw}
#game-hub-control-center .gcc-setting-row small{display:block;font-size:.95vw;line-height:1.35;color:#9eabbf;margin-top:.3vw}
#game-hub-control-center .gcc-row-icon{float:left;width:2.3vw;height:2.3vw;margin:.15vw .8vw .15vw 0;display:grid;place-items:center}
#game-hub-control-center .gcc-row-icon>svg,#game-hub-control-center .gcc-row-icon>img{max-width:100%;max-height:100%;object-fit:cover;border-radius:50%}
#game-hub-control-center .gcc-plugin-host{height:82%;display:flex;flex-direction:column;min-height:0}
#game-hub-control-center .gcc-plugin-host h2{margin:0;font-size:1.6vw;font-weight:300}
#game-hub-control-center .gcc-plugin-body{min-height:0;flex:1;overflow:auto;padding:1vw 1.5vw;border:1px solid #ffffff16;border-radius:.6vw;background:#ffffff03;font-size:1.05vw;scrollbar-width:thin}
.gbs-notice-toast{position:fixed;right:3vw;top:3vh;z-index:2147483100;pointer-events:none;max-width:29vw;display:flex;gap:.8vw;padding:1vw 1.3vw;border:1px solid #d9e5ff30;border-radius:.7vw;background:#141d2aee;color:#f4f6fa;box-shadow:0 6px 25px #0004;font:300 1.05vw/1.35 "Segoe UI",sans-serif;animation:gcc-reveal 180ms ease-out}
.gbs-notice-toast img{width:2.8vw;height:2.8vw;border-radius:50%}.gbs-notice-toast strong{font-weight:400}.gbs-notice-toast p{margin:.3vw 0 0;color:#b9c7d9}
.gbs-notice-toast[data-motion=false]{animation:none}@media(prefers-reduced-motion:reduce){.gbs-notice-toast{animation:none}}

.ModalOverlayContent:has(>div>.gbs-modal-owner){inset:0!important;height:100%!important}
.ModalOverlayContent>div:has(>.gbs-modal-owner){position:fixed!important;inset:0!important;padding:0!important;margin:0!important;overflow:visible!important;transform:none!important}
.gbs-modal-owner .DialogContent_InnerWidth{padding:0!important;height:100%!important;max-width:none!important}
.gbs-modal-owner{transform:none!important;animation:none!important;margin:0!important;min-height:0!important;max-height:none!important;isolation:isolate;position:relative;background:transparent!important;box-shadow:none!important;border:none!important;max-width:none!important;width:100vw!important;height:100vh!important;padding:0!important}
.gbs-modal-owner #game-hub-control-center{z-index:1}
#game-hub-control-center{overscroll-behavior:contain;pointer-events:auto}
#game-hub-control-center :is(.gcc-plugin-body,.gcc-system-list,.gcc-settings-columns>div){overscroll-behavior:contain}
/* Fourth social card: retain each original card's width; scroll on narrow windows. */
#game-hub-control-center .gcc-preview[data-preview="social"]{width:134.5%;max-width:calc(100vw - 10vw)}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-card-row{overflow-x:auto!important;overflow-y:hidden;scroll-snap-type:x proximity;scrollbar-width:none;padding:3px!important;box-sizing:border-box}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-card-row::-webkit-scrollbar{display:none}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-card-row>.gcc-card,
#game-hub-control-center .gcc-news-wrap{flex:0 0 max(280px,21.46vw)!important;width:max(280px,21.46vw)!important;min-width:0;scroll-snap-align:start;height:100%}
#game-hub-control-center .gcc-news-wrap>.gcc-news{width:100%!important;height:100%!important}
#game-hub-control-center .gcc-news-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.62}
#game-hub-control-center .gcc-news-content{position:relative;display:flex;flex-direction:column;gap:.3vw;width:100%;z-index:1}
#game-hub-control-center .gcc-news{background:linear-gradient(125deg,rgba(26,32,42,.94),rgba(16,21,30,.89))!important}
#game-hub-control-center .gcc-news-content:before{content:'';position:absolute;inset:-4vw -1.3vw -1.3vw;background:linear-gradient(transparent,rgba(5,10,19,.95) 45%);z-index:-1}
#game-hub-control-center .gcc-news .gcc-news-content small{color:white}
#game-hub-control-center .gcc-news .gcc-news-content strong{font-size:1.4vw;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
#game-hub-control-center .gcc-news-category,#game-hub-control-center .gcc-news-date{font-size:max(11px,.8vw);color:#d3d9e4}
#game-hub-control-center .gcc-news-headline{font-size:max(13px,1vw);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
@media(prefers-reduced-motion:reduce){#game-hub-control-center .gcc-card-row{scroll-behavior:auto!important}}
${ambientCSS}
`;
