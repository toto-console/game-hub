import {sanitizeSettings,type WelcomeSettings} from './welcome-layout';
// Retain one wallpaper/settings snapshot across Home route remounts.
let cached:WelcomeSettings|undefined;
let pending:Promise<WelcomeSettings>|undefined;
let revision=0;
export const cachedWelcomeSettings=()=>cached;
export function rememberWelcomeSettings(value:WelcomeSettings){revision++;cached=sanitizeSettings(value);return cached;}
export function loadWelcomeSettings(load:()=>Promise<WelcomeSettings>):Promise<WelcomeSettings>{
 if(cached)return Promise.resolve(cached);
 if(pending)return pending;
 const started=revision;
 pending=load().then(value=>{if(started===revision)cached=sanitizeSettings(value);return cached!;}).finally(()=>{pending=undefined;});
 return pending;
}
