import {safeAvatar} from './model';
export type TrayRow={id:string;title:string;detail:string;source:string;kind:string;time:number;unread?:boolean;conversation?:string;avatar?:string;plugin?:string;clear?:()=>void};
type Notice={notificationID?:string;nNotificationID?:string;rtCreated:number;bNewIndicator?:boolean;eType:number;decky?:boolean;data?:Record<string,unknown>};
type Group={notifications:Notice[]};
type Store={GetNotificationsInTray():[Group[],unknown];RemoveGroupFromTray?(g:Group):void};
const text=(v:unknown):string=>{if(typeof v==='string')return v.slice(0,240);if(typeof v==='number')return String(v);if(Array.isArray(v))return v.map(text).join('');if(v&&typeof v==='object'&&'props' in v){const p=(v as {props:{children?:unknown}}).props;return text(p?.children);}return '';};
export function readTray():TrayRow[]{
 const host=window as unknown as {NotificationStore?:Store;DeckyPluginLoader?:{toaster?:{__steamcordSafe?:number}};friendStore?:{GetFriendState(id:unknown):{m_persona?:{m_strPlayerName?:string;avatar_url_medium?:string}}};g_FriendsUIApp?:{FriendStore:{GetFriendIfCached(id:number):{is_friend?:boolean;persona?:{m_strPlayerName?:string;avatar_url_medium?:string}}}}};
 const store=host.NotificationStore;if(!store?.GetNotificationsInTray)throw Error('Steam tray unavailable');const groups=store.GetNotificationsInTray()[0];if(!Array.isArray(groups))throw Error('Steam tray format unavailable');
 return groups.flatMap((group,gi)=>group.notifications.map((n,ni)=>{
  const field=(key:string)=>{try{const v=n.data?.[key];return typeof v==='function'?v.call(n.data):v;}catch{return undefined;}};
  const sender=String(field('steamid_sender')??''),offset=/^\d{17}$/.test(sender)?BigInt(sender)-76561197960265728n:0n,account=offset>0n&&offset<=0xffffffffn?Number(offset):0;
  const synthetic=host.DeckyPluginLoader?.toaster?.__steamcordSafe===2&&account>=0xde000000&&account<=0xde0fffff;
  const friend=account&&!synthetic?host.g_FriendsUIApp?.FriendStore.GetFriendIfCached(account):undefined;
  let persona=friend?.persona;if(synthetic){try{persona=host.friendStore?.GetFriendState({GetAccountID:()=>account,ConvertTo64BitString:()=>sender,BIsValid:()=>true})?.m_persona;}catch{}}
  const g=String(field('chat_group_id')??''),c=String(field('chat_id')??''),cls=String(field('getClassName')??'');
  const conversation=!synthetic&&/GroupChatMessage/.test(cls)&&/^[1-9]\d*$/.test(g)&&/^[1-9]\d*$/.test(c)?`group:${g}:${c}`:!synthetic&&/FriendChatMessage/.test(cls)&&friend?.is_friend?`friend:${account}`:undefined;
  const source=n.decky?'Decky':synthetic?'Plugin alert via Steamcord':'Steam';
  const kind=n.decky||synthetic?'Plugin alert':conversation?.startsWith('group:')?'Group message':conversation?'Message':/FriendRequest/.test(cls)?'Friend request':/Invite/.test(cls)?'Invitation':/Achievement/.test(cls)?'Achievement':`Steam alert · type ${n.eType}`;
  const title=text(field('title'))||persona?.m_strPlayerName||kind;
  // Never collect Steam private message bodies; synthetic plugin alerts have no
  // real Steam conversation. Original plugin text is displayed only in memory.
  const detail=n.decky||synthetic?text(field('body'))||'No further text exposed by the plugin':conversation?'Open conversation in Game Hub':'No supported in-Game-Hub action exposed for this entry';
  const id=String(n.notificationID??n.nNotificationID??`${n.eType}:${n.rtCreated}:${gi}:${ni}`);
  const time=n.rtCreated>1e12?n.rtCreated:Math.max(0,n.rtCreated)*1000;
  return {id:`tray:${id}`,title,detail,source,kind,time,unread:n.bNewIndicator,conversation,avatar:safeAvatar(persona?.avatar_url_medium),
   clear:typeof store.RemoveGroupFromTray==='function'?()=>{const current=store.GetNotificationsInTray()[0].find(v=>v===group||(n.notificationID??n.nNotificationID)!=null&&v.notifications.some(x=>String(x.notificationID??x.nNotificationID)===id));if(!current)return;store.RemoveGroupFromTray!(current);if(store.GetNotificationsInTray()[0].includes(current))throw Error('Steam did not remove this tray group.');}:undefined};
 }));
}
export function openDeckyPlugin(name:string,native:()=>void){const loader=(window as unknown as {DeckyPluginLoader?:{plugins:{name:string}[];deckyState:{setActivePlugin(name:string):void}}}).DeckyPluginLoader;if(!loader?.plugins.some(p=>p.name===name))throw Error('This plugin is not loaded. Use original Decky.');loader.deckyState.setActivePlugin(name);native();}
