import {cachedWelcomeSettings,loadWelcomeSettings,rememberWelcomeSettings} from '../welcome-settings-cache';
import {useLanguage} from "../../i18n";
import {T} from "../../i18n";
import {callable} from '@decky/api';
import {WelcomeBackground} from '../WelcomeBackground';
import {sanitizeSettings,type WelcomeSettings} from '../welcome-layout';
import {WelcomeHub,WelcomeIcon} from '../WelcomeHub';
import {welcomeReturn} from '../welcome-layout';
import {GameDetail} from '../GameDetail';
import {homeHubCSS} from '../home-hub-style';
import {homeHubReturn,clearHomeHubReturn} from '../home-hub-data';
import {focusControl} from '../../navigation';
import {motionAllowed} from '../../focus-motion';
import {StoreBag,LibraryIcon} from '../HomeIcons';
import {StorePreview} from '../StorePreview';
import {useSoundtrackScope,highlightSoundtrack} from '../../themedeck-adapter';
import {useLibraryRevision} from '../../library-live';
import {GameAction} from "../../GameAction";
import { Focusable, Navigation } from "@decky/ui";
import { ReactNode, memo, useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { FaSteam } from "react-icons/fa";
import { IoLibrary } from "react-icons/io5";
import {
  MdApps,
  MdCheckCircle,
  MdDownload,
  MdFavorite,
  MdGridView,
  MdLocalOffer,
  MdMoreHoriz,
  MdPhotoLibrary,
  MdPlayArrow,
  MdSearch,
  MdSettings,
  MdShoppingBag,
} from "react-icons/md";

import { ActionTile, Art, Button, GameTile, Row } from "./components";
import { ActionCard, ActionCards, GameCards } from "./InfoCards";
import { currentSettings } from "./settings";
import { t } from "./i18n";
import {
  APP_TYPE_SHORTCUT,
  App,
  byRecent,
  favoriteApps,
  gameApps,
  heroUrls,
  installedApps,
  landscapeUrls,
  portraitUrls,
  lastPlayedText,
  launch,
  logoUrls,
  openGameMenu,
  openStore,
  playtimeText,
  recentApps,
  runningAppId,
  ROUTES,
  softwareApps,
} from "./steam";
import type { TabId } from "./Shell";

const RECENT_COUNT = 8; // Store + Welcome + eight recent entries + Library = eleven.
const ROW_COUNT = 14;
/** Wait a moment before swapping the big background, so flicking through tiles doesn't strobe. */
const BACKDROP_DELAY_MS = 140;
/** Where a lower row sits once focused, as a share of the screen height from the top. */
const LOWER_ROW_ANCHOR = 0.3;
/** Kept on the top-row tile the game info belongs to, so it stays big while the Play button has focus. */
const SELECTED_CLASS = "ghd-selected";

/** What the top row has selected: a game, or one of the Store / Game Library tiles at its ends. */
type Pick = { app: App } | { welcome?:boolean; store?:boolean; title: string; description: string; icon: ReactNode; go: () => void; cards: ActionCard[] };
type GoTab = (tab: TabId, view?: string) => void;

/** Elements the browser may scroll on its own when Steam focuses something; the home never scrolls them. */
const PINNED = ".ghd-root, .ghd-content, .ghd-section-clip, .ghd-row-anchor";

/**
 * Slides the home row so the selected tile sits at the left edge, like the PS5. Index times a fixed
 * slot width gives the offset, so nothing is measured (no layout read mid-animation) and the move is a
 * transform the GPU runs on its own.
 */
function slideTo(el: HTMLElement) {
  const row = el.parentElement;
  if (!row) return;
  const i = Array.prototype.indexOf.call(row.children, el);
  row.style.transform = `translate3d(calc(${-i} * (var(--ghd-slot) + var(--ghd-gap))), 0, 0)`;
}

/**
 * The full-screen game art. The new picture fades in over the old one (a PS5 crossfade) and the old
 * one is dropped once it's covered, so at most two images are ever on screen.
 */
function Backdrop({ app, dim }: { app?: App; dim: boolean }) {
 useLanguage();
  const [layers, setLayers] = useState<App[]>(app ? [app] : []);
  useEffect(() => {
    if (app) setLayers((l) => (l[l.length - 1]?.appid === app.appid ? l : [...l.slice(-1), app]));
  }, [app]);
  const drop = () => setLayers((l) => (l.length > 1 ? l.slice(-1) : l));
  return (
    <div className={`ghd-backdrop ${dim ? "ghd-dim" : ""} ${app ? "" : "ghd-backdrop-empty"}`}>
      <div className="ghd-backdrop-art">
        {layers.map((a, i) => (
          <div
            key={a.appid}
            className={`ghd-backdrop-layer ${i === layers.length - 1 ? "ghd-backdrop-new" : ""}`}
            onAnimationEnd={i === layers.length - 1 ? drop : undefined}
          >
            <Art
              className="ghd-backdrop-img"
              sources={[...heroUrls(a), ...landscapeUrls(a)]}
              fallback={<div className="ghd-backdrop-img ghd-backdrop-none" />}
            />
          </div>
        ))}
      </div>
      <div className="ghd-backdrop-shade" />
    </div>
  );
}

/** Logo (or name), "Played today · 42 h played", then the white Play pill and the round "…" button. */
function GameInfo({ pick, onFocus }: { pick?: Pick; onFocus: () => void }) {
 useLanguage();
  if (!pick) return null;
  if (!("app" in pick)) {
    return (
      <div className="ghd-info" key={pick.title}>
        <div className="ghd-info-icon">{pick.icon}</div>
        <div className="ghd-info-title">{pick.title}</div>
        <div className="ghd-info-sub">{pick.description}</div>
        <Focusable className="ghd-buttons" flow-children="row">
          <Button label={t.open} preferredFocus onActivate={pick.go} onFocus={onFocus}>
            {t.open}
          </Button>
        </Focusable>
        <ActionCards cards={pick.cards} onFocus={onFocus} />
      </div>
    );
  }
  const { app } = pick;
  const running = runningAppId() === app.appid;
  const playable = app.installed || app.app_type === APP_TYPE_SHORTCUT;
  const label = running ? t.resume : playable ? t.play : t.viewGame;
  const sub = [lastPlayedText(app), playtimeText(app)].filter(Boolean).join("  ·  ");
  return (
    <div className="ghd-info" key={app.appid}>
      <Art
        className="ghd-info-logo"
        sources={logoUrls(app)}
        fallback={<div className="ghd-info-title">{app.display_name}</div>}
      />
      <div className="ghd-info-sub">{sub}</div>
      <Focusable className="ghd-buttons" flow-children="row">
        <GameAction app={app} onFocus={onFocus}/>
        <Button round label={t.moreOptions} onActivate={(anchor) => openGameMenu(app, anchor)} onFocus={onFocus}>
          <MdMoreHoriz />
        </Button>
      </Focusable>

    </div>
  );
}

interface TopRowProps {
  recents: App[];
  goTab: GoTab;
  onTopRow: (pick: Pick, el: HTMLElement) => void;
}

interface LowerRowsProps {
  favorites: App[];
  installed: App[];
  goTab: GoTab;
  onLowerRow: (el: HTMLElement) => void;
}

/**
 * All the tiles. Memoized with stable props, so moving the focus only re-renders the background
 * and the game info, not every tile (each one is a Steam focus node, which is costly to update).
 */
const TopRow = memo(function TopRow({ recents, goTab, onTopRow }: TopRowProps) {
 useLanguage();
  const store: Pick = {
    store:true,
    title: t.storeTitle,
    description: t.storeDesc,
    icon: <StoreBag />,
    go: () => openStore(),
    cards: [
      { icon: <MdLocalOffer />, title: t.specialsTitle, caption: t.specialsDesc, go: () => openStore("specials") },
      { icon: <MdFavorite />, title: t.wishlistTitle, caption: t.wishlistDesc, go: () => openStore("wishlist") },
      { icon: <MdSearch />, title: t.search, caption: t.searchDesc, go: () => Navigation.Navigate(ROUTES.search) },
    ],
  };
  const count = (n: number) => String(n);
  const steamLib = false; // The Home tile always opens the shared PS5 Library.
  const library: Pick = {
    title: steamLib ? t.steamLibrary : t.library,
    description: steamLib ? t.steamLibraryTileDesc : t.libraryDesc,
    icon: <LibraryIcon />,
    go: () => goTab("library"),
    cards: [
      { icon: <MdCheckCircle />, title: t.cardInstalled, caption: count(installedApps().length), go: () => goTab("library", "installed") },
      { icon: <MdGridView />, title: t.cardGames, caption: count(gameApps().length), go: () => goTab("library", "collection") },
      { icon: <MdApps />, title: t.cardApps, caption: count(softwareApps().length), go: () => goTab("library", "apps") },
    ],
  };
  const welcome:Pick={welcome:true,title:'Welcome',description:'',icon:<WelcomeIcon/>,go:()=>{const el=document.querySelector<HTMLElement>('[data-welcome-entry]');focusControl(el);},cards:[]};
  // Store first, Welcome, recent games, Game Library last: the PS5 home row.
  return (
    <Row anchor className="ghd-home-row">
        <ActionTile
          icon={store.icon}
          label={store.title}
          size="home"
          accent
          onFocus={(el) => onTopRow(store, el)}
          onActivate={store.go}
        />
        <ActionTile icon={welcome.icon} label="Welcome" size="home" className="ghd-welcome-tile" preferredFocus={!homeHubReturn} onFocus={el=>onTopRow(welcome,el)} onActivate={welcome.go}/>
        {recents.map((app, i) => (
          <GameTile
            key={app.appid}
            app={app}
            size="home"
            preferredFocus={homeHubReturn?.appid === app.appid}
            onFocus={(a, el) => onTopRow({ app: a }, el)}
          />
        ))}
        <ActionTile
          icon={library.icon}
          label={library.title}
          size="home"
          onFocus={(el) => onTopRow(library, el)}
          onActivate={library.go}
        />
    </Row>
  );
});

/** The rows further down, under the game info. Same memo trick as TopRow. */
const LowerRows = memo(function LowerRows({ favorites, installed, goTab, onLowerRow }: LowerRowsProps) {
 useLanguage();
  return (
    <>
      {favorites.length > 0 && (
        <Row title={t.rowFavorites}>
          {favorites.map((app) => (
            <GameTile key={app.appid} app={app} size="small" onFocus={(_a, el) => onLowerRow(el)} />
          ))}
        </Row>
      )}

      {installed.length > 0 && (
        <Row title={t.rowInstalled}>
          {installed.map((app) => (
            <GameTile key={app.appid} app={app} size="small" onFocus={(_a, el) => onLowerRow(el)} />
          ))}
        </Row>
      )}

      <Row title={t.rowShortcuts}>
        {[
          { icon: <IoLibrary />, label: t.library, go: () => goTab("library") },
          { icon: <MdShoppingBag />, label: t.storeTitle, go: () => openStore() },
          { icon: <MdDownload />, label: t.downloads, go: () => Navigation.Navigate(ROUTES.downloads) },
          { icon: <MdPhotoLibrary />, label: t.media, go: () => Navigation.Navigate(ROUTES.media) },
          { icon: <MdSearch />, label: t.search, go: () => Navigation.Navigate(ROUTES.search) },
          { icon: <MdSettings />, label: t.settings, go: () => Navigation.Navigate(ROUTES.settings) },
        ].map((s) => (
          <ActionTile key={s.label} icon={s.icon} label={s.label} size="small" onFocus={onLowerRow} onActivate={s.go} />
        ))}
      </Row>
    </>
  );
});

export function HomeTab({ goTab,active=true }: { goTab: GoTab;active?:boolean }) {
 useLanguage();
  const revision=useLibraryRevision(active);
  const recents = useMemo(() => recentApps(RECENT_COUNT), [revision]);
  const favorites = useMemo(() => favoriteApps().sort(byRecent).slice(0, ROW_COUNT), [revision]);
  const installed = useMemo(() => installedApps().sort(byRecent).slice(0, ROW_COUNT), [revision]);

  const welcomeRestore=useRef(welcomeReturn);
  const startWelcome=useRef(!!welcomeReturn || !homeHubReturn);
  const restore=useRef(homeHubReturn);
  const initialApp=recents.find(a=>a.appid===restore.current?.appid)??recents[0];
  const [pick, setPick] = useState<Pick | undefined>(startWelcome.current?{welcome:true,title:"Welcome",description:"",icon:<WelcomeIcon/>,go:()=>{},cards:[]}:initialApp ? { app: initialApp } : undefined);
  const [backdrop, setBackdrop] = useState<App | undefined>(initialApp);
  const [lowered, setLowered] = useState(false);
  const [expanded,setExpanded]=useState(!!restore.current);
  const [hubOpened,setHubOpened]=useState<number|undefined>(restore.current?.appid);
  const scroller = useRef<HTMLDivElement>(null);
  const selectedEl = useRef<HTMLElement | null>(null);

  // Establish the selected visual on mount without taking focus from Steam's navigator.
  useLayoutEffect(()=>{
    const el=scroller.current?.querySelector<HTMLElement>(`.ghd-home-row .ghd-tile:nth-child(${startWelcome.current?2:Math.max(0,recents.indexOf(initialApp))+3})`);
    if(el){el.classList.add(SELECTED_CLASS);selectedEl.current=el;slideTo(el);}
  },[]);
  useEffect(()=>{const row=scroller.current?.querySelector<HTMLElement>('.ghd-home-row');if(row)row.inert=expanded;},[expanded]);
  const [storeHero,setStoreHero]=useState<string>();
  const [wallpaper,setWallpaper]=useState<WelcomeSettings|undefined>(cachedWelcomeSettings);
  const wallpaperRevision=useRef(0);
  const updateWallpaper=useCallback((next:WelcomeSettings)=>{wallpaperRevision.current++;setWallpaper(rememberWelcomeSettings(next));},[]);
  useEffect(()=>{let stopped=false;const revision=wallpaperRevision.current;void loadWelcomeSettings(()=>callable<[],WelcomeSettings>('welcome_settings')()).then(raw=>{if(!stopped&&revision===wallpaperRevision.current)setWallpaper(sanitizeSettings(raw));}).catch(()=>{if(!stopped&&revision===wallpaperRevision.current)setWallpaper(sanitizeSettings({background:'existing'}));});return()=>{stopped=true;};},[]);
  const globalWallpaper=wallpaper?.wallpaperScope==='home'&&wallpaper.background!=='existing';
  const welcomeSelected=!!pick&&!("app" in pick)&&!!pick.welcome;
  const storeSelected=!!pick&&!("app" in pick)&&!!pick.store;
  const pickedApp = pick && "app" in pick ? pick.app : undefined;
  useSoundtrackScope("home",active,pickedApp?.appid);
  useEffect(() => {
    const t = window.setTimeout(() => setBackdrop(pickedApp), BACKDROP_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [pickedApp]);

  // Steam focuses tiles with element.focus(), which can make the browser scroll a clipped box by itself
  // and push the selected game out of view. Undo that the moment it happens.
  useEffect(() => {
    const root = scroller.current?.closest<HTMLElement>(".ghd-root");
    if (!root) return;
    const onScroll = (e: Event) => {
      const el = e.target;
      if (el instanceof HTMLElement && el.matches(PINNED) && (el.scrollLeft || el.scrollTop)) {
        el.scrollLeft = 0;
        el.scrollTop = 0;
      }
    };
    root.addEventListener("scroll", onScroll, true);
    return () => root.removeEventListener("scroll", onScroll, true);
  }, []);

  const toTop = useCallback(() => {
    setLowered(false);setExpanded(false);
    const row=scroller.current?.querySelector<HTMLElement>('.ghd-home-row');if(row)row.inert=false;
    scroller.current?.scrollTo({ top: 0, behavior: scroller.current&&motionAllowed(scroller.current)?"smooth":"auto" });
  }, []);
  const onTopRow = useCallback(
    (next: Pick, el: HTMLElement) => {
      if(selectedEl.current===el){toTop();return;}
      selectedEl.current?.classList.remove(SELECTED_CLASS);
      el.classList.add(SELECTED_CLASS);
      selectedEl.current = el;
      slideTo(el);
      setPick(next);
      highlightSoundtrack("app" in next?next.app.appid:null,"home");
      toTop();
    },
    [toTop],
  );
  const onLowerRow = useCallback((el: HTMLElement) => {
    setLowered(true);
    const section = el.closest<HTMLElement>(".ghd-section");
    const s = scroller.current;
    if (section && s) s.scrollTo({ top: section.offsetTop - s.clientHeight * LOWER_ROW_ANCHOR, behavior: "smooth" });
  }, []);

  const enterPlay=useCallback(()=>{if(!pickedApp)return;setLowered(false);setExpanded(true);setHubOpened(pickedApp.appid);const el=scroller.current;const hero=el?.querySelector<HTMLElement>('.ghd-hero');if(el&&hero)el.scrollTo({top:Math.max(0,hero.offsetTop-el.clientHeight*.1),behavior:motionAllowed(el)?'smooth':'auto'});},[pickedApp?.appid]);
  const playFocus=()=>{enterPlay();focusControl(scroller.current?.querySelector<HTMLElement>('.ghd-hero .gh-primary-action .ghd-button'));};
  const navigation=useRef({active,pickedApp,enterPlay,toTop});navigation.current={active,pickedApp,enterPlay,toTop};
  useEffect(()=>{const el=scroller.current;if(!el)return;const handle=(e:Event)=>{const state=navigation.current;if(!state.active)return;
   const topTarget=(e.target as HTMLElement).closest(".ghd-home-row");if(topTarget&&el.querySelector(".gh-welcome")){const b=(e as CustomEvent).detail?.button,k=(e as KeyboardEvent).key;if((e.type==="vgp_ondirection"&&b===10)||k==="ArrowDown"||e.type==="vgp_onmenu"||k==="ContextMenu"){e.preventDefault();e.stopImmediatePropagation();const menu=e.type==="vgp_onmenu"||k==="ContextMenu";if(menu){if(!(e as KeyboardEvent).repeat&&!(e as CustomEvent).detail?.is_repeat){const welcome=el.querySelector<HTMLElement>(".gh-welcome");const E=el.ownerDocument.defaultView?.Event;if(welcome&&E)welcome.dispatchEvent(new E("gh-welcome-edit",{bubbles:true}));}}else focusControl(el.querySelector<HTMLElement>("[data-welcome-entry]"));return;}}
   if(!state.pickedApp)return;const target=e.target as HTMLElement;if(target.closest('.gh-home-details'))return;const top=target.closest('.ghd-home-row'),buttons=target.closest('.ghd-buttons');if(!top&&!buttons)return;
   const k=e as KeyboardEvent,d=(e as CustomEvent).detail;const dir=e.type==='vgp_ondirection'?d?.button:({ArrowUp:9,ArrowDown:10,ArrowLeft:11,ArrowRight:12} as Record<string,number>)[k.key];const cancel=e.type==='vgp_oncancel'||k.key==='Escape';
   const stop=()=>{e.preventDefault();e.stopImmediatePropagation();};
   if(buttons&&(e.type==='vgp_onmenu'||k.key==='ContextMenu')){stop();if(!k.repeat&&!d?.is_repeat)openGameMenu(state.pickedApp,target);return;}
   if(top&&dir===10){stop();state.enterPlay();focusControl(el.querySelector<HTMLElement>('.ghd-hero .gh-primary-action .ghd-button'));return;}
   if(buttons&&(dir===9||cancel)){stop();state.toTop();focusControl(selectedEl.current);return;}
   if(buttons&&dir===10){stop();state.enterPlay();focusControl(el.querySelector<HTMLElement>('.gh-home-summary .gh-detail-control'));return;}
   if(buttons&&(dir===11||dir===12)){stop();const nodes=Array.from(buttons.querySelectorAll<HTMLElement>('.ghd-button'));const i=nodes.indexOf(target.closest('.ghd-button')!);focusControl(nodes[Math.max(0,Math.min(nodes.length-1,i+(dir===11?-1:1)))]);}
  };for(const name of ['keydown','vgp_ondirection','vgp_oncancel','vgp_onmenu'])el.addEventListener(name,handle,true);return()=>{for(const name of ['keydown','vgp_ondirection','vgp_oncancel','vgp_onmenu'])el.removeEventListener(name,handle,true);};},[]);
  useEffect(()=>{if(!restore.current)return;const saved=restore.current;restore.current=undefined;clearHomeHubReturn();const frame=requestAnimationFrame(()=>{enterPlay();if(saved.friends||!scroller.current?.querySelector('.gh-detail-dialog'))focusControl(scroller.current?.querySelector<HTMLElement>(saved.friends?'.gh-home-friends':'.gh-home-trophy'));});return()=>cancelAnimationFrame(frame);},[]);

  return (
    <>
      <style>{homeHubCSS}</style>
      {(pickedApp||welcomeSelected)&&<div className="gh-home-game-heading" data-visible={active&&expanded&&!lowered} aria-hidden={!active||!expanded||lowered}>
        <span className={`gh-home-game-thumb${welcomeSelected?' gh-home-welcome-thumb':''}`}>{welcomeSelected?<WelcomeIcon/>:pickedApp&&<Art sources={[...portraitUrls(pickedApp),...landscapeUrls(pickedApp)]} fallback={<span aria-hidden="true">{pickedApp.display_name.slice(0,1)}</span>}/>}</span>
        <span className="gh-home-game-name">{welcomeSelected?<T text="Welcome"/>:pickedApp?.display_name}</span>
      </div>}
      {wallpaper&&!globalWallpaper&&!(welcomeSelected&&wallpaper.background!=='existing')&&<Backdrop app={welcomeSelected?initialApp:backdrop} dim={lowered} />}
      {wallpaper&&wallpaper.background!=='existing'&&<WelcomeBackground home active={active} hidden={!globalWallpaper&&!welcomeSelected} settings={wallpaper} app={recents.find(a=>a.app_type!==APP_TYPE_SHORTCUT)}/>}
      <div hidden={!wallpaper||globalWallpaper} className={`gh-store-backdrop ${storeSelected?'gh-store-visible':''}`}>{storeHero&&<img key={storeHero} src={storeHero} alt=""/>}</div>
      <style>{`.ghd-store-hero{justify-content:flex-start;padding-top:6vh;padding-bottom:3vh}.gh-store-backdrop{position:absolute;inset:0;opacity:0;pointer-events:none;transition:opacity 300ms ease;background:linear-gradient(120deg,#030911,#102e4c);overflow:hidden}.gh-store-backdrop.gh-store-visible{opacity:1}.gh-store-backdrop img{animation:gh-store-art-in 300ms ease; width:100%;height:100%;object-fit:cover}.gh-store-backdrop:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#010714df,transparent 85%),linear-gradient(0deg,#020914b8,transparent 60%)}.ghd-tile-action .ghd-action{background:#25272d}.ghd-tile-accent .ghd-action{background:linear-gradient(135deg,#349be5,#0874cd)}.ghd-tile:active .ghd-action-icon{opacity:.8}@keyframes gh-store-art-in{from{opacity:0}to{opacity:1}}`}</style>
      <Focusable className={`ghd-scroller ${lowered ? "ghd-lowered" : ""}`} ref={scroller} data-game-hub={pickedApp?true:undefined} data-welcome-hub={welcomeSelected?true:undefined} data-expanded={expanded} flow-children="column">
        <div className="ghd-top-space" />
        <TopRow recents={recents} goTab={goTab} onTopRow={onTopRow} />
        {welcomeSelected&&<WelcomeHub onContentFocus={()=>{if(active){setExpanded(true);setLowered(false);}}} initialSettings={wallpaper} backgroundManaged onSettings={updateWallpaper} active={active} app={recents.find(a=>a.app_type!==APP_TYPE_SHORTCUT)} favorite={favorites[0]} back={()=>{toTop();focusControl(selectedEl.current);}}/>}
        {!welcomeSelected&&<div className={`ghd-hero ${storeSelected?"ghd-store-hero":""}`}>
          {storeSelected?<StorePreview onHero={setStoreHero} onFocus={toTop}/>:<GameInfo pick={pick} onFocus={pickedApp?enterPlay:toTop} />}
        </div>}
        {pickedApp&&<div inert={!expanded||!active}><GameDetail key={pickedApp.appid} app={pickedApp} homeMode active={active&&expanded&&hubOpened===pickedApp.appid} back={playFocus}/></div>}
        {/* Legacy discovery rows must not enter the selected-game scroll/focus surface. */}
        {!pickedApp&&!welcomeSelected&&<LowerRows favorites={favorites} installed={installed} goTab={goTab} onLowerRow={onLowerRow} />}
        <div className="ghd-bottom-space" />
      </Focusable>
    </>
  );
}
