/* Use Steam's existing controller event stream, never a second gamepad poller. */
function connectActivityNavigation(doc, enabled, config={}) {
  const win=doc.defaultView;
  const region=config.region||'.responsive_page_template_content, #responsive_page_template_content';
  const focusClass=config.focusClass||'gh-activity-focus';
  const targets=config.targets||'a[href],button,input,textarea,select,[role="button"],[onclick],.blotter_screenshot_gallery_image';
  let selected=null,lastDirectionAt=0;
  const changedTabs=new Map();
  const visible=el=>!!el.getClientRects().length && win.getComputedStyle(el).visibility!=='hidden' && !el.closest('[inert],[hidden]') && !el.disabled;
  const editing=el=>el?.matches('input:not([readonly]),textarea:not([readonly]),select,[contenteditable="true"]');
  const cardOf=el=>config.cardSelector?el?.closest(config.cardSelector):null;
  const candidates=()=>Array.from(doc.querySelectorAll(region)).flatMap(root=>Array.from(root.querySelectorAll(targets)))
    .filter((el,i,all)=>all.indexOf(el)===i&&(!cardOf(el)||cardOf(el)===el)&&visible(el)&&!el.closest('.newmodal,.modal_frame,[role="dialog"],[aria-modal="true"]'));
  function syncFocus(e) {
    const raw=e.target?.closest?.(targets),target=cardOf(raw)||raw;
    const next=target?.closest(region)&&visible(target)?target:null;
    if(selected!==next)selected?.classList.remove(focusClass);
    selected=next;doc.querySelectorAll('.'+focusClass).forEach(n=>{if(n!==next)n.classList.remove(focusClass);});selected?.classList.add(focusClass);
  }
  function reveal(el) {
    selected?.classList.remove(focusClass);selected=el;
    el.classList.add(focusClass);
    if(!el.hasAttribute('tabindex')&&!el.matches('a[href],button,input,textarea,select')){changedTabs.set(el,null);el.tabIndex=-1;}
    el.focus({preventScroll:true});
    // Keep native Steam focus ownership synchronized with DOM focus.
    if(typeof win.GPNavFocusChild==='function'){const target=win.$J?win.$J(el):[el];win.InstrumentFocusElements?.(target);win.GPNavFocusChild(target);}
    const scroller=el.closest('.ghp-scroll-content');
    if(scroller){const r=el.getBoundingClientRect(),b=scroller.getBoundingClientRect();if(r.top<b.top+8)scroller.scrollTop-=b.top+8-r.top;else if(r.bottom>b.bottom-8)scroller.scrollTop+=r.bottom-b.bottom+8;}
    else el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
  }
  function handle(e) {
    if(!enabled()||doc.hidden||doc.documentElement.dataset.ghProfileEditing==='true')return;
    const active=doc.activeElement;
    if(editing(active)||Array.from(doc.querySelectorAll('.newmodal,.modal_frame,[role="dialog"],[aria-modal="true"],.popup_menu')).some(visible))return;
    const direction=e.type==='vgp_ondirection'?({9:'up',10:'down',11:'left',12:'right'})[e.detail?.button]:({ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'})[e.key];
    const ok=e.type==='vgp_onok'||e.key==='Enter';
    if(!direction&&!ok)return; // B, Guide and menus stay owned by Steam.
    if(direction&&config.gridNavigation){
      const now=win.performance.now();
      if((e.repeat||e.detail?.is_repeat)&&now-lastDirectionAt<150){e.preventDefault();e.stopImmediatePropagation();return;}
      lastDirectionAt=now;
    }
    const items=candidates();if(!items.length)return;
    const owner=cardOf(active)||active;const from=items.includes(owner)?owner:items.includes(selected)?selected:null;
    if(ok){if(!from)return;e.preventDefault();e.stopImmediatePropagation();if(!e.repeat&&!e.detail?.is_repeat)from.click();return;}
    let next;
    const row=from?.closest('.ghp-trophy-library,.ghp-trophies,.ghp-friend-grid,.ghp-game-grid');
    const rowItems=row?items.filter(el=>row.contains(el)):[];
    if(row&&row.matches('.ghp-trophy-library,.ghp-trophies')&&['left','right'].includes(direction)){e.preventDefault();e.stopImmediatePropagation();return;}
    if(row&&['up','down'].includes(direction)&&row.matches('.ghp-trophy-library,.ghp-trophies')){const i=rowItems.indexOf(from),offset=direction==='down'?1:-1;next=rowItems[i+offset];if(next||direction==='down'){e.preventDefault();e.stopImmediatePropagation();if(next)reveal(next);return;}}
    const grid=from?.closest('.ghp-game-grid,.ghp-friend-grid,.ghp-people-grid,.ghp-stats');
    if(grid){const peers=items.filter(n=>n.parentElement===from.parentElement),rect=from.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
      const horizontal=direction==='left'||direction==='right',sign=direction==='left'||direction==='up'?-1:1;
      const options=peers.filter(n=>n!==from).map(el=>{const r=el.getBoundingClientRect();return {el,dx:r.left+r.width/2-x,dy:r.top+r.height/2-y};});
      const nextPeer=options.filter(n=>horizontal?Math.abs(n.dy)<rect.height/2&&n.dx*sign>1:n.dy*sign>rect.height/2).sort((a,b)=>horizontal?Math.abs(a.dx)-Math.abs(b.dx):Math.abs(a.dy)-Math.abs(b.dy)||Math.abs(a.dx)-Math.abs(b.dx))[0]?.el;
      if(nextPeer||horizontal){e.preventDefault();e.stopImmediatePropagation();if(nextPeer)reveal(nextPeer);return;}
    }
    if(!from){next=items.find(el=>{const r=el.getBoundingClientRect();return r.bottom>0&&r.top<win.innerHeight;})||items[0];}
    else {
      const r=from.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
      const vertical=direction==='up'||direction==='down',sign=direction==='up'||direction==='left'?-1:1;
      next=items.filter(el=>el!==from&&!el.contains(from)&&!from.contains(el)).map(el=>{
        const b=el.getBoundingClientRect(),dx=b.left+b.width/2-x,dy=b.top+b.height/2-y;
        const along=(vertical?dy:dx)*sign,cross=Math.abs(vertical?dx:dy);
        const samePane=!!from.closest('.ghp-scroll-content')&&el.closest('.ghp-scroll-content')===from.closest('.ghp-scroll-content');
        return {el,along,cross,samePane,aligned:vertical?b.right>r.left&&b.left<r.right:b.bottom>r.top&&b.top<r.bottom,score:along+cross*2};
      }).filter(v=>v.along>8).sort((a,b)=>(config.gridNavigation?(vertical?Number(b.samePane)-Number(a.samePane):0)||Number(b.aligned)-Number(a.aligned):0)||a.score-b.score)[0]?.el;
    }
    e.preventDefault();e.stopImmediatePropagation();
    if(next)reveal(next); // Clamp edges; do not lose focus to an off-screen page shell.
  }
  for(const name of ['focusin','vgp_onfocus'])doc.addEventListener(name,syncFocus,true);
  const events=['keydown','vgp_ondirection','vgp_onok'];
  for(const name of events)win.addEventListener(name,handle,true);
  return ()=>{for(const name of ['focusin','vgp_onfocus'])doc.removeEventListener(name,syncFocus,true);for(const name of events)win.removeEventListener(name,handle,true);selected?.classList.remove(focusClass);for(const [el,value] of changedTabs)if(el.getAttribute('tabindex')==='-1'){if(value===null)el.removeAttribute('tabindex');else el.setAttribute('tabindex',value);}changedTabs.clear();};
}
