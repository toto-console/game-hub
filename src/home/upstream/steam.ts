import {openGameHubWeb} from '../../fullscreen-web';
import {openGameMusic} from '../../GameMusicSettings';
import {stopSoundtrackForLaunch} from '../../themedeck-adapter';
import {Menu,MenuItem} from '@decky/ui';
import {playGame,gameById} from "../../game-adapter";
import {launchShortcutFromLibrary} from "../shortcut-launch";
import { Navigation, Router, findModuleByExport, showContextMenu } from "@decky/ui";
import { createElement } from "react";

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

export function openDetails(app: App) {
  Navigation.Navigate(`/library/app/${app.appid}`);
}

type AnyFn = (...args: any[]) => any;
/** Steam's game context menu: the component that renders it and its placement options. */
let gameMenu: { component: AnyFn; options?: AnyFn } | null | undefined;

function findGameMenu() {
  if (gameMenu !== undefined) return gameMenu;
  gameMenu = null;
  try {
    // The module that builds the library's game menu; the same one SteamGridDB hooks to add "Change artwork".
    const isOptions = (e: any) => typeof e === "function" && String(e).includes("().LibraryContextMenu");
    const mod = findModuleByExport(isOptions);
    const exports: any[] = mod ? Object.values(mod) : [];
    // The wrapper hands Steam's navigator to the menu class; it's what Steam itself renders.
    const component = exports.find((e) => typeof e === "function" && String(e).includes("navigator:"));
    if (component) gameMenu = { component, options: exports.find(isOptions) };
  } catch (e) {
    console.error("[ps5-dashboard] game menu not found", e);
  }
  return gameMenu;
}

/**
 * Opens Steam's own menu for a game (Play, Favorites, Manage, Properties...), with whatever other
 * plugins add to it, like SteamGridDB's "Change artwork". Falls back to the game's page.
 */
export function openGameMenu(app: App, anchor?: EventTarget | null) {
  showContextMenu(createElement(Menu,{label:app.display_name},createElement(MenuItem,{onSelected:()=>openGameMusic(app.appid)},"Game Music"),createElement(MenuItem,{onSelected:()=>openNativeGameMenu(app,anchor)},"Steam game options")),anchor??undefined);
}
function openNativeGameMenu(app: App, anchor?: EventTarget | null) {
  const menu = findGameMenu();
  if (menu) {
    try {
      const props = { overview: app, client: "mostavailable", launchSource: LAUNCH_SOURCE, bInGamepadUI: true };
      showContextMenu(createElement(menu.component, props), anchor ?? undefined, menu.options?.());
      return;
    } catch (e) {
      console.error("[ps5-dashboard] game menu failed", e);
    }
  }
  openDetails(app);
}

export function openAchievements(app: App) {
  Navigation.Navigate(`/library/app/${app.appid}/achievements/my/individual`);
}

export function openExternal(url: string) {
  Navigation.NavigateToExternalWeb(url);
}

/** X (A) on a tile: start the game like on the PS5; open its page when it can't start right away. */
export async function launch(app: App) {
  const playable = isInstalled(app) || app.app_type === APP_TYPE_SHORTCUT;
  if (!playable || runningAppId() === app.appid) {
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

export function playtimeText(app: App): string {
  const m = app.minutes_playtime_forever ?? 0;
  if (m < 60) return m > 0 ? t.minutesPlayed(m) : "";
  return t.hoursPlayed(Math.round(m / 60));
}
