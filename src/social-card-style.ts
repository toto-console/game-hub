/** Scroll only genuinely overflowing rows, never recenter visible cards. */
export function revealSocialCard(card:HTMLElement,smooth:boolean){
 const row=card.closest<HTMLElement>('.gcc-card-row');if(!row||row.scrollWidth<=row.clientWidth+1)return;
 const a=card.getBoundingClientRect(),b=row.getBoundingClientRect();
 const delta=a.left<b.left?a.left-b.left:a.right>b.right?a.right-b.right:0;
 if(delta)row.scrollBy({left:delta,behavior:smooth?'smooth':'auto'});
}
export const socialCardCSS=`
/* Higher specificity than shared preview focus styling; viewport centered on screen. */
#game-hub-control-center .gcc-cards>.gcc-preview[data-preview="social"]{left:calc(41.45vw - min(42vw,800px));right:auto;width:min(84vw,1600px);max-width:none;height:100%;padding:4px}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-card-row{gap:clamp(12px,.9vw,18px)!important;width:100%!important;padding:4px!important;overflow-x:auto!important;overflow-y:hidden;scroll-snap-type:none}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-card-row>.gcc-card,#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-news-wrap{flex:0 0 calc((100% - 3 * clamp(12px,.9vw,18px)) / 4)!important;width:calc((100% - 3 * clamp(12px,.9vw,18px)) / 4)!important;min-width:0!important;height:100%;border-radius:clamp(10px,.8vw,16px)!important}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-card{transform:none!important;transition:border-color 150ms ease,box-shadow 150ms ease!important;padding:clamp(14px,1.3vw,26px)!important}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-card[data-gh-focus]{transform:none!important;outline:none!important;border-color:#fff!important;box-shadow:0 0 0 1px #ffffff90,0 0 9px #ffffff18!important}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-card small{font-size:clamp(16px,1.25vw,25px)}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-card strong{font-size:clamp(18px,1.55vw,30px)}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-news{isolation:isolate;border-radius:inherit!important}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-news-art{z-index:0;opacity:.9;object-fit:cover;object-position:center;transition:opacity 160ms ease}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-news[data-gh-focus] .gcc-news-art{opacity:1}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-news-shade{position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(180deg,#050a130a 20%,#050a132b 40%,#050a13d9 76%,#050a13f2)}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-news-label{z-index:2;position:absolute;top:clamp(14px,1.3vw,26px);left:clamp(14px,1.3vw,26px);font-size:clamp(13px,.95vw,18px)!important;text-shadow:0 1px 4px #000}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-news-content{z-index:2;gap:5px;max-height:62%}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-news-content:before{display:none}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-news-content strong{font-size:clamp(18px,1.25vw,25px);line-height:1.2;margin:0;-webkit-line-clamp:2}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-news-category{font-size:clamp(11px,.7vw,14px);letter-spacing:.09em;text-transform:uppercase;color:#cbd4e3}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-news-headline{font-size:clamp(14px,.95vw,19px);line-height:1.3;-webkit-line-clamp:2}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-news-date{font-size:clamp(12px,.75vw,15px);color:#b9c2d0}
#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-card[data-gh-focus]::after{background:linear-gradient(135deg,#ffffff16,transparent 34%,#ffffff07 50%,transparent 67%);background-size:240% 240%;box-shadow:inset 0 1px 0 #ffffff38;animation:gcc-card-reflection 5s ease-in-out infinite}
#game-hub-control-center .gcc-preview[data-preview="social"] [data-news-expanded=true] .gcc-news-content{max-height:calc(100% - 32px);overflow-y:auto}
#game-hub-control-center .gcc-preview[data-preview="social"] [data-news-expanded=true] .gcc-news-headline{display:block;-webkit-line-clamp:unset}
#game-hub-control-center .gcc-preview[data-preview="social"] [data-news-expanded=true] .gcc-news-shade{background:#050a13d9}
@keyframes gcc-card-reflection{0%,100%{background-position:0% 0%}50%{background-position:100% 100%}}
@media(max-width:999px){#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-card-row>.gcc-card,#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-news-wrap{flex-basis:calc((100% - 24px) / 3)!important;width:calc((100% - 24px) / 3)!important}}
@media(prefers-reduced-motion:reduce){#game-hub-control-center .gcc-preview[data-preview="social"] .gcc-card::after{animation:none!important}}
#game-hub-control-center[data-motion=false] .gcc-preview[data-preview="social"] .gcc-card::after{animation:none!important}
`;
