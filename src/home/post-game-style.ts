export const postGameCSS=`
.gh-post-game{position:fixed;inset:0;isolation:isolate;background:#18242e;color:#fff;font-family:inherit;text-shadow:0 1px 5px #0008}
.gh-post-game *{box-sizing:border-box}
.gh-post-game>.gh-post-backdrop{position:absolute!important;inset:0;width:100%;height:100%;isolation:isolate;overflow:hidden;pointer-events:none;z-index:-2}
.gh-post-art,.gh-post-game:before{position:absolute;inset:0;width:100%;height:100%;z-index:-2;object-fit:cover}
.gh-post-game:before{content:'';z-index:-1;background:linear-gradient(0deg,#04070be8,transparent 57%),linear-gradient(90deg,#10192040,transparent 60%,#02030855),linear-gradient(#0006,transparent 18%)}
.gh-post-game header{position:absolute;inset:3.8% 2.1% auto;display:flex;align-items:center;justify-content:space-between;font-size:1vw;font-weight:650}
.gh-post-game header span,.gh-post-game footer,.gh-post-game footer>*{display:flex;align-items:center;gap:.55vw}
.gh-post-head-actions,.gh-post-head-button{display:flex;align-items:center;gap:.4vw}
.gh-post-head-button{padding:.25vw .38vw;border-radius:.36vw;cursor:pointer}
.gh-post-head-button.focused,.gh-post-head-button:focus-visible{outline:2px solid white;background:#17283790}
.gh-post-game header .gh-friends-online{gap:.23vw}
.gh-post-game .gh-friends-online .gh-status-dot{width:.48vw;height:.48vw;border-radius:50%;background:#4aafff}
.gh-post-game .gh-post-pads{position:absolute;left:50%;transform:translateX(-50%)}
.gh-post-game header img{width:2.5vw;height:2.5vw;border-radius:50%;object-fit:cover}
.gh-post-game main{position:absolute;inset:auto 5.2% 8% 9.65%;display:grid;grid-template-columns:minmax(0,1fr) 27.2%;gap:4%}
.gh-post-tabs{display:flex;align-items:center;gap:.56vw;margin-left:-3.05vw;white-space:nowrap}
.gh-post-game :is(.gh-post-tabs,.gh-post-platform,dt,.gh-post-progress,.gh-post-action,footer){font-size:.8vw;letter-spacing:.075em;text-transform:uppercase;font-weight:700}
.gh-post-tabs small,.gh-post-tab{border:1px solid transparent;border-radius:2vw;padding:.2vw .46vw}
.gh-post-tabs small{border-color:#ffffff60;color:#dadcde}
.gh-post-tab[data-current=true]{border-color:#32a9ff;background:#132e4790}
.gh-post-tab.focused,.gh-post-action .focused,.gh-post-action .ghd-focused{outline:2px solid white;outline-offset:2px}
.gh-post-platform{opacity:.72;margin-top:2.5vw}
.gh-post-game h1{font-size:2.48vw;line-height:1.1;margin:.38vw 0 2.3vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gh-post-game dl{display:flex;gap:3.6vw;margin:0}
.gh-post-game .gh-post-friends-glyph{width:1.45vw;height:1.45vw;flex:none;color:#fff}
.gh-post-game dl :is(dt,dd,small){font-family:"Segoe UI",Arial,sans-serif!important}
.gh-post-game dl dt{font-family:inherit;color:#c1c4c7;text-transform:uppercase!important;font-size:.76vw;font-weight:700;letter-spacing:.09em;line-height:1.2}
.gh-post-game dl dd{font-family:inherit;white-space:nowrap;font-size:2.25vw;font-weight:700;line-height:1.08;letter-spacing:-.035em;margin:.25vw 0 0}
.gh-post-game dl dd small{font:inherit;font-size:.45em;letter-spacing:0;vertical-align:baseline;margin-inline:.06em}
.gh-post-game aside{align-self:stretch;display:flex;flex-direction:column;padding:.8vw 0 1.2vw}
.gh-post-progress{display:flex;justify-content:space-between;padding:0 1.2vw}.gh-post-progress b{font-size:1vw}
.gh-post-track{background:#ffffff24;height:.42vw;margin:.15vw 0 0}.gh-post-track i{height:100%;display:block;background:#0787ff}
.gh-post-action{position:relative;margin-top:auto;border:2px solid #fffc;background:#05060950}
.gh-post-action>svg{position:absolute;right:2.2vw;top:50%;transform:translateY(-50%);font-size:1.7vw;pointer-events:none}
.gh-post-action>div:not(.gh-primary-action),.gh-post-action>span,.gh-post-action .ghd-button{width:100%;min-height:6vw;display:flex;align-items:center;padding:0 4vw 0 1.5vw;justify-content:flex-start}
.gh-post-action .gh-primary-action .ghd-button{align-items:flex-start;justify-content:center;background:transparent;color:inherit;font:inherit;text-transform:inherit}
.gh-post-game footer{position:absolute;right:5.2%;bottom:3.7%;gap:1.6vw}
`;
