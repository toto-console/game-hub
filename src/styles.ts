import {ambientCSS} from './ambient-style';
// Every rule is owned by this React subtree. No Steam selectors or global tokens.

export const css = `

.gbs-root {color:#f4f5f7;font:400 16px/1.5 "Segoe UI",Arial,sans-serif;text-align:left;box-sizing:border-box; --gbs-muted:#aeb5c2; --gbs-blue:#91bbff;}

.gbs-root * {box-sizing:border-box;}

.gbs-root.gbs-room {min-height:100vh;padding:clamp(30px,6vh,100px) 6vw;background:radial-gradient(ellipse at 80% 15%,#26334a88,transparent 55%),#10131ce8;backdrop-filter:blur(24px);}

.gbs-root .gbs-shell {max-width:1320px;margin:auto;opacity:1;transform:translateY(0);transition:opacity .14s ease-out,transform .14s ease-out;}

@starting-style {.gbs-root.gbs-room .gbs-shell {opacity:.25;transform:translateY(6px);}}

.gbs-root .gbs-top {display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:24px;}

.gbs-root .gbs-eyebrow {font-size:11px;font-weight:600;letter-spacing:.2em;color:#b5c5e0;text-transform:uppercase;}

.gbs-root h1 {font-size:clamp(28px,3vw,44px);line-height:1.15;letter-spacing:-.035em;font-weight:400;margin:8px 0;}

.gbs-root h2 {font-size:24px;line-height:1.3;font-weight:400;margin:0 0 12px;}

.gbs-root h3 {font-size:16px;font-weight:600;margin:0;}

.gbs-root p {margin:8px 0 16px;color:var(--gbs-muted);}

.gbs-root .gbs-badge {display:inline-block;border:1px solid #a1b6dc40;border-radius:20px;padding:5px 11px;color:#bfcee6;font-size:11px;letter-spacing:.04em;}

.gbs-root .gbs-tabs {display:flex;gap:8px;border-bottom:1px solid #ffffff18;margin-bottom:24px;padding-bottom:12px;}

.gbs-root .gbs-button {font:inherit!important;line-height:1.4!important;min-width:0!important;width:auto!important;min-height:44px;border:1px solid #ffffff20!important;border-radius:8px!important;background:#ffffff09!important;color:#e9edf4!important;padding:11px 18px!important;margin:0!important;text-align:left;box-shadow:none;cursor:pointer;transition:background .15s,box-shadow .15s;}

.gbs-root .gbs-button:hover {background:#ffffff15!important;}

.gbs-root .gbs-button:focus-visible,.gbs-root .gbs-button.gbs-focus {outline:2px solid #dbe9ff!important;outline-offset:3px;box-shadow:0 0 0 5px #608ed838!important;background:#2f3a4f!important;color:white!important;}

.gbs-root .gbs-tab {border-color:transparent!important;background:transparent!important;color:#aab2c0!important;}

.gbs-root .gbs-tab[aria-pressed="true"] {color:#fff!important;background:#ffffff12!important;border-bottom-color:#c4ddff!important;}

.gbs-root .gbs-primary {background:#edf2fc!important;color:#151c2a!important;font-weight:600!important;}

.gbs-root .gbs-layout {display:grid;grid-template-columns:minmax(300px, .95fr) minmax(340px,1.25fr);gap:24px;align-items:start;}

.gbs-root .gbs-panel {background:linear-gradient(145deg,#272c35ee,#1a1e26ef);border:1px solid #ffffff16;border-radius:16px;box-shadow:0 20px 65px #0004;overflow:hidden;}

.gbs-root .gbs-panelhead {padding:24px 24px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;}

.gbs-root .gbs-label {font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:#b4bbc7;}

.gbs-root .gbs-list {padding:4px 12px 16px;max-height:55vh;overflow:auto;scroll-padding:10px;}

.gbs-root .gbs-friend {display:flex;align-items:center;gap:14px;width:100%!important;border-color:transparent!important;background:transparent!important;padding:14px!important;margin:4px 0!important;}

.gbs-root .gbs-friend[aria-pressed="true"] {background:#ffffff0d!important;border-color:#ffffff2b!important;}

.gbs-root .gbs-avatar {display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;flex:0 0 48px;border-radius:50%;background:linear-gradient(140deg,#637b9b,#344156);font-size:18px;font-weight:500;position:relative;}

.gbs-root .gbs-avatar img {width:100%;height:100%;border-radius:inherit;object-fit:cover;}

.gbs-root .gbs-dot {position:absolute;bottom:0;right:0;border:3px solid #242a33;width:14px;height:14px;border-radius:50%;background:#747a85;}

.gbs-root .gbs-dot[data-state="online"] {background:#73d9af;}

.gbs-root .gbs-dot[data-state="playing"] {background:#08ce55;}

.gbs-root .gbs-dot[data-state="away"] {background:#efca80;}

.gbs-root .gbs-person {min-width:0;flex:1;display:block;}

.gbs-root .gbs-person strong {display:block;font-size:16px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

.gbs-root .gbs-person small {display:block;font-size:12px;color:#acb9cd;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

.gbs-root .gbs-chevron {color:#9da9bd;font-size:22px;}

.gbs-root .gbs-detail {padding:32px;min-height:310px;}

.gbs-root .gbs-detail .gbs-avatar {width:76px;height:76px;font-size:28px;margin-bottom:20px;}

.gbs-root .gbs-actions {display:flex;gap:12px;flex-wrap:wrap;margin-top:24px;}

.gbs-root .gbs-empty {padding:34px 26px;}

.gbs-root .gbs-symbol {font-size:32px;line-height:1;width:64px;height:64px;display:flex;align-items:center;justify-content:center;border-radius:18px;border:1px solid #ffffff20;background:#ffffff06;margin-bottom:24px;color:#c9dcfa;}

.gbs-root .gbs-foot {display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-top:26px;color:#aeb8c9;font-size:12px;}

.gbs-root .gbs-error {color:#ffcfb3;border:1px solid #ffcfb344;border-radius:8px;padding:12px;}

.gbs-root .gbs-settings {padding:24px;display:flex;flex-direction:column;gap:12px;max-width:720px;}

.gbs-root .gbs-setting {display:flex;justify-content:space-between;align-items:center;width:100%!important;gap:20px;}

.gbs-root .gbs-setting small {display:block;font-size:12px;color:#b7bfd0;font-weight:400;}

.gbs-root .gbs-switch {color:#9fceff;white-space:nowrap;font-size:12px;}

.gbs-root .gbs-note {font-size:12px;color:#b8c0ce;margin-top:20px;}

.gbs-root.gbs-compact {padding:8px 12px 18px;}

.gbs-root.gbs-compact .gbs-panel {padding:20px;}

.gbs-root.gbs-compact h2 {font-size:25px;}

.gbs-root.gbs-compact .gbs-button {width:100%!important;margin-top:10px!important;}

.gbs-root .gbs-bubble {padding:13px 16px;background:#353c49;border-radius:14px 14px 14px 3px;margin:12px 0;max-width:85%;}

.gbs-root .gbs-bubble[data-self="true"] {background:#34527e;margin-left:auto;border-radius:14px 14px 3px 14px;}

.gbs-root .gbs-bubble small {display:block;color:#b9c7da;font-size:11px;margin-bottom:4px;}

.gbs-root .gbs-members {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:20px;}

.gbs-root .gbs-member {background:#ffffff06;border:1px solid #ffffff15;border-radius:12px;padding:20px;text-align:center;}

.gbs-root .gbs-member .gbs-avatar {margin:0 0 10px;}

.gbs-root[data-motion="false"] * {transition:none!important;animation:none!important;}

@media(prefers-reduced-motion:reduce){.gbs-root * {transition:none!important;animation:none!important;}}

@media(max-width:780px){.gbs-root.gbs-room {padding:24px;}.gbs-root .gbs-layout {grid-template-columns:1fr;}.gbs-root .gbs-tabs {flex-wrap:wrap;}.gbs-root .gbs-list {max-height:40vh;}.gbs-root .gbs-detail {padding:24px;}.gbs-root .gbs-top {align-items:flex-start;}}

@media(min-width:2400px){.gbs-root.gbs-room {font-size:22px;}.gbs-root .gbs-shell {max-width:2000px;}.gbs-root .gbs-person strong {font-size:23px;}.gbs-root .gbs-person small,.gbs-root .gbs-note,.gbs-root .gbs-foot {font-size:18px;}.gbs-root .gbs-list {max-height:60vh;}.gbs-root .gbs-friend {padding:24px!important;}.gbs-root h2 {font-size:32px;}}



/* Full-screen Game Base: matte charcoal, restrained white focus, open chat space. */

.gbs-root.gbs-room {position:fixed;inset:0;z-index:100;height:100vh;height:100dvh;min-height:0;overflow:auto;padding:5vh 5vw 3vh;background:radial-gradient(ellipse at 16% 85%,#303943 0,transparent 58%),linear-gradient(120deg,#171c23,#0c1016 80%);backdrop-filter:none;font-weight:300;}

.gbs-root.gbs-room .gbs-shell {height:100%;max-width:none;display:flex;flex-direction:column;min-height:0;}

.gbs-root.gbs-room .gbs-top {flex:none;margin-bottom:3vh;}

.gbs-root.gbs-room h1 {font-size:clamp(30px,3.1vw,64px);font-weight:300;}

.gbs-root.gbs-room .gbs-tabs {flex:none;margin-bottom:2vh;border-bottom-color:#ffffff20;}

.gbs-root.gbs-room .gbs-layout {flex:1;min-height:0;overflow:auto;}

.gbs-root.gbs-room .gbs-foot {flex:none;margin-top:2vh;font-size:clamp(11px,1vw,17px);color:#a3a7af;}

.gbs-root.gbs-room .gbs-button:disabled {opacity:.4;cursor:default;}

.gbs-root.gbs-room .gbs-button:focus-visible,.gbs-root.gbs-room .gbs-button.gbs-focus {outline:2px solid #fff!important;outline-offset:3px;box-shadow:0 0 0 5px #ffffff20!important;background:#ffffff18!important;}

.gbs-root .gbs-messages {display:grid;grid-template-columns:minmax(220px,29%) minmax(0,1fr);flex:1;min-height:250px;gap:4vw;overflow:hidden;}

.gbs-root .gbs-conversations {min-height:0;display:flex;flex-direction:column;border-right:1px solid #ffffff16;padding-right:2vw;}

.gbs-root .gbs-conversation-actions {display:flex;padding:5px 5px 12px;}

.gbs-root .gbs-new-message {width:100%!important;border-radius:30px!important;text-align:center;background:#ffffff0a!important;}

.gbs-root .gbs-connection {color:#929ca7;font-size:12px;padding:4px 12px 16px;}

.gbs-root .gbs-conversation-list {min-height:0;overflow:auto;padding:6px;scroll-padding:8px;}

.gbs-root .gbs-conversation {display:flex;gap:14px;align-items:center;width:100%!important;padding:17px 12px!important;background:transparent!important;border:1px solid transparent!important;border-radius:4px!important;}

.gbs-root .gbs-conversation[aria-pressed="true"] {background:#ffffff15!important;border-color:#ffffff30!important;}

.gbs-root .gbs-conversation>span:nth-child(2) {min-width:0;flex:1;}

.gbs-root .gbs-conversation strong {display:block;font-weight:400;font-size:1.1em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

.gbs-root .gbs-conversation small {display:block;color:#a6aab2;font-size:.8em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

.gbs-root .gbs-chat-avatar {width:48px;height:48px;flex:0 0 48px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:#46505f;color:#fff;overflow:hidden;font-size:18px;}

.gbs-root .gbs-chat-avatar img {width:100%;height:100%;object-fit:cover;}

.gbs-root .gbs-unread {background:#f3f3f3;color:#161a20;border-radius:20px;padding:2px 7px;font-size:12px;}

.gbs-root .gbs-chat-welcome {display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#b7bac1;}

.gbs-root .gbs-message-outline {font-size:64px;color:#c1c5ca;margin-bottom:18px;}

.gbs-root .gbs-chat-thread {display:flex;flex-direction:column;min-height:0;min-width:0;}

.gbs-root .gbs-chat-title {display:flex;gap:20px;align-items:center;padding:2px 4px 20px;border-bottom:1px solid #ffffff12;}

.gbs-root .gbs-chat-title h2 {font-size:clamp(24px,2vw,40px);font-weight:300;margin:0;}

.gbs-root .gbs-chat-title small {color:#9299a5;font-size:13px;}

.gbs-root .gbs-chat-history {flex:1;min-height:0;overflow:auto;padding:16px 12px 10px;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#ffffff30 transparent;outline-offset:-2px;}

.gbs-root .gbs-date-divider {display:flex;align-items:center;gap:16px;color:#9da2aa;font-size:12px;margin:18px auto 24px;max-width:360px;}

.gbs-root .gbs-date-divider:before,.gbs-root .gbs-date-divider:after {content:"";height:1px;flex:1;background:#ffffff18;}

.gbs-root .gbs-chat-message {display:flex;flex-direction:column;align-items:flex-start;margin:14px 0;}

.gbs-root .gbs-chat-message[data-self="true"] {align-items:flex-end;}

.gbs-root .gbs-chat-message>small {font-size:12px;color:#bdc1ca;margin:0 4px 4px;}

.gbs-root .gbs-chat-bubble {max-width:82%;white-space:pre-wrap;overflow-wrap:anywhere;padding:13px 20px;border-radius:10px;background:#343941;color:#f4f4f6;line-height:1.55;}

.gbs-root .gbs-chat-message[data-self="true"] .gbs-chat-bubble {background:#0c1018;border:1px solid #ffffff10;}

.gbs-root .gbs-chat-message[data-system="true"] {align-items:center;}

.gbs-root .gbs-chat-message[data-system="true"] .gbs-chat-bubble {background:transparent;border:1px solid #ffffff30;border-radius:20px;color:#aeb4bd;font-size:.9em;}

.gbs-root .gbs-chat-message time {font-size:11px;color:#8d949e;margin:5px 4px 0;}

.gbs-root .gbs-chat-status {text-align:center;font-size:14px;padding:20px;}

.gbs-root .gbs-history-more {display:block;margin:auto!important;border:0!important;font-size:12px!important;}

.gbs-root .gbs-chat-feedback {height:24px;font-size:12px;color:#aeb5c2;}

.gbs-root .gbs-chat-error {font-size:13px;color:#ffd5bf;padding:8px 0;}

.gbs-root .gbs-chat-error .gbs-button {font-size:12px!important;padding:4px 12px!important;min-height:32px;margin-left:12px!important;}

.gbs-root .gbs-composer {display:flex;gap:20px;align-items:center;padding:12px 4px 4px;}

.gbs-root .gbs-text-field,.gbs-root .gbs-text-input {flex:1;min-width:0;}

.gbs-root .gbs-text-field input,.gbs-root .gbs-text-input {width:100%;box-sizing:border-box;background:transparent!important;border:0!important;border-bottom:2px solid #ffffff40!important;border-radius:0!important;color:#fff!important;font:inherit!important;font-weight:300!important;padding:16px 8px!important;box-shadow:none!important;}

.gbs-root .gbs-text-field input:focus,.gbs-root .gbs-text-input:focus {border-bottom-color:#fff!important;outline:2px solid #ffffff60;outline-offset:4px;}

.gbs-root .gbs-send {border-radius:30px!important;padding:10px 25px!important;}

@media(max-width:780px){.gbs-root .gbs-messages {grid-template-columns:minmax(170px,32%) minmax(0,1fr);gap:18px;}.gbs-root .gbs-chat-avatar {width:32px;height:32px;flex-basis:32px;font-size:12px;}.gbs-root .gbs-conversation {gap:8px;padding:12px 6px!important;}.gbs-root .gbs-conversation strong {font-size:13px;}.gbs-root .gbs-composer {gap:8px;}.gbs-root.gbs-room {padding:24px;}}

@media(max-width:540px){.gbs-root .gbs-messages {grid-template-columns:1fr;overflow:auto;}.gbs-root .gbs-conversations {max-height:180px;border-right:0;border-bottom:1px solid #ffffff20;}.gbs-root .gbs-chat-thread {min-height:360px;}.gbs-root .gbs-chat-welcome {padding:30px;}}



.gbs-root.gbs-room {font-size:clamp(17px,1.25vw,36px);}

.gbs-root.gbs-room:has(.gbs-chat-thread) .gbs-top,.gbs-root.gbs-room:has(.gbs-chat-thread) .gbs-tabs {display:none;}

.gbs-root .gbs-messages[data-open="true"] {display:block;}

.gbs-root .gbs-chat-focus {height:100%;min-height:0;}

.gbs-root .gbs-chat-thread {display:grid;height:100%;grid-template-columns:minmax(0,1fr) 28%;grid-template-rows:auto minmax(0,1fr) auto auto auto;column-gap:6vw;}

.gbs-root .gbs-chat-title {grid-column:1/-1;border:0;padding:0 0 4vh;}

.gbs-root .gbs-chat-title h2 {font-size:clamp(30px,3.2vw,72px);}

.gbs-root .gbs-chat-title .gbs-chat-avatar {width:64px;height:64px;flex-basis:64px;}

.gbs-root .gbs-chat-title small {display:none;}

.gbs-root .gbs-chat-sidebar {grid-column:2;grid-row:2/6;display:flex;flex-direction:column;padding-top:4vh;}

.gbs-root .gbs-chat-action {display:flex;align-items:center;gap:20px;padding:24px 0!important;border:0!important;border-bottom:1px solid #ffffff16!important;border-radius:0!important;background:transparent!important;font-weight:300!important;}

.gbs-root .gbs-chat-action>span {font-size:1.4em;}

.gbs-root .gbs-chat-history {grid-column:1;grid-row:2;}

.gbs-root .gbs-chat-feedback {grid-column:1;grid-row:3;}

.gbs-root .gbs-chat-error {grid-column:1;grid-row:4;}

.gbs-root .gbs-composer-host {grid-column:1;grid-row:5;min-width:0;}

@media(max-width:780px){.gbs-root .gbs-chat-thread {grid-template-columns:minmax(0,1fr) 25%;column-gap:20px;}.gbs-root .gbs-chat-action {font-size:12px!important;gap:8px;}.gbs-root .gbs-chat-bubble {max-width:94%;padding:10px 14px;}}

@media(max-width:540px){.gbs-root .gbs-chat-thread {grid-template-columns:1fr;grid-template-rows:auto auto minmax(200px,1fr) auto auto auto;}.gbs-root .gbs-chat-sidebar {grid-column:1;grid-row:2;flex-direction:row;flex-wrap:wrap;padding:0;gap:12px;}.gbs-root .gbs-chat-sidebar .gbs-note {display:none;}.gbs-root .gbs-chat-title {padding-bottom:12px;}.gbs-root .gbs-chat-history {grid-row:3;}.gbs-root .gbs-chat-feedback {grid-row:4;}.gbs-root .gbs-chat-error {grid-row:5;}.gbs-root .gbs-composer-host {grid-row:6;}}


.gbs-root .gbs-party{display:grid;grid-template-columns:minmax(0,1fr) 28%;gap:4vw;flex:1;min-height:0;color:#eef0f5}
.gbs-root .gbs-party-card{border:1px solid #ffffff18;border-radius:18px;background:linear-gradient(135deg,#ffffff08,#ffffff02);padding:24px;display:flex;flex-direction:column;min-height:0;overflow:auto}
.gbs-root .gbs-party-heading{display:flex;align-items:center;gap:18px;border-bottom:1px solid #ffffff20;padding:0 0 20px;margin-bottom:16px}
.gbs-root .gbs-party-heading h2{font-size:clamp(22px,2vw,38px);font-weight:300;margin:6px 0}
.gbs-root .gbs-party-status{margin-left:auto;font-size:14px;color:#c0c6d1}
.gbs-root .gbs-party-list{overflow:auto;min-height:0;display:flex;flex-direction:column;gap:8px}
.gbs-root .gbs-party-list h3{font-weight:400;font-size:16px;color:#bbc0ca;margin:20px 10px 8px}
.gbs-root .gbs-party-row{display:flex!important;align-items:center;gap:18px!important;padding:14px 18px!important;border-radius:12px!important;background:#ffffff04!important;text-align:left!important;min-height:72px!important}
.gbs-root .gbs-party-row>span:nth-child(2){flex:1;min-width:0}.gbs-root .gbs-party-row strong{display:block;font-weight:400;font-size:18px}.gbs-root .gbs-party-row small{display:block;color:#a9afbb;margin-top:5px;font-size:13px}
.gbs-root .gbs-party-avatar{display:inline-flex;width:48px;height:48px;flex:0 0 48px;align-items:center;justify-content:center;border-radius:50%;overflow:hidden;background:#ffffff12}.gbs-root .gbs-party-avatar img{width:100%;height:100%;object-fit:cover}
.gbs-root .gbs-party-actions{display:flex;flex-direction:column;gap:12px}.gbs-root .gbs-party-action{display:flex!important;align-items:center;gap:14px;font-weight:400!important;min-height:54px!important;text-align:left!important}
.gbs-root .gbs-party-side{padding-top:22px;overflow:auto}.gbs-root .gbs-party-side .gbs-note{margin-top:28px;line-height:1.6}
.gbs-root .gbs-party-count{color:#aeb4bf;margin:0 0 16px}.gbs-root .gbs-party-member{display:flex;flex-direction:column;gap:16px;max-width:720px}.gbs-root .gbs-party-member h2{font-weight:300;margin:0}
.gbs-root .gbs-speaking{display:flex;padding:8px;border-radius:50%;opacity:.45;transition:opacity 140ms,background 140ms}.gbs-root .gbs-speaking[data-speaking=true]{opacity:1;background:#ffffff26}
.gbs-root .gbs-party-row.gbs-focus{background:#ffffff19!important;outline:2px solid #f5f6f9!important}
@media(max-width:780px){.gbs-root .gbs-party{grid-template-columns:minmax(0,1fr) 30%;gap:20px}.gbs-root .gbs-party-card{padding:16px}.gbs-root .gbs-party-heading{flex-wrap:wrap}.gbs-root .gbs-party-status{margin-left:0}.gbs-root .gbs-party-row{gap:10px!important}}
@media(prefers-reduced-motion:reduce){.gbs-root .gbs-speaking{transition:none}}

.gbs-root .gbs-picker-filters{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0 4px}.gbs-root .gbs-picker-filters .gbs-button{font-size:14px!important;padding:10px 14px!important}
.gbs-root .gbs-party-row[aria-pressed=true]{background:#ffffff14!important;border-color:#ffffff75!important}
.gbs-root .gbs-party-row:has(.gbs-speaking[data-speaking=true]) .gbs-party-avatar{box-shadow:0 0 0 2px #eeeeee;transition:box-shadow 140ms}
.gbs-root .gbs-party-card>.gbs-note{flex-shrink:0}.gbs-root .gbs-party-card>.gbs-text-field{flex:0 0 auto}
.gbs-root .gbs-chat-sidebar{overflow-y:auto;min-height:0}

/* The player picker owns one bounded scroll region; chrome never competes with rows. */
.gbs-root .gbs-party[data-view="picker"]{grid-template-rows:minmax(0,1fr);overflow:hidden;min-width:0}
.gbs-root .gbs-party[data-view="picker"] .gbs-party-card{overflow:hidden;min-width:0}
.gbs-root .gbs-party[data-view="picker"] .gbs-party-heading{flex:0 0 auto;padding-bottom:12px;margin-bottom:12px}
.gbs-root .gbs-player-picker{flex:1 1 0;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:hidden}
.gbs-root .gbs-player-picker>.gbs-text-field,.gbs-root .gbs-player-picker>.gbs-text-input{flex:0 0 auto;min-height:0}
.gbs-root .gbs-player-picker .gbs-picker-filters{flex:0 0 auto;margin:10px 0 0}
.gbs-root .gbs-player-picker>.gbs-note{flex:0 0 auto;margin:10px 0}
.gbs-root .gbs-player-picker>.gbs-party-list{flex:1 1 0;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;padding:6px;scroll-padding-block:6px}
.gbs-root .gbs-player-picker .gbs-party-row{flex:0 0 auto;min-width:0}
.gbs-root .gbs-party[data-view="picker"] .gbs-error{flex:0 0 auto;max-height:3em;overflow:auto;margin:6px 0}
@media(max-height:760px){
 .gbs-root.gbs-room:has(.gbs-player-picker){padding-top:2vh;padding-bottom:2vh}
 .gbs-root:has(.gbs-player-picker) .gbs-top{margin-bottom:1vh}
 .gbs-root:has(.gbs-player-picker) .gbs-tabs{margin-bottom:1vh;padding-bottom:6px}
 .gbs-root .gbs-party[data-view="picker"] .gbs-party-card{padding:12px}
 .gbs-root .gbs-party[data-view="picker"] .gbs-party-heading{padding-bottom:6px;margin-bottom:6px}
 .gbs-root .gbs-player-picker .gbs-text-field input{padding:8px!important}
 .gbs-root .gbs-player-picker .gbs-party-row{padding:10px 14px!important;min-height:60px!important}
 .gbs-root .gbs-player-picker .gbs-picker-filters{gap:4px;margin-top:6px}
 .gbs-root .gbs-player-picker .gbs-picker-filters .gbs-button{padding:6px 8px!important;font-size:12px!important}
}

.gbs-root .gbs-picker-summary{display:flex;align-items:center;gap:16px;flex:0 0 auto;min-width:0;margin:8px 0}
.gbs-root .gbs-picker-summary>.gbs-note{flex:0 0 auto;margin:0}
.gbs-root .gbs-picker-summary>.gbs-text-field,.gbs-root .gbs-picker-summary>.gbs-text-input{flex:1 1 0;min-width:0}
.gbs-root .gbs-picker-summary input{padding:8px!important}

.gbs-root .gbs-player-backdrop{position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;background:#0008;animation:gbs-player-fade 120ms ease-out}
.gbs-root .gbs-player-menu{width:clamp(330px,42vh,920px);max-width:90vw;max-height:92dvh;overflow:auto;box-sizing:border-box;padding:clamp(18px,2.4vh,48px);border:1px solid #ffffff26;border-radius:clamp(16px,2vh,36px);background:linear-gradient(125deg,#222529f5,#17191df8 55%,#292b2ef5);box-shadow:0 18px 60px #0007,inset 0 0 0 1px #ffffff05;animation:gbs-player-in 140ms ease-out;color:#eee;font-weight:300}
.gbs-root .gbs-player-label{font-size:clamp(16px,2.1vh,42px);color:#a8a9ad;margin-bottom:2vh}
.gbs-root .gbs-player-identity{display:flex;flex-direction:column;align-items:center;padding-bottom:2vh;margin-bottom:1vh;border-bottom:1px solid #ffffff10;gap:1vh}
.gbs-root .gbs-player-photo{position:relative;display:block;width:clamp(76px,10vh,210px);height:clamp(76px,10vh,210px);border-radius:50%;background:#343a43;color:#b7c4d0}
.gbs-root .gbs-player-photo img,.gbs-root .gbs-player-photo svg{width:100%;height:100%;border-radius:50%;object-fit:cover}
.gbs-root .gbs-player-photo i{position:absolute;right:2%;bottom:3%;width:19%;height:19%;border-radius:50%;background:#72777f;border:3px solid #22262b}
.gbs-root .gbs-player-photo i[data-state=online],.gbs-root .gbs-player-photo i[data-state=playing]{background:#08ce55}.gbs-root .gbs-player-photo i[data-state=away]{background:#d3ab58}
.gbs-root .gbs-player-identity h2{font-size:clamp(22px,2.8vh,58px);font-weight:300;line-height:1.2;margin:0;text-align:center;overflow-wrap:anywhere}
.gbs-root .gbs-player-badge{font-size:clamp(14px,1.9vh,38px);background:#ffffff0d;border-radius:999px;padding:.3vh 2vh;color:#b7b8bc}
.gbs-root .gbs-player-actions{display:flex;flex-direction:column}
.gbs-root.gbs-room .gbs-player-menu .gbs-player-action{display:flex;align-items:center;gap:2.6vh;min-height:6.7vh;padding:1.4vh 2vh!important;background:transparent!important;border:1px solid transparent!important;border-bottom-color:#ffffff07!important;border-radius:12px!important;font-size:clamp(18px,2.3vh,48px)!important;font-weight:300!important;text-align:left!important;box-shadow:none!important}
.gbs-root .gbs-player-action svg{width:2.9vh;height:2.9vh;min-width:24px;min-height:24px;flex-shrink:0}
.gbs-root.gbs-room .gbs-player-menu .gbs-button.gbs-focus,.gbs-root.gbs-room .gbs-player-menu .gbs-button:focus-visible{outline:2px solid #eee!important;outline-offset:-2px;background:#ffffff08!important;box-shadow:0 0 8px #ffffff38,inset 0 0 6px #ffffff12!important}
.gbs-root .gbs-player-feedback{font-size:clamp(12px,1.4vh,26px);color:#aaaeb6;line-height:1.4;margin:1vh 0 0}
@keyframes gbs-player-fade{from{opacity:0}to{opacity:1}}@keyframes gbs-player-in{from{opacity:0;transform:translateY(6px) scale(.985)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.gbs-root .gbs-player-backdrop,.gbs-root .gbs-player-menu{animation:none}}
.gbs-root[data-motion=false] .gbs-player-backdrop,.gbs-root[data-motion=false] .gbs-player-menu{animation:none}

.gbs-root .gbs-player-backdrop[data-closing=true]{opacity:0;transition:opacity 100ms ease}
@media(prefers-reduced-motion:reduce){.gbs-root .gbs-player-backdrop[data-closing=true]{transition:none}}

/* Background-only ambient light: no layout, pointer or focus participation. */
.gbs-root.gbs-room{isolation:isolate}
.gbs-root.gbs-room .gbs-ambient{position:absolute;inset:0;z-index:-1;overflow:hidden;pointer-events:none;background:radial-gradient(ellipse 60% 70% at 5% 0%,rgba(255,255,255,.13),rgba(225,234,245,.045) 48%,transparent 80%)}
.gbs-root.gbs-room .gbs-ambient::before,.gbs-root.gbs-room .gbs-ambient::after{content:"";position:absolute;inset:-8%;pointer-events:none;background:radial-gradient(ellipse 65% 12% at 24% 31%,rgba(222,232,244,.055),transparent 75%),radial-gradient(ellipse 46% 22% at 60% 68%,rgba(184,205,229,.035),transparent 80%);transform:rotate(-14deg);opacity:.65;animation:gbs-ambient-drift 38s ease-in-out infinite alternate}
.gbs-root.gbs-room .gbs-ambient::after{background:radial-gradient(ellipse 54% 9% at 35% 48%,rgba(245,249,255,.045),transparent 78%);animation-duration:53s;animation-delay:-17s}
.gbs-root.gbs-room .gbs-top h1{color:#fff;font-weight:300;text-shadow:none}
@keyframes gbs-ambient-drift{from{transform:translate(-1.5%,-1%) rotate(-14deg);opacity:.55}to{transform:translate(2%,1.5%) rotate(-10deg);opacity:.85}}
.gbs-root.gbs-room[data-motion=false] .gbs-ambient::before,.gbs-root.gbs-room[data-motion=false] .gbs-ambient::after{animation:none}
@media(prefers-reduced-motion:reduce){.gbs-root.gbs-room .gbs-ambient::before,.gbs-root.gbs-room .gbs-ambient::after{animation:none}}
.gbs-root.gbs-room[data-ambient=false] .gbs-ambient{display:none}
${ambientCSS}

/* Only the focused message owns the history highlight. */
.gbs-root .gbs-chat-history:is(:focus,:focus-visible,.gbs-focus,.gpfocus){outline:none!important;box-shadow:none!important}
.gbs-root .gbs-chat-bubble[data-message-id]{outline:none;transition:box-shadow .12s,filter .12s}
.gbs-root .gbs-chat-bubble[data-message-id]:is(:focus-visible,.gbs-message-focus){outline:1px solid white!important;outline-offset:1px;box-shadow:0 0 7px #ffffff30;filter:brightness(1.12)}
@media(prefers-reduced-motion:reduce){.gbs-root .gbs-chat-bubble[data-message-id]{transition:none}}
`;


