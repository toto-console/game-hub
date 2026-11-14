import type {LibraryApp as App} from './library-data';
const APP_TYPE_SHORTCUT=1073741824;
const CDN='https://shared.steamstatic.com/store_item_assets/steam/apps';
declare const appStore:any;
function custom(fn: string, app: App): string[] {
  try {
    const urls = appStore[fn]?.(app);
    return Array.isArray(urls) ? urls : typeof urls === "string" && urls ? [urls] : [];
  } catch {
    return [];
  }
}

function steamAsset(app: App, file: string): string[] {
  if (app.app_type === APP_TYPE_SHORTCUT) return [];
  return [`/assets/${app.appid}/${file}`, `${CDN}/${app.appid}/${file}`];
}

export const heroUrls = (app: App) => [...custom("GetCustomHeroImageURLs", app), ...steamAsset(app, "library_hero.jpg")];
export const logoUrls = (app: App) => [...custom("GetCustomLogoImageURLs", app), ...steamAsset(app, "logo.png")];
export const landscapeUrls = (app: App) => [
  ...custom("GetCustomLandcapeImageURLs", app),
  ...steamAsset(app, "header.jpg"),
];
export const portraitUrls = (app: App) => [
  ...custom("GetCustomVerticalCapsuleURLs", app),
  ...custom("GetCachedVerticalCapsuleURL", app),
  ...steamAsset(app, "library_600x900.jpg"),
];


/** Use Steam's authenticated artwork URLs; never derive filesystem names from a shortcut ID. */
export function switcherArtworkUrls(app:App):string[]{
 const icon=custom('GetIconURLForApp',app);
 const portrait=portraitUrls(app),landscape=landscapeUrls(app);
 return [...new Set((app.app_type===APP_TYPE_SHORTCUT?[...portrait,...landscape,...icon]:[...icon,...portrait,...landscape]).filter((url):url is string=>typeof url==='string'&&!!url.trim()))];
}
