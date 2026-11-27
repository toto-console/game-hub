import {deliveredEvent,deliveredNotice,playhubActive,showHubPopup} from './playhub-notifications';
import type {SocialBridge,Friend} from './model';
import type {Settings} from './settings';
import {readTray,type TrayRow} from './system-adapters';
import {decky} from './decky-adapter';
export type HubNotice=TrayRow&{friend?:string;party?:boolean;local?:boolean;requests?:boolean};
export type NotificationSnapshot={rows:HubNotice[];status:string;toast?:HubNotice};
export function createNotificationStore(bridge:SocialBridge,getSettings:()=>Settings){
 let snapshot:NotificationSnapshot={rows:[],status:'Loading notifications…'},timer:ReturnType<typeof setInterval>|undefined;
 const activeChecks=new Set<()=>boolean>();
 const isActive=()=>Array.from(activeChecks).some(check=>{try{return check();}catch{return false;}});
 let baseline:Map<string,Friend>|undefined,initial=true,account='',toastUntil=0,lastToast=0;
 let toastTimer:ReturnType<typeof setTimeout>|undefined;
 const eventKey=(n:HubNotice)=>n.conversation?`${n.id}:${n.time}`:n.id;
 const history:HubNotice[]=[],seen=new Set<string>(),dismissed=new Set<string>(),listeners=new Set<()=>void>();
 const delivered=new Map<string,HubNotice>();
 let deliveredAccount='';
 const capture=(event:Event)=>{
  if(!getSettings().enabled)return;
  const n=deliveredNotice((event as CustomEvent).detail);
  if(!n)return;
  let inbox;try{inbox=bridge.messages?.inbox();}catch{return;}
  if(!inbox?.connected||!inbox.account)return;
  if(deliveredAccount!==inbox.account){delivered.clear();deliveredAccount=inbox.account;}
  delivered.set(n.id,n);
  if(delivered.size>120)delivered.delete(delivered.keys().next().value!);
  refresh();
 };
 window.addEventListener(deliveredEvent,capture);
 const publish=(next:NotificationSnapshot)=>{if(JSON.stringify(next)!==JSON.stringify(snapshot)){snapshot=next;listeners.forEach(f=>f());}};
 const refresh=()=>{
  const s=getSettings();if(!s.enabled||!isActive()){baseline=undefined;initial=true;if(toastTimer)clearTimeout(toastTimer);publish({...snapshot,toast:undefined});return;}
  const rows:HubNotice[]=[],issues:string[]=[],trayIds=new Set<string>();let inboxAccount='';
  try{const inbox=bridge.messages?.inbox();if(inbox?.connected){inboxAccount=inbox.account;if(account&&account!==inboxAccount){history.length=0;seen.clear();dismissed.clear();baseline=undefined;initial=true;toastUntil=0;lastToast=0;}account=inboxAccount;
   for(const c of inbox.conversations){if(!c.unread||!s.messages||!(c.kind==='group'?s.groupAlerts:s.messageAlerts))continue;rows.push({id:`chat:${c.id}`,conversation:c.id,title:c.name,detail:`${c.unread} unread ${c.unread===1?'message':'messages'}`,kind:c.kind==='group'?'Group message':'Message',source:'Steam conversations',time:c.time*1000,unread:true,avatar:c.avatar});}
  }else issues.push('Steam conversations unavailable');}catch{issues.push('Steam conversations unavailable');}
  try{for(const n of readTray()){
   trayIds.add(n.id);
   const existing=n.conversation?rows.find(r=>r.conversation===n.conversation):undefined;if(existing){existing.clear=n.clear;existing.avatar=n.avatar??existing.avatar;existing.artwork=n.artwork??existing.artwork;if(n.detail&&n.detail!=='Open conversation in Game Hub')existing.detail=n.detail;continue;}
   if(n.kind==='Message'&&(!s.messages||!s.messageAlerts)||n.kind==='Group message'&&(!s.messages||!s.groupAlerts)||n.kind==='Plugin alert'&&!s.pluginAlerts||n.kind==='Friend request'&&!s.friendRequestAlerts||n.kind==='Invitation'&&!s.inviteAlerts)continue;
   rows.push(n);
  }}catch{issues.push('Steam tray unavailable');}
  if(s.friendRequestAlerts&&bridge.friendManagement)try{const requests=bridge.friendManagement.requests().incoming;
   // Prefer canonical relationship rows over duplicate generic Steam request tray alerts.
   for(let i=rows.length-1;i>=0;i--)if(rows[i].kind==='Friend request')rows.splice(i,1);
   for(const p of requests)rows.push({id:'friend-request:'+bridge.friendManagement.account()+':'+p.id,title:p.name,avatar:p.avatar,kind:'Friend request',source:'Steam relationships',detail:'Incoming friend request · open to accept or ignore',time:0,requests:true});
  }catch{issues.push('Friend requests unavailable');}
  try{const v=bridge.voice?.read();if(s.party&&s.voiceAlerts)for(const call of v?.incoming??[])rows.push({id:`voice:${call.id}`,title:call.name,detail:'Incoming Steam voice request',kind:'Voice request',source:'Steam voice',time:0,unread:true,party:true});}catch{issues.push('Steam voice unavailable');}
  try{const updates=decky()?.deckyState.publicState().updates;if(s.pluginAlerts&&updates)for(const [name] of updates)rows.push({id:`update:${name}`,title:name,detail:'Update available in Decky',kind:'Plugin update',source:'Decky update state',time:0,plugin:name});}catch{issues.push('Decky updates unavailable');}
  if(s.liveFriends&&(s.friendOnlineAlerts||s.friendGameAlerts)&&inboxAccount){try{const friends=bridge.readFriends();if(friends.kind==='ready'){
   const current=new Map(friends.friends.map(f=>[f.id,{...f}]));if(baseline)for(const f of friends.friends){const before=baseline.get(f.id);if(!before)continue;const online=before.state==='offline'&&f.state!=='offline',playing=f.state==='playing'&&(before.state!=='playing'||f.game!==before.game);
    if(online&&s.friendOnlineAlerts||playing&&s.friendGameAlerts){const kind=playing&&s.friendGameAlerts?'Friend started playing':'Friend online';const last=history.find(n=>n.friend===f.id&&n.kind===kind);if(last&&Date.now()-last.time<60000)continue;history.unshift({id:`activity:${f.id}:${Date.now()}`,title:f.name,detail:kind==='Friend online'?'Now online':f.game?`Playing ${f.game}`:'Playing a game',source:'Game Hub · observed while active',kind,time:Date.now(),friend:f.id,avatar:f.avatar,unread:true,local:true});}
   }baseline=current;
  }else baseline=undefined;}catch{baseline=undefined;issues.push('Friend activity unavailable');}}else baseline=undefined;
  history.splice(60);if(inboxAccount)rows.push(...history.filter(n=>n.kind==='Friend online'?s.friendOnlineAlerts:s.friendGameAlerts));
  if(inboxAccount&&deliveredAccount!==inboxAccount){delivered.clear();deliveredAccount=inboxAccount;}
  if(inboxAccount)for(const n of delivered.values()){
   const existing=rows.find(r=>r.id===n.id||r.clear&&r.title===n.title&&Math.abs(r.time-n.time)<5000);
   if(existing){existing.artwork??=n.artwork;existing.avatar??=n.avatar;if(existing.kind==='Steam notification'){existing.kind=n.kind;existing.title=n.title;existing.detail=n.detail;}continue;}
   if(trayIds.has(n.id))continue;
   if(n.kind==='Message'&&(!s.messages||!s.messageAlerts)||n.kind==='Invitation'&&!s.inviteAlerts||n.kind==='Friend activity'&&!s.friendOnlineAlerts&&!s.friendGameAlerts)continue;
   rows.push(n);
  }
  const unique=[...new Map(rows.filter(n=>!dismissed.has(eventKey(n))).map(n=>[n.id,n])).values()].sort((a,b)=>b.time-a.time).slice(0,120);
  const fresh=unique.filter(n=>!seen.has(eventKey(n)));for(const n of unique)seen.add(eventKey(n));if(seen.size>600){const keep=[...seen].slice(-300);seen.clear();keep.forEach(id=>seen.add(id));}
  let toast=snapshot.toast;if(!s.notificationToasts||s.quietPreviews||Date.now()>=toastUntil)toast=undefined;
  if(!initial&&s.notificationToasts&&!s.quietPreviews&&fresh.length&&Date.now()-lastToast>10000){const candidate=fresh[0];toast=candidate;
   if(playhubActive()){
    // Playhub already displays Steam events. Send only Game Hub's own alerts.
    toast=undefined;
    if(candidate.source==='Decky update state'||candidate.source==='Steam voice'){
     const owner=account;
     void showHubPopup(candidate,s.notificationPreview).catch(()=>false).then(ok=>{
      const prefs=getSettings();
      if(!ok&&account===owner&&activeChecks.size&&isActive()&&prefs.enabled&&prefs.notificationToasts&&!prefs.quietPreviews&&Date.now()<toastUntil)publish({...snapshot,toast:candidate});
     });
    }
   }
   lastToast=Date.now();toastUntil=lastToast+(s.longToasts?8000:4000);if(toastTimer)clearTimeout(toastTimer);toastTimer=setTimeout(()=>publish({...snapshot,toast:undefined}),s.longToasts?8000:4000);}
  initial=false;publish({rows:unique,toast,status:issues.length?`Partial data · ${issues.join(' · ')}. Full Steam history is not exposed.`:'Connected sources · Steam tray, conversations and locally observed activity; not complete Steam history.'});
 };
 return {subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};},getSnapshot:()=>snapshot,
  start(checkActive:()=>boolean){activeChecks.add(checkActive);if(!timer){refresh();timer=setInterval(refresh,3000);}return()=>{activeChecks.delete(checkActive);if(activeChecks.size)return;if(timer)clearInterval(timer);if(toastTimer)clearTimeout(toastTimer);timer=undefined;baseline=undefined;};},refresh,
  dismiss(id:string){const row=snapshot.rows.find(n=>n.id===id);if(!row)return;dismissed.add(eventKey(row));if(snapshot.toast?.id===id)publish({...snapshot,toast:undefined});if(dismissed.size>300)dismissed.delete(dismissed.values().next().value!);refresh();},
  clearLocal(){history.length=0;if(snapshot.toast?.local)publish({...snapshot,toast:undefined});refresh();},dispose(){window.removeEventListener(deliveredEvent,capture);delivered.clear();if(timer)clearInterval(timer);if(toastTimer)clearTimeout(toastTimer);activeChecks.clear();timer=undefined;history.length=0;seen.clear();dismissed.clear();listeners.clear();}
 };
}
export type NotificationStore=ReturnType<typeof createNotificationStore>;
