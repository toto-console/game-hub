import {type ReactNode,isValidElement} from 'react';
export type RegisteredPlugin={name:string;version?:string;content?:ReactNode;icon?:ReactNode;alwaysRender?:boolean;onDismount?:()=>void};
type Decky={plugins:RegisteredPlugin[];deckyState:{publicState():{installedPlugins:RegisteredPlugin[];disabledPlugins:RegisteredPlugin[];updates:Map<string,unknown>;activePlugin?:RegisteredPlugin};closeActivePlugin():void;setActivePlugin(name:string):void;eventBus?:EventTarget}};
export const decky=()=>(window as unknown as {DeckyPluginLoader?:Decky}).DeckyPluginLoader;
// Reviewed installed source: standalone subscribed settings stores and captured
// backend API closures; no QAM context or always-render lifecycle dependency.
export const reviewedVersions:Record<string,string>={'Glance Library':'1.0.0','Game Glance':'3.6.0','SteamGridDB':'1.8.1','PlayCount':'1.7'};
export function pluginInventory(){
 const d=decky();const s=d?.deckyState?.publicState();if(!d||!s||!Array.isArray(s.installedPlugins))throw Error('Decky installed-plugin inventory is unavailable.');
 return s.installedPlugins.map(p=>{const loaded=d.plugins.find(v=>v.name===p.name),disabled=s.disabledPlugins.some(v=>v.name===p.name);
  const compatible=!disabled&&!!loaded&&isValidElement(loaded.content)&&reviewedVersions[p.name]===p.version&&loaded.version===p.version&&!loaded.alwaysRender&&typeof loaded.onDismount==='function';
  const reason=disabled?'Disabled in Decky; enable it in the original menu first.':!loaded?'Not loaded by Decky.':!loaded.onDismount?'The loaded registration has no healthy lifecycle; it may be a Decky error view.':loaded.alwaysRender?'This version has an always-render lifecycle that has not been reviewed for a second host.':!compatible?'This plugin currently requires the original Decky interface. This version’s context, routes or lifecycle need further review.':'Experimental Embedded · source reviewed; live focus and persistence testing pending.';
  return {...p,loaded:!!loaded,disabled,update:s.updates?.has(p.name)??false,compatible,reason,content:loaded?.content};
 });
}
export type PluginEntry=ReturnType<typeof pluginInventory>[number];
export function beginPluginHost(entry:PluginEntry){const d=decky(),current=pluginInventory().find(p=>p.name===entry.name);if(!d||!current?.compatible||current.content!==entry.content||current.version!==entry.version)throw Error('Plugin compatibility changed. Reopen its details.');d.deckyState.closeActivePlugin();}
export function pluginStillCurrent(entry:PluginEntry){try{const d=decky(),p=pluginInventory().find(p=>p.name===entry.name);return !!p?.compatible&&p.content===entry.content&&p.version===entry.version&&!d?.deckyState.publicState().activePlugin;}catch{return false;}}
