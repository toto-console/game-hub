import {consoleMotion} from './console-motion';
export const storeStyle=`
.cs-store{position:fixed;inset:0;z-index:20;background:radial-gradient(ellipse at 85% 80%,#2c2e2e,transparent 54%),linear-gradient(112deg,#0b1011,#151718 65%,#101011);color:#f5f5f5;font-family:inherit}
.cs-store header{position:relative;height:12vh;display:flex;align-items:center;gap:2.3vw;padding-left:2.5vw;font-size:2.2vw;font-weight:300}.cs-store header svg,.cs-store header img{width:4.2vw;height:4.2vw;object-fit:cover}
.cs-store nav{position:relative;margin:0 8.9vw;height:8vh;display:flex;align-items:center;gap:2.4vw}.cs-store nav aside{flex:1}.cs-store nav .cs-control{font-size:1.45vw;color:#aaa}.cs-store nav .active,.cs-store nav .cs-focus{color:white}
.cs-control{position:relative;cursor:pointer;border-radius:3px}.cs-focus,.cs-control:focus-visible{outline:2px solid #edf2f8;outline-offset:3px}.cs-scroll{position:absolute;inset:21vh 0 0;padding:0 8.9vw 10vh;overflow:auto;scrollbar-width:none;scroll-padding:4vh}.cs-store:has(article) .cs-scroll{top:14vh}
.cs-scroll section{margin:3vh 0 5vh}.cs-store h2{font-size:1.55vw;font-weight:400;margin:0 0 1.7vh}.cs-layout{display:grid;gap:1.6vw}.mosaic{grid-template-columns:2.13fr 1fr 2.13fr 1fr;grid-template-rows:repeat(2,12.35vw);grid-auto-flow:column}.mosaic>:is(:first-child,:nth-child(4)){grid-row:span 2}.cs-layout img{width:100%;height:100%;object-fit:cover;display:block}.cs-game span,.cs-editorial strong{position:absolute;inset:auto 0 0;padding:2vw 1vw .8vw;background:linear-gradient(transparent,#080808df);font-size:1.3vw}.cs-game:not(.cs-focus):not(:hover) span{opacity:0}.strip{display:flex;overflow:auto;scrollbar-width:none;padding:4px;margin:-4px;width:calc(100% + 8vw)}.strip>*{flex:none;width:26.3vw;aspect-ratio:1}.three,.four,.five,.two{grid-template-columns:repeat(3,1fr)}.four{grid-template-columns:repeat(4,1fr)}.five{grid-template-columns:repeat(5,1fr);gap:1vw}.two{grid-template-columns:repeat(2,1fr)}.three>*,.four>*,.five>*{aspect-ratio:1;background:#272829}.banner>*{height:31vw}.cs-editorial{overflow:hidden}/* TrailerHero attaches to the artwork parent and applies relative positioning.
   Keep that host behind Store controls at the full viewport size. */
.cs-store>.cs-product-backdrop{position:absolute!important;inset:0;width:100%;height:100%;overflow:hidden;pointer-events:none;isolation:isolate;z-index:-1}
.cs-store:has(>.cs-product-backdrop){isolation:isolate}
.cs-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.72}.cs-store:has(.cs-bg){background:#050607}.cs-scroll article{position:relative;padding:11vh 0 8vh;min-height:56vh;text-shadow:0 1px 6px black}.cs-logo{display:block;width:29vw;height:16vh;object-fit:contain;object-position:left center}.cs-scroll article p{width:43vw}.cs-actions{display:flex;gap:1vw}.cs-actions>*{padding:1vw 2vw;border-radius:99px;background:#242529}.cs-actions>.cs-focus{background:white;color:#111}.cs-scroll summary{position:absolute;right:0;bottom:10vh;background:#111b;padding:1vw}.cs-viewer{position:absolute;inset:0;background:#050505;display:grid;place-items:center}.cs-viewer img{max-width:100%;max-height:100vh}.legal{background:#171819;padding:2vw}

.cs-cover{position:absolute;inset:0;overflow:hidden;background:#24282c center/cover;display:grid;place-items:center}.cs-cover b{position:absolute;bottom:12%;text-align:center;padding:0 6%;color:white;text-shadow:0 1px 5px black}.cs-store .cs-cover img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.cs-store .cs-cover .cs-fill{filter:blur(16px) brightness(.55);transform:scale(1.2)}.cs-store .cs-cover .cs-capsule{object-fit:contain}.cs-store .cs-cover .cs-brand{inset:auto 9% 9%;width:82%;height:40%;object-fit:contain;filter:drop-shadow(0 1px 3px #111)}.cs-story{background:#212326;padding:1em;margin-bottom:.6em}.cs-story small{float:right;color:#bbb}.cs-excerpt{overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.cs-account-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1.4vw}.cs-account-art{aspect-ratio:1}.cs-account-action{padding:.5em .8em;background:#292c30;margin:.25em}.cs-toast{position:fixed;right:4vw;top:4vh;background:#191b20;padding:1em;z-index:3}.cs-store .strip>.cs-trailer-preview{width:46.75vw;aspect-ratio:16/9;align-self:center;background:black}
.cs-trailer-preview img{position:absolute;inset:0}
.cs-trailer-preview b{position:absolute;bottom:.75em;left:.75em;padding:.3em .8em;border-radius:2em;background:#080808c9;color:white}
.cs-viewer:has(video){box-sizing:border-box;padding-bottom:10vh}
.cs-viewer video{width:min(96vw,152vh);aspect-ratio:16/9;height:auto;object-fit:contain;background:black}.cs-media-tools{position:absolute;bottom:3vh;display:flex;background:#191a1b}.cs-media-tools>*{padding:.8em}.cs-query{max-width:45vw}

.cs-store header img{object-fit:contain}.cs-store:has(nav) .cs-scroll{top:22vh}.cs-store:not(:has(nav)) .cs-scroll{top:14vh}.cs-scroll{overscroll-behavior:contain;padding-top:1vh;box-sizing:border-box}.cs-scroll article .cs-actions>:first-child{min-width:9vw;text-align:center}.cs-scroll article [aria-label="More options"]{width:3.5vw;height:3.5vw;padding:0;display:grid;place-items:center}.cs-scroll article small{text-transform:capitalize}.cs-account-grid h3{font-size:1.2vw;line-height:1.3;height:2.6em;margin:.7em 0 .2em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.cs-account-grid p{margin:.3em 0;min-height:1.4em}.cs-account-grid .cs-account-action,.cs-recent .cs-control{display:inline-block;border-radius:2em;padding:.45em .8em;font-size:.85em}.cs-store .cs-category{display:grid;align-content:center;justify-items:center;gap:1em;background:radial-gradient(at 50% 25%,#334255,#19202a 80%);text-align:center}.cs-category svg{font-size:4vw}.cs-recent{display:flex;gap:.6em;align-items:center;margin:1em 0}.cs-recent .cs-control{background:#292c30}.cs-store input:focus-visible{outline:2px solid white}.cs-scroll article p{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.cs-filter-options{flex-wrap:wrap}.cs-store [aria-pressed=true]{box-shadow:inset 0 0 0 1px #c5d3e4}.cs-store .cs-account-art{overflow:visible}

.cs-store .cs-scroll{contain:paint}.cs-editions{display:flex;flex-wrap:wrap}.cs-editions .cs-control{max-width:36em;background:#242529;padding:.8em 1.4em;border-radius:2em}
.cs-store .cs-story{width:fit-content;max-width:min(56vw,52em);box-sizing:border-box}
.cs-store .cs-story small{float:none;margin-inline-start:1em}
.cs-store .cs-story:is([data-story-focus],.cs-focus,:focus,:focus-visible){outline:0;box-shadow:inset 3px 0 #edf2f8;background:#30353c}
.cs-store .cs-control:focus{outline:2px solid #edf2f8;outline-offset:2px}
.cs-store .cs-actions>.cs-toast{position:fixed;max-width:32vw;padding:.65em 1em;pointer-events:none}
@media (prefers-reduced-motion:no-preference){
 .cs-store[data-motion=true] .cs-game .cs-cover{transition:transform ${consoleMotion.tileMs}ms ${consoleMotion.easeOut};border-radius:inherit}
 .cs-store[data-motion=true] .cs-game:is(.cs-focus,:focus-visible){z-index:1;outline:0}
 .cs-store[data-motion=true] .cs-game:is(.cs-focus,:focus-visible) .cs-cover{transform:scale(1.035);outline:2px solid #f1f4f8;outline-offset:2px}
 .cs-store[data-motion=true] nav .cs-control{transition:color 140ms ease-out}
 .cs-store[data-motion=true] nav .active::after{content:"";position:absolute;left:8%;right:8%;bottom:-.35em;height:2px;border-radius:2px;background:currentColor;animation:cs-tab-line 180ms ease-out}
 .cs-store[data-motion=true] .cs-game span{transition:opacity ${consoleMotion.focusMs}ms ease-out}
 .cs-store[data-motion=true] .cs-bg,.cs-store[data-motion=true] .cs-viewer{animation:cs-reveal 230ms ease-out}
}
@keyframes cs-tab-line{from{opacity:0;transform:scaleX(.65)}to{opacity:1;transform:scaleX(1)}}
@keyframes cs-reveal{from{opacity:0} }
`;

