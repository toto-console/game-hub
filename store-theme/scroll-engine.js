const consoleMotion = {
    focusMs: 165,
    tileMs: 215,
    settleMs: 105,
    revealMs: 320,
    backdropMs: 460,
    pageMs: 330,
    scrollRate: { x: 19, y: 17 },
    easeOut: 'cubic-bezier(.18,.68,.24,1)',
    crossfade: 'cubic-bezier(.26,.06,.27,1)',
};
/** A critically damped scroll. Retargeting changes only the destination, so a
 * reversal decelerates from the velocity actually on screen. */
function createScrollAxis(axis, rate, motionAllowed) {
    let element, frame = 0, position = 0, velocity = 0, target = 0, last = 0;
    const read = (el) => axis === 'y' ? el.scrollTop : el.scrollLeft;
    const limit = (el) => axis === 'y' ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
    const write = (el, value) => el.scrollTo(axis === 'y' ? { top: value, behavior: 'instant' } : { left: value, behavior: 'instant' });
    function stop() {
        if (frame)
            element?.ownerDocument.defaultView?.cancelAnimationFrame(frame);
        frame = 0;
        velocity = 0;
        element = undefined;
    }
    function step(now) {
        const el = element, win = el?.ownerDocument.defaultView;
        if (!el?.isConnected || !win) {
            stop();
            return;
        }
        const dt = Math.min(.05, (now - last) / 1000);
        last = now;
        const offset = position - target, drive = velocity + rate * offset, decay = Math.exp(-rate * dt);
        position = target + (offset + drive * dt) * decay;
        velocity = (velocity - rate * drive * dt) * decay;
        if (Math.abs(position - target) < .35 && Math.abs(velocity) < 8) {
            write(el, target);
            stop();
            return;
        }
        write(el, position);
        frame = win.requestAnimationFrame(step);
    }
    function to(el, value) {
        const win = el.ownerDocument.defaultView;
        const next = Math.max(0, Math.min(value, limit(el)));
        if (!win || !motionAllowed(el)) {
            stop();
            write(el, next);
            return;
        }
        if (el !== element) {
            stop();
            element = el;
            position = read(el);
            last = win.performance.now();
        }
        target = next;
        if (!frame)
            frame = win.requestAnimationFrame(step);
    }
    return { to, stop, destination: (el) => element === el ? target : read(el) };
}
function followVertical(axis, el, target, top = el.scrollTop) {
    const viewport = el.getBoundingClientRect(), item = target.getBoundingClientRect();
    const pad = Math.min(42, viewport.height * .055), destination = axis.destination(el);
    const upper = item.top - viewport.top + top - pad, lower = item.bottom - viewport.bottom + top + pad;
    if (destination > upper)
        axis.to(el, upper);
    else if (destination < lower)
        axis.to(el, lower);
}
function wheelVertical(axis, el, e) {
    if (e.ctrlKey || !e.deltaY || Math.abs(e.deltaX) > Math.abs(e.deltaY))
        return;
    const target = axis.destination(el) + e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1);
    e.preventDefault();
    axis.to(el, target);
}
