/* Use Steam's existing controller event stream, never a second gamepad poller. */
function connectActivityNavigation(doc, enabled) {
  const win=doc.defaultView;
  const region='.responsive_page_template_content, #responsive_page_template_content';
  const targets='a[href],button,input,textarea,select,[role="button"],[onclick],.blotter_screenshot_gallery_image';
  let selected=null;
  const changedTabs=new Map();
  const visible=el=>!!el.getClientRects().length && win.getComputedStyle(el).visibility!=='hidden' && !el.closest('[inert],[hidden]') && !el.disabled;
  const editing=el=>el?.matches('input,textarea,select,[contenteditable="true"]');
  const candidates=()=>Array.from(doc.querySelectorAll(region)).flatMap(root=>Array.from(root.querySelectorAll(targets)))
    .filter((el,i,all)=>all.indexOf(el)===i&&visible(el)&&!el.closest('.newmodal,.modal_frame,[role="dialog"],[aria-modal="true"]'));
  function reveal(el) {
    selected?.classList.remove('gh-activity-focus');selected=el;
    el.classList.add('gh-activity-focus');
    if(!el.hasAttribute('tabindex')&&!el.matches('a[href],button,input,textarea,select')){changedTabs.set(el,null);el.tabIndex=-1;}
    el.focus({preventScroll:true});
    // Keep native Steam focus ownership synchronized with DOM focus.
    if(win.g_bGamepadNavReady&&typeof win.GPNavFocusChild==='function')win.GPNavFocusChild(win.$J?win.$J(el):el);
    el.dispatchEvent(new win.CustomEvent('vgp_requestfocus',{bubbles:true,detail:{button:0,source:1,is_repeat:false}}));
    el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});
  }
  function handle(e) {
    if(!enabled()||doc.hidden)return;
    const active=doc.activeElement;
    if(editing(active)||Array.from(doc.querySelectorAll('.newmodal,.modal_frame,[role="dialog"],[aria-modal="true"],.popup_menu')).some(visible))return;
    const direction=e.type==='vgp_ondirection'?({9:'up',10:'down',11:'left',12:'right'})[e.detail?.button]:({ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'})[e.key];
    const ok=e.type==='vgp_onok'||e.key==='Enter';
    if(!direction&&!ok)return; // B, Guide and menus stay owned by Steam.
    const items=candidates();if(!items.length)return;
    const from=items.includes(active)?active:items.includes(selected)?selected:null;
    if(ok){if(!from)return;e.preventDefault();e.stopImmediatePropagation();if(!e.repeat&&!e.detail?.is_repeat)from.click();return;}
    let next;
    if(!from){next=items.find(el=>{const r=el.getBoundingClientRect();return r.bottom>0&&r.top<win.innerHeight;})||items[0];}
    else {
      const r=from.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
      const vertical=direction==='up'||direction==='down',sign=direction==='up'||direction==='left'?-1:1;
      next=items.filter(el=>el!==from&&!el.contains(from)&&!from.contains(el)).map(el=>{
        const b=el.getBoundingClientRect(),dx=b.left+b.width/2-x,dy=b.top+b.height/2-y;
        const along=(vertical?dy:dx)*sign,cross=Math.abs(vertical?dx:dy);
        return {el,along,score:along+cross*2};
      }).filter(v=>v.along>8).sort((a,b)=>a.score-b.score)[0]?.el;
    }
    e.preventDefault();e.stopImmediatePropagation();
    if(next)reveal(next); // Clamp edges; do not lose focus to an off-screen page shell.
  }
  const events=['keydown','vgp_ondirection','vgp_onok'];
  for(const name of events)win.addEventListener(name,handle,true);
  return ()=>{for(const name of events)win.removeEventListener(name,handle,true);selected?.classList.remove('gh-activity-focus');for(const [el,value] of changedTabs)if(el.getAttribute('tabindex')==='-1'){if(value===null)el.removeAttribute('tabindex');else el.setAttribute('tabindex',value);}changedTabs.clear();};
}
