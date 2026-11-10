/** One visual-only focus reflection per Steam window. Never changes focus or input. */
function connectFocusGloss(doc, enabled, scopeOverride) {
    const win = doc.defaultView;
    if (!win)
        return () => { };
    const scopes = scopeOverride ?? '.gh-home-module,#game-hub-control-center,.gbs-root,.gbs-room,.gh-music-route,.gh-media-manager';
    const targets = (scopeOverride ? 'a,[tabindex="0"],' : '') + 'button,[role="button"],input,select,textarea,[role="slider"],[data-gh-control],.ghd-tile,.ghd-button,.ghd-icon-button,.ghd-card,.ghd-infocard,.ghd-chip,.ghl-control,.gh-detail-control,.gh-store-card,.gbs-message';
    const style = doc.createElement('style');
    style.textContent = glossCSS;
    doc.head.append(style);
    const overlay = doc.createElement('div');
    overlay.className = 'gh-focus-reflection';
    overlay.setAttribute('aria-hidden', 'true');
    const ns = 'http://www.w3.org/2000/svg', svg = doc.createElementNS(ns, 'svg'), edge = doc.createElementNS(ns, 'rect');
    edge.setAttribute('pathLength', '100');
    svg.append(edge);
    overlay.append(svg);
    doc.body.append(overlay);
    let active = null, frame = 0, until = 0, disposed = false;
    const paint = () => {
        frame = 0;
        if (disposed)
            return;
        if (!active?.isConnected || !enabled() || active.closest('[hidden],[inert],[data-motion="false"]') || win.matchMedia('(prefers-reduced-motion: reduce)').matches || !active.getClientRects().length) {
            overlay.style.opacity = '0';
            overlay.classList.remove('gh-reflect-active');
            return;
        }
        const box = active.querySelector(':scope > .ghd-tile-box') ?? active, rect = box.getBoundingClientRect(), computed = win.getComputedStyle(box);
        if (rect.width <= 0 || rect.height <= 0 || rect.bottom < 0 || rect.top > win.innerHeight || computed.visibility === 'hidden') {
            overlay.style.opacity = '0';
            overlay.classList.remove('gh-reflect-active');
            return;
        }
        overlay.classList.add('gh-reflect-active');
        Object.assign(overlay.style, { left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px', borderRadius: computed.borderRadius, opacity: '1' });
        svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
        edge.setAttribute('x', '1');
        edge.setAttribute('y', '1');
        edge.setAttribute('width', String(Math.max(0, rect.width - 2)));
        edge.setAttribute('height', String(Math.max(0, rect.height - 2)));
        edge.setAttribute('rx', String(Math.min(rect.height / 2, parseFloat(computed.borderTopLeftRadius) || 6)));
        if (performance.now() < until)
            frame = win.requestAnimationFrame(paint);
    };
    const schedule = (animate = false) => { if (animate)
        until = performance.now() + 400; if (!frame)
        frame = win.requestAnimationFrame(paint); };
    const mark = (value) => { const next = value?.closest?.(targets) ?? null; const owned = next?.closest(scopes) ? next : null; if (active === owned) {
        schedule();
        return;
    } active = owned; overlay.classList.remove('gh-reflect-active'); if (active) {
        void overlay.offsetWidth;
        overlay.classList.add('gh-reflect-active');
    } schedule(true); };
    const focus = (e) => mark(e.target), leave = (e) => { const related = e.relatedTarget; mark(related); };
    const scroll = () => schedule(true), hidden = () => { if (doc.hidden) {
        active = null;
        until = 0;
        win.cancelAnimationFrame(frame);
        frame = 0;
        overlay.style.opacity = '0';
        overlay.classList.remove('gh-reflect-active');
    }
    else
        mark(doc.activeElement); };
    const observer = new win.MutationObserver(records => { for (const r of records) {
        const el = r.target;
        if (r.type === 'attributes' && el.matches?.('.ghd-focused,.gbs-focus,.gpfocus') && el.closest(scopes) && !String(r.oldValue).split(' ').some(c => ['ghd-focused', 'gbs-focus', 'gpfocus'].includes(c))) {
            mark(el);
            return;
        }
        if (active && (el === active || el.contains?.(active) || !active.isConnected))
            schedule();
    } });
    observer.observe(doc.body, { subtree: true, childList: true, attributes: true, attributeOldValue: true, attributeFilter: ['class', 'hidden', 'inert', 'data-motion'] });
    for (const type of ['focusin', 'vgp_onfocus', 'mouseover'])
        doc.addEventListener(type, focus, true);
    doc.addEventListener('focusout', leave, true);
    doc.addEventListener('scroll', scroll, true);
    doc.addEventListener('visibilitychange', hidden);
    win.addEventListener('resize', scroll);
    mark(scopeOverride ? doc.querySelector(`${scopeOverride} .gpfocus`) ?? doc.activeElement : doc.activeElement);
    return () => { disposed = true; win.cancelAnimationFrame(frame); observer.disconnect(); for (const type of ['focusin', 'vgp_onfocus', 'mouseover'])
        doc.removeEventListener(type, focus, true); doc.removeEventListener('focusout', leave, true); doc.removeEventListener('scroll', scroll, true); doc.removeEventListener('visibilitychange', hidden); win.removeEventListener('resize', scroll); overlay.remove(); style.remove(); };
}
const glossCSS = `.gh-focus-reflection{position:fixed;z-index:2147483646;pointer-events:none!important;overflow:hidden;opacity:0;transition:opacity 160ms ease;isolation:isolate}.gh-focus-reflection svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}.gh-focus-reflection rect{fill:none;stroke:#e1f3ff;stroke-width:1.7;stroke-linecap:round;stroke-dasharray:17 83;stroke-dashoffset:100;opacity:.8}.gh-focus-reflection.gh-reflect-active rect{animation:gh-edge-travel 3s linear infinite}.gh-focus-reflection:after{content:"";position:absolute;inset:-40%;background:linear-gradient(110deg,transparent 42%,#ffffff13 49%,#d5ebff20 50%,transparent 58%);opacity:0;transform:translateX(-75%)}.gh-focus-reflection.gh-reflect-active:after{animation:gh-surface-reflection 500ms ease-out 1}.gh-focus-reflection:not(.gh-reflect-active) rect{animation:none}@keyframes gh-edge-travel{to{stroke-dashoffset:0}}@keyframes gh-surface-reflection{0%{transform:translateX(-75%);opacity:0}30%{opacity:1}100%{transform:translateX(75%);opacity:0}}@media(prefers-reduced-motion:reduce){.gh-focus-reflection{display:none!important}}`;
