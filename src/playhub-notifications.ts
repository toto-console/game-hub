import {showLinuxPopup} from './linux-popup';
import {safeNoticeArtwork} from './system-adapters';
import type {HubNotice} from './notification-store';

const names:Record<string,string>={achievement:'Achievement',message:'Message',invite:'Invitation',friend:'Friend activity',download:'Download',screenshot:'Screenshot',controller:'Controller',warning:'Warning',system:'Steam notification',community:'Community'};
export const deliveredEvent='game-hub:playhub-notice';
export function deliveredNotice(value:unknown):HubNotice|undefined{
 if(!value||typeof value!=='object')return;
 const p=value as Record<string,unknown>;
 if(typeof p.kind!=='string'||!Object.hasOwn(names,p.kind)||typeof p.title!=='string'||!p.title.trim())return;
 const time=Date.now(),title=p.title.slice(0,140),detail=typeof p.body==='string'?p.body.slice(0,320):'';
 const steamId=typeof p.id==='string'&&/^[\w:-]{1,100}$/.test(p.id)?p.id:'';
 const image=safeNoticeArtwork(p.image);
 return {id:steamId?'tray:'+steamId:'playhub:'+time+':'+title,title,detail,kind:names[p.kind],source:'Playhub Notifications',time,unread:true,avatar:['friend','message','invite'].includes(p.kind)?image:undefined,artwork:image};
}
export function playhubActive(){
 return Boolean((window as any).__playhubNotificationsHookOwner?.handlesSteamToasts?.());
}
export async function showHubPopup(row:HubNotice,preview:boolean){
 const kind=row.party?'invite':row.friend?'friend':'system';
 const payload={
  kind,title:preview?row.title:row.kind,body:preview?row.detail:'',subtitle:'Game Hub',image:preview?safeNoticeArtwork(row.avatar??row.artwork):undefined,steam_notification_id:'gamehub:'+row.id
 };
 if (/Linux/i.test(navigator.platform)) {
  return showLinuxPopup(payload).ok;
 }
 const result=await (window as any).DeckyBackend.call('loader/call_plugin_method','Game Base Social','emit_ps5_notification',payload);
 return Boolean(result?.ok);
}
