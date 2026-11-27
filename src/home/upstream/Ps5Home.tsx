import {homeSequence} from '../console-motion';
import {catalogItems} from '../store-account';
import {plainText} from '../../game-content';
import {HomeTrailer} from '../HomeTrailer';
import {HomeBackdrop,prepareHomeArt} from '../HomeBackdrop';
import {cachedWelcomeSettings,loadWelcomeSettings,rememberWelcomeSettings} from '../welcome-settings-cache';
import {useLanguage} from "../../i18n";
import {T} from "../../i18n";
import {callable} from '@decky/api';
import {WelcomeBackground} from '../WelcomeBackground';
import {sanitizeSettings,type WelcomeSettings} from '../welcome-layout';
import {WelcomeHub,WelcomeIcon} from '../WelcomeHub';
import {welcomeReturn,rememberWelcome} from '../welcome-layout';
import {openFriendsWhoPlay} from '../FriendsWhoPlay';
import {GameDetail} from '../GameDetail';
import {homeHubCSS} from '../home-hub-style';
import {homeHubReturn,clearHomeHubReturn} from '../home-hub-data';

import {focusControl,focusNavigation} from '../../navigation';
import {motionAllowed} from '../../focus-motion';
import {StoreBag,LibraryIcon} from '../HomeIcons';
import {StorePreview} from '../StorePreview';
import {useSoundtrackScope,highlightSoundtrack} from '../../themedeck-adapter';
import {useLibraryRevision} from '../../library-live';
import {GameAction} from "../../GameAction";
import { Focusable, Navigation } from "@decky/ui";
import { ReactNode, memo, useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import {useAchievements} from "./gameinfo";
import {BsClockFill} from "react-icons/bs";
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
  APP_TYPE_GAME, APP_TYPE_SHORTCUT,
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

function useHomePlaytime(app?:App){
  const shortcutId=app?.app_type===APP_TYPE_SHORTCUT?app.appid:undefined;
  const [details,setDetails]=useState<{id:number;minutes:number}>();
  useEffect(()=>{
    if(shortcutId===undefined)return;
    const store=(window as any).appDetailsStore;
    let active=true;
    const update=(value:{nPlaytimeForever?:number}|undefined)=>{
      const minutes=value?.nPlaytimeForever;
      if(active&&typeof minutes==='number'&&Number.isFinite(minutes)&&minutes>=0)
        setDetails({id:shortcutId,minutes});
    };
    if(store?.RegisterForAppData){
      const subscription=store.RegisterForAppData(shortcutId,update);
      return ()=>{active=false;subscription?.unregister?.();};
    }
    Promise.resolve(store?.RequestAppDetails?.(shortcutId)).then(update).catch(()=>{});
    return ()=>{active=false;};
  },[shortcutId]);
  if(shortcutId!==undefined){
    if(details?.id===shortcutId)return details.minutes;
    const cached=(window as any).appDetailsStore?.GetAppDetails?.(shortcutId)?.nPlaytimeForever;
    if(typeof cached==='number'&&Number.isFinite(cached)&&cached>=0)return cached;
    return app?.minutes_playtime_forever||undefined;
  }
  return app?.minutes_playtime_forever;
}

function GameStats({app,minutes}:{app:App;minutes?:number}){
  const result=useAchievements(app);
  const stats=result.state==='done'?result.value:null;
  const progress=stats&&stats.total>0?Math.floor(100*stats.done/stats.total):undefined;
  const played=minutes==null||minutes<0?'—':minutes===0?'0h':minutes<60?`${minutes}m`:`${Math.floor(minutes/60)}h`;
  return <div className="gh-home-game-stats">
    <span aria-label={progress===undefined?'Achievement progress unavailable':`Achievement progress ${progress}%`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h6v-4h5v-4h7v12H3zM18 10V2h1v1l-7 3 6 1v3z"/></svg>
      {progress===undefined?'—':progress+'%'}
    </span>
    <span aria-label={played==='—'?'Playtime unavailable':`Played for ${played}`}><BsClockFill aria-hidden="true"/>{played}</span>
  </div>;
}

/** Logo (or name), "Played today · 42 h played", then the white Play pill and the round "…" button. */
function GameInfo({ pick, selected=pick, presented=true, descriptions, onFocus }: { descriptions:Record<number,string>; presented?:boolean; pick?: Pick; selected?:Pick; onFocus: () => void }) {
 useLanguage();
  const info=useRef<HTMLDivElement>(null);
  const minutes=useHomePlaytime(pick&&"app" in pick?pick.app:undefined);
  const shownId=pick&&"app" in pick?pick.app.appid:undefined;
  useLayoutEffect(()=>{
    const buttons=info.current?.querySelector<HTMLElement>('.ghd-buttons');
    if(!presented||!buttons||!motionAllowed(buttons)||buttons.contains(buttons.ownerDocument.activeElement)||typeof buttons.animate!=='function')return;
    const entry=buttons.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],
      {duration:homeSequence.reveal,delay:homeSequence.actionLag,easing:homeSequence.glide,fill:'backwards'});
    return ()=>entry.cancel();
  },[shownId,presented]);
  if (!pick) return null;
  if (!("app" in pick)) {
    return (
      <div className="ghd-info" key={pick.title}>
        <div className="ghd-info-icon">{pick.icon}</div>
        <div className="ghd-info-title">{pick.title}</div>
        <div className="ghd-info-sub">{pick.description}</div>
        <Focusable className="ghd-buttons" flow-children="row">
          <Button label={t.open} preferredFocus onActivate={()=>{if(selected&&!("app" in selected))selected.go();}} onFocus={onFocus}>
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
  const sub = [lastPlayedText(app), playtimeText(app,minutes)].filter(Boolean).join("  ·  ");
  return (
    <div className="ghd-info" ref={info}>
      <Art
        key={app.appid} className="ghd-info-logo"
        sources={logoUrls(app)}
        fallback={<div className="ghd-info-title">{app.display_name}</div>}
      />
      {descriptions[app.appid]&&<div key={"description-"+app.appid} className="ghd-info-sub gh-home-synopsis">{descriptions[app.appid]}</div>}
      <div key={"meta-"+app.appid} className="ghd-info-sub gh-home-meta">{sub}</div>
      <Focusable className="ghd-buttons" flow-children="row">
        {selected&&"app" in selected&&<GameAction app={selected.app} onFocus={onFocus}/>}
        <Button round label={t.moreOptions} onActivate={(anchor) => {if(selected&&"app" in selected)openGameMenu(selected.app, anchor);}} onFocus={onFocus}>
          <MdMoreHoriz />
        </Button>
        <GameStats key={app.appid} app={app} minutes={minutes}/>
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
  const descriptionIds=recents.filter(a=>a.app_type===APP_TYPE_GAME).map(a=>a.appid).join(',');
  const [descriptions,setDescriptions]=useState<Record<number,string>>({});
  useEffect(()=>{
    if(!active||!descriptionIds)return;
    let live=true;
    void catalogItems(descriptionIds.split(',').map(id=>({appid:Number(id)})),false,true).then(rows=>{
      if(live)setDescriptions(Object.fromEntries(rows.filter(r=>r.basic_info?.short_description).map(r=>[r.id,plainText(r.basic_info.short_description)])));
    }).catch(()=>{});
    return ()=>{live=false;};
  },[active,descriptionIds]);
  const [settled,setSettled]=useState(pick);
  const [scene,setScene]=useState(pick);
  const [missingArt,setMissingArt]=useState(false);
  const [lowered, setLowered] = useState(false);
  const [expanded,setExpanded]=useState(!!restore.current||!!welcomeRestore.current);
  const [hubOpened,setHubOpened]=useState<number|undefined>(restore.current?.appid);
  const scroller = useRef<HTMLDivElement>(null);
  const selectedEl = useRef<HTMLElement | null>(null);

  // Establish the selected visual on mount without taking focus from Steam's navigator.
  useLayoutEffect(()=>{
    const el=scroller.current?.querySelector<HTMLElement>(`.ghd-home-row .ghd-tile:nth-child(${startWelcome.current?2:Math.max(0,recents.indexOf(initialApp))+3})`);
    if(el){el.classList.add(SELECTED_CLASS);selectedEl.current=el;slideTo(el);}
  },[]);
  useLayoutEffect(()=>{const row=scroller.current?.querySelector<HTMLElement>('.ghd-home-row');if(row)row.inert=expanded;},[expanded]);
  const [storeHero,setStoreHero]=useState<string[]>([]);
  const [wallpaper,setWallpaper]=useState<WelcomeSettings|undefined>(cachedWelcomeSettings);
  const wallpaperRevision=useRef(0);
  const updateWallpaper=useCallback((next:WelcomeSettings)=>{wallpaperRevision.current++;setWallpaper(rememberWelcomeSettings(next));},[]);
  useEffect(()=>{let stopped=false;const revision=wallpaperRevision.current;void loadWelcomeSettings(()=>callable<[],WelcomeSettings>('welcome_settings')()).then(raw=>{if(!stopped&&revision===wallpaperRevision.current)setWallpaper(sanitizeSettings(raw));}).catch(()=>{if(!stopped&&revision===wallpaperRevision.current)setWallpaper(sanitizeSettings({background:'existing'}));});return()=>{stopped=true;};},[]);
  const globalWallpaper=wallpaper?.wallpaperScope==='home'&&wallpaper.background!=='existing';
  const welcomeSelected=!!pick&&!("app" in pick)&&!!pick.welcome;
  useLayoutEffect(()=>{
    const header=scroller.current?.closest<HTMLElement>('.ghd-root')?.querySelector<HTMLElement>('.ghd-topicons');
    if(!header||!active||!welcomeSelected||!expanded)return;
    const previous=header.inert;header.inert=true;
    return()=>{header.inert=previous;};
  },[active,welcomeSelected,expanded]);
  const storeSelected=!!pick&&!("app" in pick)&&!!pick.store;
  const pickedApp = pick && "app" in pick ? pick.app : undefined;
  useSoundtrackScope("home",active,pickedApp?.appid);
  useLayoutEffect(()=>{
    const el=scroller.current;
    if(!pickedApp||!el||!motionAllowed(el)){
      setScene(pick);setSettled(pick);setMissingArt(false);return;
    }
    let live=true,artTimer=0,revealTimer=0;
    const start=performance.now();
    // Decode immediately; all deadlines are relative to this selection.
    void prepareHomeArt(pickedApp,true);
    const image=globalWallpaper?Promise.resolve(true):prepareHomeArt(pickedApp);
    void image.then(ready=>{
      if(!live)return;
      artTimer=window.setTimeout(()=>{
        setMissingArt(!ready);setScene(pick);
        // A slow decode may move the dissolve later. Give it the same head
        // start before showing the title, even on an uncached game.
        revealTimer=window.setTimeout(()=>setSettled(pick),homeSequence.titleAt-homeSequence.artAt);
      },Math.max(0,homeSequence.artAt-(performance.now()-start)));
    });
    return ()=>{live=false;window.clearTimeout(artTimer);window.clearTimeout(revealTimer);};
  },[pick,pickedApp,globalWallpaper]);
  const summaryApp=!expanded&&settled&&"app" in settled?settled.app:pickedApp;
  const sceneApp=scene&&"app" in scene?scene.app:undefined;

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

  // Native smooth scrolling can run on the compositor during React commits.
  const destination=useRef<number|undefined>(undefined);
  const scrollHome=useCallback((el:HTMLElement,value:number)=>{
    const top=Math.max(0,Math.min(value,el.scrollHeight-el.clientHeight));
    if(destination.current===top&&Math.abs(el.scrollTop-top)<1)return;
    destination.current=top;
    el.scrollTo({top,behavior:motionAllowed(el)?'smooth':'instant'});
  },[]);
  const focusGameControl=(target:HTMLElement|null|undefined,follow=false)=>{
    const el=scroller.current;if(!el||!target)return;
    const top=el.scrollTop;
    focusNavigation(target);
    if(el.scrollTop!==top)el.scrollTo({top,behavior:'instant'});
    if(!follow)return;
    const strip=target.closest<HTMLElement>('.gh-detail-row,.gh-achievement-filters');
    if(strip){const r=target.getBoundingClientRect(),v=strip.getBoundingClientRect();
      if(r.left<v.left||r.right>v.right)strip.scrollLeft+=r.left<v.left?r.left-v.left:r.right-v.right;}
    const r=target.getBoundingClientRect(),v=el.getBoundingClientRect();
    const dest=(destination.current??el.scrollTop),pad=Math.min(42,v.height*.055);
    const low=r.top-v.top+top-pad,high=r.bottom-v.bottom+top+pad;
    if(dest>low)scrollHome(el,low);else if(dest<high)scrollHome(el,high);
  };
  const toTop = useCallback(() => {
    rememberWelcome(undefined);setLowered(false);setExpanded(false);
    const row=scroller.current?.querySelector<HTMLElement>('.ghd-home-row');if(row)row.inert=false;
    const el=scroller.current;if(el?.hasAttribute("data-game-hub"))scrollHome(el,0);else el?.scrollTo({top:0,behavior:motionAllowed(el)?"smooth":"auto"});
  }, []);
  const returnToGameRow=useCallback(()=>{
    const el=scroller.current,tile=selectedEl.current;
    if(!el||!tile)return;
    const row=tile.closest<HTMLElement>('.ghd-home-row');
    if(row)row.inert=false;
    const top=el.scrollTop;
    focusNavigation(tile);
    // Steam may scroll synchronously during focus. Restore the starting point
    // before issuing the final scroll so focus cannot cancel the trip to zero.
    if(el.scrollTop!==top)el.scrollTo({top,behavior:'instant'});
    toTop();
  },[toTop]);
  const onTopRow = useCallback(
    (next: Pick, el: HTMLElement) => {
      // Steam can restore a stale top-row focus while returning from a widget.
      if(scroller.current?.dataset.expanded==='true'&&scroller.current.hasAttribute('data-welcome-hub'))return;
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
    if (section && s) scrollHome(s,section.offsetTop - s.clientHeight * LOWER_ROW_ANCHOR);
  }, []);

  const enterPlay=useCallback(()=>{if(!pickedApp)return;setLowered(false);setExpanded(true);setHubOpened(pickedApp.appid);const el=scroller.current;const hero=el?.querySelector<HTMLElement>('.ghd-hero');if(el&&hero)scrollHome(el,hero.offsetTop-el.clientHeight*.05);},[pickedApp?.appid]);
  useEffect(()=>{
    const el=scroller.current;if(!active||!el||!pickedApp)return;
    const wheel=(event:WheelEvent)=>{
      if(event.ctrlKey||!event.deltaY||Math.abs(event.deltaX)>Math.abs(event.deltaY)||(event.target as Element).closest('.gh-detail-dialog'))return;
      destination.current=undefined;
      if(event.deltaY>0){setExpanded(true);setHubOpened(pickedApp.appid);setLowered(false);}
      else if(el.scrollTop<=1&&el.dataset.expanded==='true')returnToGameRow();
    };
    const settled=(event:Event)=>{
      if(event.target!==el)return;
      destination.current=undefined;
      if(el.scrollTop<=1&&el.dataset.expanded==='true')returnToGameRow();
    };
    el.addEventListener('wheel',wheel,{passive:true});
    el.addEventListener('scrollend',settled);
    return()=>{el.removeEventListener('wheel',wheel);el.removeEventListener('scrollend',settled);destination.current=undefined};
  },[active,pickedApp,returnToGameRow]);
  const playFocus=()=>{enterPlay();focusGameControl(scroller.current?.querySelector<HTMLElement>('.ghd-hero .gh-primary-action .ghd-button'));};
  const navigation=useRef({active,pickedApp,enterPlay,toTop});navigation.current={active,pickedApp,enterPlay,toTop};
  useEffect(()=>{const el=scroller.current;if(!el)return;const handle=(e:Event)=>{const state=navigation.current;if(!state.active)return;
   const topTarget=(e.target as HTMLElement).closest(".ghd-home-row");if(topTarget&&el.querySelector(".gh-welcome")){const b=(e as CustomEvent).detail?.button,k=(e as KeyboardEvent).key;if((e.type==="vgp_ondirection"&&b===10)||k==="ArrowDown"||e.type==="vgp_onmenu"||k==="ContextMenu"){e.preventDefault();e.stopImmediatePropagation();const menu=e.type==="vgp_onmenu"||k==="ContextMenu";if(menu){if(!(e as KeyboardEvent).repeat&&!(e as CustomEvent).detail?.is_repeat){const welcome=el.querySelector<HTMLElement>(".gh-welcome");const E=el.ownerDocument.defaultView?.Event;if(welcome&&E)welcome.dispatchEvent(new E("gh-welcome-edit",{bubbles:true}));}}else focusControl(el.querySelector<HTMLElement>("[data-welcome-entry]"));return;}}
   if(!state.pickedApp)return;const target=e.target as HTMLElement;if(target.closest('.gh-home-details'))return;const top=target.closest('.ghd-home-row'),buttons=target.closest('.ghd-buttons');if(!top&&!buttons)return;
   const k=e as KeyboardEvent,d=(e as CustomEvent).detail;const dir=e.type==='vgp_ondirection'?d?.button:({ArrowUp:9,ArrowDown:10,ArrowLeft:11,ArrowRight:12} as Record<string,number>)[k.key];const cancel=e.type==='vgp_oncancel'||k.key==='Escape';
   const stop=()=>{e.preventDefault();e.stopImmediatePropagation();};
   if(buttons&&(e.type==='vgp_onmenu'||k.key==='ContextMenu')){stop();if(!k.repeat&&!d?.is_repeat)openGameMenu(state.pickedApp,target);return;}
   if(top&&dir===10){stop();state.enterPlay();focusGameControl(el.querySelector<HTMLElement>('.ghd-hero .gh-primary-action .ghd-button'));return;}
   if(buttons&&(dir===9||cancel)){stop();returnToGameRow();return;}
   if(top&&dir===9&&(k.repeat||d?.is_repeat)){stop();return;}
   if(buttons&&dir===10){stop();focusGameControl(el.querySelector<HTMLElement>('.gh-home-summary .gh-detail-control'),true);return;}
   if(buttons&&(dir===11||dir===12)){stop();const nodes=Array.from(buttons.querySelectorAll<HTMLElement>('.ghd-button'));const i=nodes.indexOf(target.closest('.ghd-button')!);focusControl(nodes[Math.max(0,Math.min(nodes.length-1,i+(dir===11?-1:1)))]);}
  };for(const name of ['keydown','vgp_ondirection','vgp_oncancel','vgp_onmenu'])el.addEventListener(name,handle,true);return()=>{for(const name of ['keydown','vgp_ondirection','vgp_oncancel','vgp_onmenu'])el.removeEventListener(name,handle,true);};},[]);
  useEffect(()=>{if(!restore.current)return;const saved=restore.current;restore.current=undefined;clearHomeHubReturn();const frame=requestAnimationFrame(()=>{enterPlay();const card=scroller.current?.querySelector<HTMLElement>('.gh-home-friends');if(saved.friendId&&initialApp?.appid===saved.appid&&card){openFriendsWhoPlay(initialApp,card,saved.friendId);return;}if(saved.friends||!scroller.current?.querySelector('.gh-detail-dialog'))focusControl(scroller.current?.querySelector<HTMLElement>(saved.friends?'.gh-home-friends':'.gh-home-trophy'));});return()=>cancelAnimationFrame(frame);},[]);

  return (
    <>
      <style>{homeHubCSS}</style>
      {(pickedApp||welcomeSelected)&&<div className="gh-home-game-heading" data-visible={active&&expanded&&!lowered} aria-hidden={!active||!expanded||lowered}>
        <span className={`gh-home-game-thumb${welcomeSelected?' gh-home-welcome-thumb':''}`}>{welcomeSelected?<WelcomeIcon/>:pickedApp&&<Art sources={[...portraitUrls(pickedApp),...landscapeUrls(pickedApp)]} fallback={<span aria-hidden="true">{pickedApp.display_name.slice(0,1)}</span>}/>}</span>
        <span className="gh-home-game-name">{welcomeSelected?<T text="Welcome"/>:pickedApp?.display_name}</span>
      </div>}
      {wallpaper&&!globalWallpaper&&<HomeBackdrop retain={welcomeSelected&&wallpaper.background!=='existing'} app={welcomeSelected&&wallpaper.background==='existing'?initialApp:missingArt?undefined:sceneApp} nearby={recents} dim={lowered}>{active&&pickedApp&&pickedApp.appid===sceneApp?.appid&&pickedApp.app_type!==APP_TYPE_SHORTCUT&&<HomeTrailer key={pickedApp.appid} appid={pickedApp.appid}/>}</HomeBackdrop>}
      {wallpaper&&wallpaper.background!=='existing'&&<WelcomeBackground home active={active} hidden={!globalWallpaper&&!welcomeSelected&&!(pickedApp&&scene&&"welcome" in scene&&scene.welcome)} settings={wallpaper} app={recents.find(a=>a.app_type!==APP_TYPE_SHORTCUT)}/>}
      <div aria-hidden="true" className={`gh-store-backdrop ${(storeSelected||(pickedApp&&scene&&'store' in scene&&scene.store))?'gh-store-visible':''}`}>{storeHero.length>0&&<Art sources={storeHero}/>}</div>
      <style>{`.ghd-store-hero{justify-content:flex-start;padding-top:6vh;padding-bottom:3vh}.gh-store-backdrop{position:absolute;inset:0;opacity:0;pointer-events:none;transition:opacity 300ms ease;background:linear-gradient(120deg,#030911,#102e4c);overflow:hidden}.gh-store-backdrop.gh-store-visible{opacity:1}.gh-store-backdrop img{animation:gh-store-art-in 300ms ease; width:100%;height:100%;object-fit:cover}.gh-store-backdrop:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#02071255,transparent 58%),linear-gradient(0deg,#02061070,transparent 31%,transparent 81%,#02061045)}.ghd-tile-action .ghd-action{background:#25272d}.ghd-tile-accent .ghd-action{background:linear-gradient(135deg,#349be5,#0874cd)}.ghd-tile:active .ghd-action-icon{opacity:.8}@keyframes gh-store-art-in{from{opacity:0}to{opacity:1}}`}</style>
      <Focusable className={`ghd-scroller ${lowered ? "ghd-lowered" : ""}`} ref={scroller} data-game-hub={pickedApp?true:undefined} data-welcome-hub={welcomeSelected?true:undefined} data-expanded={expanded} flow-children="column">
        <div className="ghd-top-space" />
        <TopRow recents={recents} goTab={goTab} onTopRow={onTopRow} />
        {welcomeSelected&&<WelcomeHub onContentFocus={()=>{if(active){setExpanded(true);setLowered(false);}}} initialSettings={wallpaper} backgroundManaged onSettings={updateWallpaper} active={active} app={recents.find(a=>a.app_type!==APP_TYPE_SHORTCUT)} favorite={favorites[0]} back={()=>{toTop();focusControl(selectedEl.current);}}/>}
        {!welcomeSelected&&<div className={`ghd-hero ${storeSelected?"ghd-store-hero":""}`}>
          {storeSelected?<StorePreview onHero={setStoreHero} onFocus={toTop}/>:<div className="gh-game-presentation" data-leaving={settled!==pick} onFocusCapture={()=>setSettled(pick)}><GameInfo descriptions={descriptions} presented={settled===pick} selected={pick} pick={pickedApp&&settled&&"app" in settled?settled:pick} onFocus={pickedApp?enterPlay:toTop} /></div>}
        </div>}
        {pickedApp&&summaryApp&&<div className="gh-home-secondary" data-leaving={!expanded&&settled!==pick} inert={!active||summaryApp.appid!==pickedApp.appid} onFocusCapture={()=>{if(active&&!expanded){setExpanded(true);setHubOpened(pickedApp.appid);}}}><GameDetail key={summaryApp.appid} app={summaryApp} homeFocus={focusGameControl} homeMode active={active&&expanded&&hubOpened===pickedApp.appid} back={playFocus}/></div>}
        {/* Legacy discovery rows must not enter the selected-game scroll/focus surface. */}
        {!pickedApp&&!welcomeSelected&&<LowerRows favorites={favorites} installed={installed} goTab={goTab} onLowerRow={onLowerRow} />}
        <div className="ghd-bottom-space" />
      </Focusable>
    </>
  );
}
