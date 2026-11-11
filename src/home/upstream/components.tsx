import {useLanguage} from "../../i18n";
import {movedPointer} from '../pointer-intent';
import {highlightSoundtrack} from '../../themedeck-adapter';
import { Focusable, GamepadButton, GamepadEvent, NavEntryPositionPreferences } from "@decky/ui";
import { Component, ReactNode, RefObject, useEffect, useRef, useState } from "react";

import {isInstalled} from "../../library-data";
import { t } from "./i18n";
import { APP_TYPE_SHORTCUT, App, heroUrls, launch, openDetails, openGameMenu, portraitUrls, runningAppId } from "./steam";

export const FOCUSED_CLASS = "ghd-focused";
/** Room kept between a focused tile and the edge of its row or grid, in px. */
const EDGE_PAD = 48;

/** An <img> that walks through candidate URLs until one loads, then shows `fallback`. */
export function Art({ sources, className, fallback }: { sources: string[]; className?: string; fallback?: ReactNode }) {
 useLanguage();
  return <ArtSource key={sources.join("|")} sources={sources} className={className} fallback={fallback}/>;
}
function ArtSource({sources,className,fallback}:{sources:string[];className?:string;fallback?:ReactNode}){
 useLanguage();
  const [index, setIndex] = useState(0);
  if (index >= sources.length) return <>{fallback ?? null}</>;
  return (
    <img
      className={className}
      src={sources[index]}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}

/** Scrolls `container` along one axis just enough to show `el` with some room around it. */
function keepInView(container: HTMLElement, el: HTMLElement, axis: "x" | "y") {
  const c = container.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const [start, end, cStart, cEnd] = axis === "x" ? [r.left, r.right, c.left, c.right] : [r.top, r.bottom, c.top, c.bottom];
  let delta = 0;
  if (start < cStart + EDGE_PAD) delta = start - cStart - EDGE_PAD;
  else if (end > cEnd - EDGE_PAD) delta = end - cEnd + EDGE_PAD;
  if (delta) container.scrollBy({ [axis === "x" ? "left" : "top"]: delta, behavior: "smooth" });
}

type FocusHook = { __psdFocus?: () => void };

/**
 * Steam marks the focused element with `focusClassName`; watching for that class is the one signal
 * that always arrives, whatever moved the focus. Keeps the focused tile on screen inside its row or
 * grid and runs the tile's own focus callback.
 */
export function useFocusReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new MutationObserver((records) => {
      for (const rec of records) {
        const target = rec.target as HTMLElement & FocusHook;
        const was = (rec.oldValue ?? "").split(" ").includes(FOCUSED_CLASS);
        if (was || !target.classList.contains(FOCUSED_CLASS)) continue;
        // The home row moves itself (see Ps5Home's slideTo), so it's left alone here.
        const row = target.closest<HTMLElement>(".ghd-row, .ghd-chips");
        if (row && !row.classList.contains("ghd-row-anchor")) keepInView(row, target, "x");
        const column = target.closest<HTMLElement>(".ghd-grid, .ghd-cards");
        if (column && !column.classList.contains("ghl-grid")) keepInView(column, target, "y");
        target.__psdFocus?.();
      }
    });
    observer.observe(el, { subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true });
    return () => observer.disconnect();
  }, [root]);
}

interface TileProps {
  size?: "home" | "normal" | "small";
  label: string;
  preferredFocus?: boolean;
  onFocus?: (el: HTMLElement) => void;
  onActivate: () => void;
  onOptions?: () => void;
  /** Select (View) and ≡ (Menu): the item's menu, like in Steam's library. */
  onMenu?: (anchor: EventTarget | null) => void;
  okLabel?: string;
  children: ReactNode;
  badge?: ReactNode;
  className?: string;
}

/** Runs `onFocus` whenever Steam focuses the element behind `ref` (see useFocusReveal). */
export function useFocusHook(onFocus?: (el: HTMLElement) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onFocus);
  cb.current = onFocus;
  useEffect(() => {
    const el = ref.current as (HTMLDivElement & FocusHook) | null;
    if (el) el.__psdFocus = () => cb.current?.(el);
    return()=>{if(el)delete el.__psdFocus;};
  }, []);
  return ref;
}

/**
 * A rounded square PS5 tile. The art sits in a box with a separate ring element, so focus fades the
 * ring's opacity in instead of repainting a shadow, and home tiles scale the box instead of resizing:
 * both run on the GPU without touching the layout.
 */
export function Tile(p: TileProps) {
 useLanguage();
  const ref = useFocusHook(p.onFocus);
  return (
    <Focusable
      ref={ref}
      className={`ghd-tile ghd-tile-${p.size ?? "normal"} ${p.className ?? ""}`}
      focusClassName={FOCUSED_CLASS}
      noFocusRing
      preferredFocus={p.preferredFocus}
      onMouseMove={e=>{if(movedPointer(e))p.onFocus?.(e.currentTarget);}}
      onActivate={p.onActivate}
      onOKActionDescription={p.okLabel}
      onOptionsButton={p.onOptions}
      onOptionsActionDescription={p.onOptions ? t.details : undefined}
      onMenuButton={p.onMenu ? (e: GamepadEvent) => p.onMenu?.(e.currentTarget) : undefined}
      onMenuActionDescription={p.onMenu ? t.gameMenu : undefined}
      onButtonDown={
        p.onMenu
          ? (e: GamepadEvent) => {
              if (e.detail?.button === GamepadButton.SELECT) p.onMenu?.(e.currentTarget);
            }
          : undefined
      }
      actionDescriptionMap={p.onMenu ? { [GamepadButton.SELECT]: t.gameMenu } : undefined}
    >
      <div className="ghd-tile-box">
        {p.size === "home" && (
          <div className="ghd-tile-aura">
            <div className="ghd-tile-aura-spin" />
          </div>
        )}
        <div className="ghd-tile-art">{p.children}</div>
        <div className="ghd-tile-ring" />
        {p.badge}
      </div>
      <div className="ghd-tile-name">{p.label}</div>
    </Focusable>
  );
}

export function GameTile({
  app,
  size,
  preferredFocus,
  onFocus,
  art = "portrait",
  onActivate,
}: {
  app: App;
  size?: TileProps["size"];
  preferredFocus?: boolean;
  onFocus?: (app: App, el: HTMLElement) => void;
  art?: "portrait" | "hero";
  onActivate?: () => void;
}) {
 useLanguage();
  const running = runningAppId() === app.appid;
  const playable = isInstalled(app) || app.app_type === APP_TYPE_SHORTCUT;
  return (
    <Tile
      size={size}
      label={app.display_name}
      preferredFocus={preferredFocus}
      onFocus={(el) => {highlightSoundtrack(app.appid,el.closest(".ghl-root")?"library":"home");onFocus?.(app, el);}}
      onActivate={onActivate ?? (() => launch(app))}
      onOptions={() => openDetails(app)}
      onMenu={(anchor) => openGameMenu(app, anchor)}
      okLabel={onActivate ? t.details : running ? t.resume : playable ? t.play : t.viewGame}
      className={playable ? "" : "ghd-not-installed"}
      badge={running ? <div className="ghd-badge">{t.running}</div> : undefined}
    >
      <Art
        className="ghd-cover"
        sources={art === "hero" ? [...heroUrls(app), ...portraitUrls(app)] : portraitUrls(app)}
        fallback={<div className="ghd-cover-text">{app.display_name}</div>}
      />
    </Tile>
  );
}

export function ActionTile({
  icon,
  label,
  onActivate,
  onFocus,
  size,
  accent,
  className,
  preferredFocus,
}: {
  icon: ReactNode;
  label: string;
  onActivate: () => void;
  onFocus?: (el: HTMLElement) => void;
  size?: TileProps["size"];
  accent?: boolean;
  className?: string;
  preferredFocus?: boolean;
}) {
 useLanguage();
  return (
    <Tile
      size={size}
      label={label}
      preferredFocus={preferredFocus}
      onActivate={onActivate}
      onFocus={onFocus}
      okLabel={t.open}
      className={`${accent ? "ghd-tile-accent" : "ghd-tile-action"} ${className??""}`}
    >
      <div className="ghd-action">
        <div className="ghd-action-icon">{icon}</div>
      </div>
    </Tile>
  );
}

/** The PS5 white pill (Play) or the round "…" button next to it. */
export function Button({
  children,
  round,
  label,
  preferredFocus,
  onActivate,
  onFocus,
}: {
  children: ReactNode;
  round?: boolean;
  label: string;
  preferredFocus?: boolean;
  /** Gets the button's element, so a menu it opens can be placed next to it. */
  onActivate: (anchor: HTMLElement | null) => void;
  onFocus?: (el: HTMLElement) => void;
}) {
 useLanguage();
  const ref = useFocusHook(onFocus);
  return (
    <Focusable
      ref={ref}
      className={`ghd-button ${round ? "ghd-button-round" : "ghd-button-main"}`}
      focusClassName={FOCUSED_CLASS}
      noFocusRing
      preferredFocus={preferredFocus}
      onActivate={() => onActivate(ref.current)}
      onOKActionDescription={label}
    >
      {children}
    </Focusable>
  );
}

/** A small round icon in the top right corner (search, settings, profile), like the PS5 header. */
export function IconButton({ icon, label, onActivate }: { icon: ReactNode; label: string; onActivate: () => void }) {
 useLanguage();
  return (
    <Focusable
      className="ghd-icon-button"
      focusClassName={FOCUSED_CLASS}
      noFocusRing
      onActivate={onActivate}
      onOKActionDescription={label}
    >
      {icon}
      <span className="ghd-icon-label">{label}</span>
    </Focusable>
  );
}

/** A wide PS5 card with an icon, title and one line of description. */
export function Card({
  icon,
  title,
  description,
  accent,
  preferredFocus,
  onActivate,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  accent?: boolean;
  preferredFocus?: boolean;
  onActivate: () => void;
}) {
 useLanguage();
  return (
    <Focusable
      className={`ghd-card ${accent ? "ghd-card-accent" : ""}`}
      focusClassName={FOCUSED_CLASS}
      noFocusRing
      preferredFocus={preferredFocus}
      onActivate={onActivate}
      onOKActionDescription={t.open}
    >
      <div className="ghd-card-icon">{icon}</div>
      <div className="ghd-card-text">
        <div className="ghd-card-title">{title}</div>
        {description && <div className="ghd-card-desc">{description}</div>}
      </div>
    </Focusable>
  );
}

/** A horizontal row of tiles; moving down into it keeps the column. */
export function Row({
  title,
  anchor,
  className,
  children,
}: {
  title?: string;
  /** The PS5 home row: the selected tile stays at the left edge and the row slides under it. */
  anchor?: boolean;
  className?: string;
  children: ReactNode;
}) {
 useLanguage();
  return (
    <section className={`ghd-section ${anchor ? "ghd-section-clip" : ""} ${className ?? ""}`}>
      {title && <h2 className="ghd-section-title">{title}</h2>}
      <Focusable
        className={`ghd-row ${anchor ? "ghd-row-anchor" : ""}`}
        flow-children="row"
        navEntryPreferPosition={NavEntryPositionPreferences.MAINTAIN_X}
      >
        {children}
      </Focusable>
    </section>
  );
}

/** If one of the plugin's screens crashes, show `fallback` (Steam's own screen) instead of a blank page. */
export class Fallback extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[ps5-dashboard] screen crashed, showing Steam's", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
