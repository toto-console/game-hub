export type Settings = { storeAppearance:boolean; storeBackgrounds:boolean; storeGloss:boolean; storeReducedMotion:boolean; storeSubtle:boolean; enabled: boolean; fullscreenWeb:boolean; groupAlerts:boolean; friendOnlineAlerts:boolean; friendGameAlerts:boolean; friendRequestAlerts:boolean; inviteAlerts:boolean; pluginAlerts:boolean; notificationToasts:boolean; notificationPreview:boolean; longToasts:boolean; ambientLight:boolean; glassBlur:boolean; quietPreviews:boolean; messageAlerts:boolean; voiceAlerts:boolean; controlCenter:boolean; friendsEntry: boolean; liveFriends: boolean; messages: boolean; party: boolean; motion: boolean };
export const defaults: Settings = {storeAppearance:true,storeBackgrounds:true,storeGloss:true,storeReducedMotion:false,storeSubtle:false,enabled:true,fullscreenWeb:true,groupAlerts:true,friendOnlineAlerts:true,friendGameAlerts:true,friendRequestAlerts:true,inviteAlerts:true,pluginAlerts:true,notificationToasts:false,notificationPreview:true,longToasts:false,ambientLight:true,glassBlur:true,quietPreviews:false,messageAlerts:true,voiceAlerts:true,controlCenter:true,friendsEntry:true,liveFriends:false,messages:true,party:true,motion:true};
export const SETTINGS_KEY = 'game-base-social.settings.v1';
export function loadSettings(storage?: Pick<Storage,'getItem'>): Settings {
  try {
    const raw: unknown = JSON.parse(storage?.getItem(SETTINGS_KEY) || '{}');
    const result = {...defaults};
    if (raw && typeof raw === 'object') for (const key of Object.keys(defaults) as (keyof Settings)[]) {
      const v = (raw as Record<string,unknown>)[key]; if (typeof v === 'boolean') result[key] = v;
    }
    return result;
  } catch {return {...defaults};}
}
export function saveSettings(settings: Settings, storage?: Pick<Storage,'setItem'>): boolean {
  try {if (!storage) return false; storage.setItem(SETTINGS_KEY,JSON.stringify(settings)); return true;} catch {return false;}
}
