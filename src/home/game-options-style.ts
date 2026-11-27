const popup = '.BasicUIContextMenu:has(.gh-game-options-marker)';
const list = popup + ' [role="menu"]:has(.gh-game-options-marker)';
const row = list + ' > [role="menuitem"]';

export const gameOptionsCSS = `
  ${popup} {
    --gh-options-width: min(22rem, 87vw);
    gap: 0 !important;
  }
  ${popup} > :first-child,
  ${popup} > :has(.gh-game-options-marker) {
    box-sizing: border-box;
    width: var(--gh-options-width) !important;
    max-width: var(--gh-options-width);
    align-self: center;
    margin: 0 !important;
    background: #191d24 !important;
    color: #f4f5f7;
    border: 1px solid #ffffff30;
  }
  ${popup} > :first-child {
    padding: .85rem 1rem .7rem !important;
    border-radius: .8rem .8rem 0 0;
    border-bottom: 0;
    font-size: 1rem;
    font-weight: 600;
    text-align: left;
    overflow-wrap: anywhere;
  }
  ${popup} > :has(.gh-game-options-marker) {
    padding: .35rem;
    border-top-color: #ffffff18;
    border-radius: 0 0 .8rem .8rem;
    box-shadow: 0 .7rem 2rem #0006;
  }
  ${list} {
    width: 100% !important;
    max-height: 72vh;
    overflow-y: auto;
    scrollbar-width: thin;
    gap: 1px;
  }
  ${row} {
    box-sizing: border-box;
    min-height: 2.15rem !important;
    flex: 0 0 auto;
    margin: 0 !important;
    padding: .42rem .7rem !important;
    border: 0 !important;
    border-radius: .35rem !important;
    background: transparent !important;
    color: #e7e9ed !important;
    font-size: .94rem;
    line-height: 1.25;
  }
  ${row}.Play { background: #f7f7f7 !important; color: #101114 !important; font-weight: 600; }
  ${row}.Play svg { color: inherit !important; fill: currentColor; }
  ${row}:is(.gpfocus,:focus-visible,:hover) {
    background: #fff !important;
    color: #111 !important;
    box-shadow: inset 0 0 0 2px #252930, inset 0 0 0 3px #fff !important;
  }
`;
