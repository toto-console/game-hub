import {gameOptionsCSS} from '../game-options-style';
import {gameAction} from '../../game-action';
import {openGameHubWeb} from '../../fullscreen-web';
import {openGameMusic} from '../../GameMusicSettings';
import {stopSoundtrackForLaunch} from '../../themedeck-adapter';
import {Menu,MenuItem,MenuGroup} from '@decky/ui';
import {playGame,gameById} from "../../game-adapter";
import {launchShortcutFromLibrary} from "../shortcut-launch";
import { Navigation, Router, findModuleByExport, showContextMenu } from "@decky/ui";
import {pluginInventory} from "../../decky-adapter";
import {openDeckyPlugin} from "../../system-adapters";
import { createElement, type ComponentType } from "react";

import { t } from "./i18n";

export type {LibraryApp as App} from '../../library-data';
import {readLibrary,recentLibrary,isInstalled,lastPlayed,type LibraryApp as App} from '../../library-data';
declare const collectionStore: any;
declare const appStore: any;
declare const friendStore: any;
declare const SteamClient: any;

export const APP_TYPE_GAME = 1;
export const APP_TYPE_SOFTWARE = 2;
export const APP_TYPE_SHORTCUT = 1073741824;
const LISTED_TYPES = new Set([APP_TYPE_GAME, APP_TYPE_SOFTWARE, APP_TYPE_SHORTCUT]);

const CDN = "https://shared.steamstatic.com/store_item_assets/steam/apps";
/** Steam's ELaunchSource for a launch started from the library. */
const LAUNCH_SOURCE = 100;

export const LIBRARY_ROUTE = "/game-hub/home/library";

/** Game Mode routes, as Steam's own menus open them ("/media" alone renders an empty page). */
export const ROUTES = {
  library: "/library",
  downloads: "/library/downloads",
  media: "/media/grid",
  search: "/search",
  settings: "/settings",
};

export const STORE_URL = "https://store.steampowered.com/";
export const DONATE_URL = "https://buymeacoffee.com/kromossomoc";

/** Opens the author's Buy Me a Coffee page in Steam's browser (closing the Quick Access menu first). */
export function openDonate() {
  Navigation.CloseSideMenus();
  Navigation.NavigateToExternalWeb(DONATE_URL);
}

/** The Store in Game Mode is a Steam web page, not a route of its own. */
export function openStore(path = "") {
  const product=/^app\/(\d+)\/?$/.exec(path);
  if(!path||product){
    Navigation.Navigate('/game-hub/store'+(product?'/'+product[1]:''));
    return;
  }
  openGameHubWeb(STORE_URL + path,url=>Navigation.NavigateToSteamWeb(url));
}

export const byRecent=(a:App,b:App)=>lastPlayed(b)-lastPlayed(a);
export const byName=(a:App,b:App)=>a.display_name.localeCompare(b.display_name,undefined,{sensitivity:'base'});
export const recentApps=(limit:number)=>recentLibrary(window as any,limit);
export const gameApps=()=>readLibrary(window as any).entries.filter(a=>a.app_type!==2);
export const softwareApps=()=>readLibrary(window as any).entries.filter(a=>a.app_type===2);
export const favoriteApps=()=>readLibrary(window as any).favorites;
export const nonSteamApps=()=>readLibrary(window as any).entries.filter(a=>a.app_type===APP_TYPE_SHORTCUT);
export const installedApps=()=>readLibrary(window as any).entries.filter(isInstalled);
export const userCollections=()=>readLibrary(window as any).collections.map(c=>({...c,apps:()=>readLibrary(window as any).collections.find(x=>x.id===c.id)?.apps??[]}));

export {heroUrls,logoUrls,landscapeUrls,portraitUrls} from '../../library-art';

export function runningAppId(): number | undefined {
  try {
    const id=Number(Router.MainRunningApp?.appid);
    // Router keeps a launching app as MainRunningApp even without a game window.
    const overview=appStore.GetAppOverviewByAppID(id);
    return Number.isSafeInteger(id)&&id>0&&overview?.local_per_client_data?.display_status===4?id:undefined;
  } catch {
    return undefined;
  }
}

export function openGameHubDetails(app: App) {
  Navigation.Navigate('/game-hub/post-game/'+app.appid);
}

export const openDetails = openGameHubDetails;

interface LibraryMenuProps {
  overview: App;
  client: string;
  launchSource: number;
  bInGamepadUI: boolean;
  instance: unknown;
  navigator: unknown;
  additionalActions: ReturnType<typeof createElement>[];
}

let libraryMenu: ComponentType<LibraryMenuProps> | undefined;
export function openGameMenu(app: App, anchor?: EventTarget | null) {
  const instance = Router.WindowStore?.GamepadUIMainWindowInstance;
  const item = (label: string, action: () => void, disabled = false) =>
    createElement(MenuItem, {key: label, disabled, onSelected: action}, label);
  const actions: ReturnType<typeof createElement>[] = [
    createElement(MenuItem, {key: 'music', onSelected: () => openGameMusic(app.appid)},
      createElement('span', {className: 'gh-game-options-marker'}, createElement('style', null, gameOptionsCSS), 'Game Music')),
  ];
  let plugins: ReturnType<typeof pluginInventory> = [];
  try { plugins = pluginInventory(); } catch { /* Decky is still loading its inventory. */ }
  actions.push(item('Trailer settings',()=>Navigation.Navigate('/game-hub/trailers/'+app.appid)));
  if (plugins.length) actions.push(createElement(MenuGroup, {key: 'plugins', label: 'Plugins'},
    plugins.map(p => item(p.name, () => openDeckyPlugin(p.name, () => Navigation.OpenQuickAccessMenu(999)), p.disabled || !p.loaded))));
  // Render the same patched per-game menu that other Decky plugins extend.
  if (!libraryMenu) {
    const isLibraryMenu = (e: any) => typeof e?.prototype?.GetTargetApps === 'function' &&
      typeof e.prototype.BuildManageSubmenu === 'function';
    const scope = (window as any).DFL?.findModuleScopeByVar?.(isLibraryMenu) ?? findModuleByExport(isLibraryMenu);
    libraryMenu = Object.values(scope ?? {}).find(isLibraryMenu) as ComponentType<LibraryMenuProps> | undefined;
  }
  const menu = libraryMenu ? createElement(libraryMenu, {
    overview: app, client: 'mostavailable', launchSource: LAUNCH_SOURCE,
    bInGamepadUI: true, instance, navigator: (instance as any).Navigator, additionalActions: actions,
  }) : createElement(Menu, {label: app.display_name}, ...actions,
    item('Achievements', () => openAchievements(app)),
    item('Properties', () => ((instance as any).Navigator as any).AppProperties(app.appid)));
  showContextMenu(menu, anchor ?? undefined);
}

export function openAchievements(app: App) {
  Navigation.Navigate(`/game-hub/achievements/${app.appid}`);
}

export function openExternal(url: string) {
  Navigation.NavigateToExternalWeb(url);
}

/** X (A) on a tile: start the game like on the PS5; open its page when it can't start right away. */
export async function launch(app: App) {
  const current=appStore.GetAppOverviewByAppID(app.appid)??app;
  const action=gameAction(window as any,current);
  if (action.kind==='downloads'||action.kind==='install') {
    openGameHubDetails(app);
    return;
  }
  if (runningAppId() === app.appid) {
    openDetails(app);
    return;
  }
  try {
    if(app.app_type===APP_TYPE_SHORTCUT){
      stopSoundtrackForLaunch();
      await launchShortcutFromLibrary(window as any,Router as any,app.appid);
      return;
    }
    const game=gameById(app.appid);
    if(!game){openDetails(app);return;}
    await playGame(game);
  } catch (e) {
    console.error("[ps5-dashboard] RunGame failed", e);
    openDetails(app);
  }
}

export function persona(): { name: string; avatar?: string } {
  try {
    const p = friendStore.m_FriendsUIFriendStore.self.m_persona;
    return { name: p.m_strPlayerName ?? "", avatar: p.avatar_url_full ?? p.avatar_url_medium };
  } catch {
    return { name: "" };
  }
}

export function lastPlayedText(app: App): string {
  const last = lastPlayed(app);
  if (!last) return app.installed ? t.installed : t.notInstalled;
  const days = Math.floor((Date.now() / 1000 - last) / 86400);
  if (days <= 0) return t.playedToday;
  if (days === 1) return t.playedYesterday;
  if (days < 30) return t.playedDaysAgo(days);
  const months = Math.floor(days / 30);
  if (months < 12) return t.playedMonthsAgo(months);
  return t.playedOverAYear;
}

export function playtimeText(app: App, minutes=app.minutes_playtime_forever): string {
  const m = minutes ?? 0;
  if (m < 60) return m > 0 ? t.minutesPlayed(m) : "";
  return t.hoursPlayed(Math.round(m / 60));
}
