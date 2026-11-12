import {OPEN_GAME_HUB_LIBRARY,returnFromGameHubLibrary} from "../native-library";
import {connectHomeBackBoundary} from '../home-back';
import {T} from "../../i18n";
import {useLanguage} from "../../i18n";
import {MediaHome} from "./MediaHome";
import {openGameHubWeb} from '../../fullscreen-web';
import {focusControl} from '../../navigation';
import {libraryCSS} from '../library-style';
import {readDockPresence,OnlineStatusDot} from "../../presence";
import { Focusable, GamepadButton, GamepadEvent, Navigation } from "@decky/ui";
import { ReactNode, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { IoLibrary } from "react-icons/io5";
import {
  MdApps,
  MdChat,
  MdDownload,
  MdFavorite,
  MdGroup,
  MdLocalOffer,
  MdMail,
  MdPerson,
  MdPhotoLibrary,
  MdSearch,
  MdSettings,
  MdShoppingBag,
} from "react-icons/md";

import { Card, FOCUSED_CLASS, IconButton, useFocusReveal } from "./components";
import { LibraryTab } from "./Library";
import { t } from "./i18n";
import { HomeTab } from "./Ps5Home";
import { currentSettings } from "./settings";
import { ROUTES, openStore, persona } from "./steam";
import { PS5_CSS } from "./styles";

/** "games" and "media" are the two PS5 tabs; "library" is the Game Library screen opened from the home row. */
export type TabId = "games" | "media" | "library";

const TABS: { id: TabId; label: string }[] = [
  { id: "games", label: t.tabGames },
  { id: "media", label: t.tabMedia },
];

interface CardDef {
  icon: ReactNode;
  title: string;
  description: string;
  go: () => void;
}

const steamWeb = (url: string) => () => openGameHubWeb(url,u=>Navigation.NavigateToSteamWeb(u));
const PROFILE_URL = "https://steamcommunity.com/my/";

function mediaCards(openApps: () => void): CardDef[] {
  return [
    { icon: <MdPhotoLibrary />, title: t.media, description: t.mediaDesc, go: () => Navigation.Navigate(ROUTES.media) },
    { icon: <MdApps />, title: t.viewApps, description: t.appsDesc, go: openApps },
    { icon: <MdShoppingBag />, title: t.storeTitle, description: t.storeDesc, go: () => openStore() },
    { icon: <MdLocalOffer />, title: t.specialsTitle, description: t.specialsDesc, go: () => openStore("specials") },
    { icon: <MdFavorite />, title: t.wishlistTitle, description: t.wishlistDesc, go: () => openStore("wishlist") },
    { icon: <MdChat />, title: t.gameBaseTitle, description: t.gameBaseDesc, go: () => Navigation.NavigateToChat() },
    { icon: <MdMail />, title: t.invitesTitle, description: t.invitesDesc, go: () => Navigation.NavigateToInvites() },
    { icon: <MdGroup />, title: t.communityTitle, description: t.communityDesc, go: steamWeb("https://steamcommunity.com/") },
    { icon: <MdDownload />, title: t.downloads, description: t.downloadsDesc, go: () => Navigation.Navigate(ROUTES.downloads) },
  ];
}

function CardsTab({ cards }: { cards: CardDef[] }) {
 useLanguage();
  return (
    <Focusable className="ghd-page ghd-cards" flow-children="grid">
      {cards.map((c, i) => (
        <Card key={c.title} icon={c.icon} title={c.title} description={c.description} accent={i === 0} preferredFocus={i === 0} onActivate={c.go} />
      ))}
    </Focusable>
  );
}

/** Search, settings, power and the profile picture: the PS5's top right corner. */
function TopIcons() {
 useLanguage();
  const me = useMemo(persona, []);
  const [now,setNow]=useState(()=>new Date());
  const presence=readDockPresence(window,undefined).profile;
  useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),1000);return()=>window.clearInterval(timer);},[]);
  return (
    <Focusable className="ghd-topicons" flow-children="row">
      <IconButton icon={<MdSearch />} label={t.search} onActivate={() => Navigation.Navigate(ROUTES.search)} />
      <IconButton icon={<MdSettings />} label={t.settings} onActivate={() => Navigation.Navigate(ROUTES.settings)} />
      <IconButton
        icon={<span className="ghd-profile-avatar" title={`Steam presence: ${presence}`}>{me.avatar ? <img className="ghd-avatar" src={me.avatar} /> : <MdPerson />}<OnlineStatusDot state={presence}/></span>}
        label={me.name || t.profile}
        onActivate={steamWeb(PROFILE_URL)}
      />
      <time className="ghd-clock">{now.toLocaleTimeString([], {hour:"numeric",minute:"2-digit",hour12:true})}</time>
    </Focusable>
  );
}

function TabBar({ tab }: { tab: TabId }) {
 useLanguage();
  if (tab === "library") {
    return (
      <div className="ghd-tabbar">
        <span className="ghd-tab ghd-tab-active">
          <IoLibrary /> {t.library}
        </span>
      </div>
    );
  }
  return (
    <div className="ghd-tabbar">
      <span className="ghd-bumper">L1</span>
      {TABS.map((x) => (
        <div key={x.id} className={`ghd-tab ${x.id === tab ? "ghd-tab-active" : ""}`}>
          {<T text={x.id==='games'?'Games':'Media'}/>}
        </div>
      ))}
      <span className="ghd-bumper">R1</span>
    </div>
  );
}

/** The PS5 home: Games / Media on top (L1 / R1 to switch), icons on the right and one page per tab. */
export function Ps5Shell({ initialTab = "games" }: { initialTab?: TabId }) {
 useLanguage();
  const [tab, setTab] = useState<TabId>(initialTab);
  const [libraryView, setLibraryView] = useState("installed");
  useEffect(()=>{setTab(initialTab);},[initialTab]);
  useEffect(()=>{const open=()=>setTab("library");window.addEventListener(OPEN_GAME_HUB_LIBRARY,open);return()=>window.removeEventListener(OPEN_GAME_HUB_LIBRARY,open);},[]);
  const root = useRef<HTMLDivElement>(null);
  const contentNav = useRef<any>(null);
  const firstRender = useRef(true);
  useFocusReveal(root);

  const backHome=useCallback(()=>returnFromGameHubLibrary(initialTab,path=>Navigation.Navigate(path),()=>setTab('games')),[initialTab]);
  useEffect(()=>{
    const el=root.current;if(!el)return;
    return connectHomeBackBoundary(el,()=>tab==='games',()=>focusControl(el.querySelector<HTMLElement>('.ghd-scroller .ghd-selected')));
  },[tab]);

  useEffect(()=>{
    if(tab!=='games')return;
    const frame=requestAnimationFrame(()=>focusControl(root.current?.querySelector<HTMLElement>('.ghd-scroller .ghd-selected')));
    return()=>cancelAnimationFrame(frame);
  },[tab]);

  const goTab = (next: TabId, view = "installed") => {
    setLibraryView(view);
    setTab(next);
  };
  const cards = mediaCards(() => goTab("library", "apps"));

  const step = (dir: 1 | -1) => {
    const i = Math.max(0, TABS.findIndex((x) => x.id === tab));
    setTab(TABS[(i + dir + TABS.length) % TABS.length].id);
  };

  const onButtonDown = (e: GamepadEvent) => {
    if(tab==='library')return;
    const button = e.detail?.button;
    if (button === GamepadButton.BUMPER_LEFT) step(-1);
    else if (button === GamepadButton.BUMPER_RIGHT) step(1);
  };

  return (
    <div className={`ghd-root ghd-tab-${tab}`} ref={root}>
      <style>{PS5_CSS}{libraryCSS}</style>
      {tab!=='library'&&<TabBar tab={tab} />}
      <Focusable
        className="ghd-content"
        flow-children="column"
        {...({ navRef: contentNav } as any)}
        onButtonDown={onButtonDown}
        onCancelButton={tab === "media" ? () => setTab("games") : undefined}
        onCancelActionDescription={tab === "games" ? undefined : t.tabGames}
        actionDescriptionMap={{
          [GamepadButton.BUMPER_LEFT]: t.prevTab,
          [GamepadButton.BUMPER_RIGHT]: t.nextTab,
        }}
      >
        <div hidden={tab==='library'}><TopIcons /></div>
        <div hidden={tab!=='games'} inert={tab!=='games'}><HomeTab goTab={goTab} active={tab==='games'}/></div>
        {tab === "media" && <MediaHome utilities={cards} renderLibrary={()=><CardsTab cards={cards}/>}/>}
        {tab === "library" && <LibraryTab initialView={libraryView} back={backHome} />}
      </Focusable>
    </div>
  );
}
