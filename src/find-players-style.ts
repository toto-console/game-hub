import type {CSSProperties} from 'react';
// Keep the approved discovery background outside PS5 Dashboard's CSSOM repaint.
export const findPlayersVariables={'--fp-background':'radial-gradient(ellipse at 26% -8%,#b8bcff 0,rgba(111,144,229,.85) 16%,transparent 48%),radial-gradient(ellipse at 13% 76%,#3061c2 0,transparent 48%),linear-gradient(120deg,#152953,#11285e 53%,#06102f)'} as CSSProperties;
export const findPlayersCSS=`
.fp-screen{position:relative;isolation:isolate;width:100%;height:100%;min-height:0;overflow:hidden;color:#f7f9ff;font:300 clamp(16px,1.65vw,64px)/1.4 "Segoe UI",sans-serif;background:var(--fp-background)}
.fp-screen:before,.fp-screen:after{content:"";position:absolute;z-index:-1;pointer-events:none;width:160%;height:55%;bottom:-45%;left:-25%;border-radius:50%;border-top:1px solid #83bfff;box-shadow:0 -8px 25px #3c83ea88,0 -1px 4px #b8e2ff;transform:rotate(-9deg)}
.fp-screen:after{left:-70%;bottom:-44%;transform:rotate(7deg);opacity:.35}
.fp-heading{position:absolute;top:4.8%;left:6.3%;display:flex;align-items:center;gap:2vw;font-size:1.3em}.fp-heading .fp-brand{font-size:.72em;letter-spacing:.25em}.fp-heading i{height:1.2em;width:1px;background:#c4d4fb}.fp-heading h2{font:inherit;margin:0;color:inherit}
.fp-search-area{position:absolute;top:16%;left:6.3%;right:5.2%}.fp-search-line{display:flex;align-items:center;gap:1vw;border-bottom:1px solid #c4dcff;padding-bottom:1vh;box-shadow:0 6px 12px -12px white}.fp-search-line svg{width:1.8vw;min-width:24px;fill:none;stroke:white;stroke-width:2}.fp-search-line .gbs-text-field{flex:1;min-width:0}.fp-screen .fp-search-line input{background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;color:white!important;font:inherit!important;width:100%;padding:.3em!important;box-sizing:border-box}.fp-screen .fp-search-line input::placeholder{color:#eef2ff;opacity:.95}.fp-search-line>input{flex:1;min-width:0}
.fp-screen .gbs-button{font:inherit;color:inherit;background:transparent;border:1px solid transparent;box-shadow:none;border-radius:.4em;padding:.4em .8em;margin:0;min-width:0}
.fp-screen .gbs-button:focus,.fp-screen .gbs-button.gpfocus,.fp-screen .gbs-button:hover{outline:1px solid white;outline-offset:2px;background:#ffffff0c}
.fp-screen .fp-submit{font-size:.7em;opacity:.85}.fp-main{position:absolute;top:28%;left:0;right:0;bottom:16%}.fp-caption{font-size:.86em;margin:0 6.9% 1.5vh}.fp-results{display:flex;flex-direction:row;gap:1.15vw;overflow-x:auto;overflow-y:hidden;padding:0.6vh 6.3% 2vh;scrollbar-width:thin;scroll-padding-inline:6.3%;max-width:100%;box-sizing:border-box}
.fp-card-wrap{flex:0 0 21.2vw}.fp-screen .fp-card{display:flex;flex-direction:column;align-items:flex-start;width:100%;height:20.7vw;box-sizing:border-box;border:1px solid #98b8ff55;border-radius:1.15vw;padding:2.15vw 1.85vw;background:linear-gradient(140deg,#9abfff19,#071c4222);text-align:left}
.fp-card img,.fp-avatar-fallback{width:8.7vw;height:8.7vw;border-radius:50%;object-fit:cover;align-self:center;margin-bottom:1.6vw}.fp-avatar-fallback{background:#ffffff18;display:grid;place-items:center;font-size:3em}
.fp-screen .fp-card strong{font-weight:300;font-size:.83em;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fp-card small{font-size:.68em;margin-top:auto;opacity:.92}
.fp-screen .fp-card:focus,.fp-screen .fp-card.gpfocus{outline:1.5px solid white;outline-offset:0;border-color:#f4fbff;box-shadow:0 0 8px #fff,0 0 20px #74adff,inset 0 0 16px #bad6ff44;background:#bfd7ff18}
.fp-state{margin:1em 6.5%;max-width:70%;font-size:.75em;opacity:.9}.fp-page{display:flex;gap:1em;margin:1vh 6.3%;font-size:.65em}.fp-request-tabs{display:flex;gap:2em;font-size:.85em}.fp-request-tabs [aria-pressed=true]{border-bottom:1px solid white}
.fp-footer{position:absolute;bottom:3%;left:6.3%;right:5%;display:flex;justify-content:space-between;align-items:center;font-size:.6em;opacity:.85}
.fp-detail{position:absolute;z-index:3;inset:16% auto 12% 32%;width:36%;box-sizing:border-box;overflow:auto;padding:2vw;border:1px solid #b2ceff88;border-radius:1vw;background:#091933f5;box-shadow:0 0 0 100vmax #02081988;text-align:center}.fp-detail>img{width:6vw;height:6vw;border-radius:50%;object-fit:cover}.fp-detail h3{font:inherit;margin:.4em}.fp-detail p{font-size:.65em;overflow-wrap:anywhere}.fp-detail .gbs-actions{display:flex;flex-direction:column;margin-top:1em;gap:.4em;font-size:.8em}.fp-action-error,.fp-action-status{position:absolute;z-index:4;bottom:6%;left:20%;right:20%;font-size:.65em;text-align:center}
.gq-content>.fp-screen{font-size:clamp(14px,1.1vw,28px)}.gq-content .fp-heading{top:4%;gap:.7em}.gq-content .fp-heading .fp-brand,.gq-content .fp-heading i{display:none}.gq-content .fp-search-area{top:14%}.gq-content .fp-main{top:29%;bottom:14%;overflow:auto}.gq-content .fp-card-wrap{flex-basis:72%}.gq-content .fp-card{height:15vw;min-height:200px;padding:1em}.gq-content .fp-card img,.gq-content .fp-avatar-fallback{width:6vw;height:6vw}.gq-content .fp-state{max-width:88%}.gq-content .fp-page{flex-wrap:wrap}.gq-content .fp-detail{inset:10% 4%;width:auto}

.gbs-root .fp-screen .gbs-button{border:1px solid transparent!important;border-radius:.4em!important;background:transparent!important;padding:.4em .8em!important;min-height:0!important;box-shadow:none!important;color:#f7f9ff!important;font-weight:300!important}
.gbs-root .fp-screen .fp-heading h2{font:300 1.1em/1.4 "Segoe UI",sans-serif;margin:0;letter-spacing:0}
.gbs-root .fp-screen .fp-main .fp-caption{margin:0 6.9% 1.5vh;color:#f7f9ff}
.gbs-root .fp-screen .fp-card{width:100%!important;border:1px solid #98b8ff55!important;border-radius:1.15vw!important;padding:2.15vw 1.85vw!important;background:linear-gradient(140deg,#9abfff19,#071c4222)!important}
.gbs-root .fp-screen .fp-card:focus,.gbs-root .fp-screen .fp-card.gpfocus{outline:1.5px solid white!important;outline-offset:0!important;border-color:#f4fbff!important;box-shadow:0 0 8px #fff,0 0 20px #74adff,inset 0 0 16px #bad6ff44!important;background:#bfd7ff18!important}
.gbs-root .fp-screen .gbs-button:not(.fp-card):focus,.gbs-root .fp-screen .gbs-button:not(.fp-card).gpfocus{outline:1px solid white!important;outline-offset:2px!important}
.gbs-root .fp-screen .fp-state{margin:1em 6.5%;color:#f7f9ff}.gbs-root .fp-screen .fp-submit{font-size:.7em!important}
.gbs-root .fp-screen .fp-detail h3{font:inherit;margin:.4em}.gbs-root .fp-screen .fp-detail p{color:#f7f9ff}
.gq-content .fp-screen .fp-card{padding:1em!important}

.gbs-root .fp-screen .fp-card{transition:none!important}
.gbs-root .fp-screen .fp-card:focus-visible,.gbs-root .fp-screen .fp-card.gbs-focus{outline:1.5px solid white!important;outline-offset:0!important;border-color:#f4fbff!important;box-shadow:0 0 8px #fff,0 0 20px #74adff,inset 0 0 16px #bad6ff44!important;background:#bfd7ff18!important}



/* Both background treatments stay mounted. Only the opaque blue overlay blends;
   the root/dark ambient and all content remain stable, including during reversal. */
.gbs-root.gbs-room>.gbs-discovery-background{position:absolute;inset:0;z-index:-1;overflow:hidden;pointer-events:none;background:var(--fp-background);opacity:0;transition:opacity 300ms ease-in-out}
.gbs-root.gbs-room[data-discovery=true]>.gbs-discovery-background{opacity:1}
.gbs-root.gbs-room>.gbs-discovery-background:before,
.gbs-root.gbs-room>.gbs-discovery-background:after{content:"";position:absolute;inset:auto;pointer-events:none;width:160%;height:55%;bottom:-45%;left:-25%;border-radius:50%;border-top:1px solid #83bfff;box-shadow:0 -8px 25px #3c83ea88,0 -1px 4px #b8e2ff;transform:rotate(-9deg);background:none;opacity:1;animation:none}
.gbs-root.gbs-room>.gbs-discovery-background:after{left:-70%;bottom:-44%;transform:rotate(7deg);opacity:.35}
.gbs-root.gbs-room[data-motion=false]>.gbs-discovery-background{transition:none}
@media(prefers-reduced-motion:reduce){.gbs-root.gbs-room>.gbs-discovery-background{transition:none}}
.gbs-root .fp-screen[data-main=true]{flex:1;display:flex;flex-direction:column;min-height:0;height:auto;font:inherit;color:inherit;background:transparent;isolation:auto;overflow:hidden}
.fp-screen[data-main=true]:before,.fp-screen[data-main=true]:after,.fp-screen[data-main=true]>.fp-heading{display:none}
.fp-screen[data-main=true] .fp-search-area{position:relative;inset:auto;flex:none;margin:6px 5px 2vh}
.fp-screen[data-main=true] .fp-main{position:relative;inset:auto;flex:1;min-height:0;overflow:auto;padding:5px}
.gbs-root .fp-screen[data-main=true] .fp-main .fp-caption{margin:0 0 1.5vh;font:inherit;color:inherit}
.fp-screen[data-main=true] .fp-results{padding:6px 6px 2vh;gap:1.2vw;scroll-padding-inline:6px}
.fp-screen[data-main=true] .fp-card-wrap{flex-basis:clamp(200px,21.2vw,540px)}
.gbs-root .fp-screen[data-main=true] .fp-card{height:clamp(230px,34vh,620px);padding:2vh 1.5vw!important;border-radius:16px!important}
.fp-screen[data-main=true] .fp-card img,.fp-screen[data-main=true] .fp-avatar-fallback{width:clamp(70px,8vw,190px);height:clamp(70px,8vw,190px);margin-bottom:2vh}
.fp-screen[data-main=true] .fp-card strong{font-size:1.05em;font-weight:400}
.fp-screen[data-main=true] .fp-card small{font-size:.85em}
.gbs-root .fp-screen[data-main=true] .fp-state{margin:1em 0;max-width:90%;font-size:.9em;color:inherit}
.fp-screen[data-main=true] .fp-page{margin:1vh 0;flex-wrap:wrap;font-size:1em}
.fp-screen[data-main=true] .fp-request-tabs{font-size:1em;gap:1em}
.gbs-root .fp-screen[data-main=true] .fp-submit{font-size:1em!important}
.fp-screen[data-main=true] .fp-detail{inset:3% 25%;width:auto;padding:2vh 2vw}
.fp-screen[data-main=true] .fp-detail p{font-size:.9em}
.fp-screen[data-main=true] .fp-detail .gbs-actions{font-size:1em}
.fp-screen[data-main=true] .fp-action-error,.fp-screen[data-main=true] .fp-action-status{bottom:0;font-size:.85em}
.gbs-root.gbs-room .fp-screen[data-main=true] .gbs-button:is(:focus,:focus-visible,.gpfocus,.gbs-focus){outline:2px solid #fff!important;outline-offset:3px!important;box-shadow:0 0 0 5px #ffffff20!important;background:#ffffff18!important}
`;