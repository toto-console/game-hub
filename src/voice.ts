import {safeAvatar} from './model';

export type VoiceCapabilities = {calls:boolean;groups:boolean;participants:boolean;microphone:boolean;volume:boolean;localMute:boolean;speaking:boolean;output:boolean};
export type VoiceMember={id:number;steamid:string;name:string;avatar?:string;self:boolean;connected:boolean;speaking?:boolean;muted?:boolean;localMuted?:boolean;gain?:number};
export type VoiceRoom={id:string;group:string;name:string;count:number};
export type VoiceSnapshot={account:string;groupId?:string;state:'idle'|'joining'|'connected'|'leaving'|'disconnected'|'failed';active:boolean;title:string;members:VoiceMember[];rooms:VoiceRoom[];incoming:{id:number;name:string}[];capabilities:VoiceCapabilities;micMuted?:boolean;noMic?:boolean;denied?:boolean;output?:number;pushToTalk?:boolean;error?:string};
export interface SteamVoiceAdapter {read():VoiceSnapshot;subscribe(fn:()=>void):()=>void;start(steamid:string):void;join(id:string):void;accept(id:number):void;leave():void;mute(value:boolean):void;volume(id:number,value:number):void;localMute(id:number,value:boolean):void;output(value:number):void}
type Player={accountid:number;is_friend?:boolean;is_blocked?:boolean;persona?:{m_strPlayerName?:string;avatar_url_medium?:string;is_online?:boolean}};
type Room={name:string;GetRoomID():string;GetVoiceAllowed():boolean;voice_active_member_list?:{member_list:Player[]}};
type Group={name:string;GetGroupID():string;BIsCurrentUserAMember():boolean;voiceRoomList:Room[]};
type Voice={
 m_VoiceCallState:{m_eState:number;m_targetAccountID:number;m_chatRoom:{groupID:string;chatID:string}|null};
 audio_streams?:{accountid:number;type:number}[];
 InitiateFriendChat(id:number):void;InitiateRoomChat(group:string,room:string):void;OnUserEndVoiceChat():void;
 IsAnyVoiceActive():boolean;BIsAccountFullyConnectedToActiveVoiceChat(id:number):boolean;
 GetOneOnOneCallsWaitingForJoinOrAccept?():Map<number,unknown>;AcceptPartnersOneOnOneChatRequest?(id:number):boolean;
 IsMicMuted?():boolean;ToggleMicMuting?():void;BNoMicAvailableForSession?():boolean;GetUserDeniedMicAccess?():boolean;
 GetPerUserVoiceStatus?():Map<number,{mic_muted_locally:boolean}>;
 GetPerUserGainLevel?(id:number):number;SetPerUserGainLevel?(id:number,gain:number):void;
 GetPerUserMuting?(id:number):boolean;SetPerUserMuting?(id:number,mute:boolean):void;
 get_volume?(id:number):number;GetVoiceOutputGain?():number;SetVoiceOutputGain?(gain:number):void;GetPushToTalkEnabled?():boolean;
 RegisterForVoiceChatActiveStateChange?(fn:()=>void):{Unregister():void};
};
type App={VoiceStore:Voice;FriendStore:{self:Player;GetFriendIfCached(id:number):Player|undefined};ChatStore:{CMInterface:{logged_on:boolean};currentChatRoomGroups:Group[];GetActiveVoiceChannelName?():string;BIsEligibleForVoiceChat(p:Player):boolean}};
export function detectVoiceCapabilities(v:Voice):VoiceCapabilities {
 const has=(...names:(keyof Voice)[])=>names.every(n=>typeof v[n]==='function');
 return {calls:has('InitiateFriendChat','OnUserEndVoiceChat','IsAnyVoiceActive'),groups:has('InitiateRoomChat'),participants:has('BIsAccountFullyConnectedToActiveVoiceChat'),microphone:has('IsMicMuted','ToggleMicMuting'),volume:has('GetPerUserGainLevel','SetPerUserGainLevel'),localMute:has('GetPerUserMuting','SetPerUserMuting'),speaking:has('get_volume'),output:has('GetVoiceOutputGain','SetVoiceOutputGain')};
}
const id64=(id:number)=>String(76561197960265728n+BigInt(id));
const label=(p:Player|undefined)=>p?.persona?.m_strPlayerName?.slice(0,100)||'Steam player';
// Installed Steam client contracts, verified read-only on 2026-10-31. No transport or microphone capture is created here.
export function createSteamVoiceAdapter(host:unknown):SteamVoiceAdapter {
 let account='',lastActive=false,operation:'joining'|'leaving'|undefined,started=0,everConnected=false,failure='';
 const app=()=>{const a=(host as {g_FriendsUIApp?:App})?.g_FriendsUIApp;if(!a?.VoiceStore?.m_VoiceCallState||!a.FriendStore?.self?.accountid)throw Error('Steam voice is unavailable. Open native Steam voice and try again.');const next=String(a.FriendStore.self.accountid);if(next!==account){account=next;lastActive=false;operation=undefined;everConnected=false;failure='';}return a;};
 const rooms=(a:App)=>a.ChatStore.currentChatRoomGroups.filter(g=>g.BIsCurrentUserAMember()).flatMap(g=>(g.voiceRoomList??[]).filter(r=>r.GetVoiceAllowed()).map(r=>({g,r,id:`${g.GetGroupID()}:${r.GetRoomID()}`})));
 const available=()=>{const a=app();if(!a.ChatStore.CMInterface.logged_on)throw Error('Steam is offline. Reconnect before starting voice.');if(a.VoiceStore.IsAnyVoiceActive()||a.VoiceStore.m_VoiceCallState.m_eState!==0||operation)throw Error('Leave the current call before starting another one.');return a;};
 const begin=(fn:()=>void)=>{operation='joining';started=Date.now();failure='';everConnected=false;try{fn();}catch(e){operation=undefined;failure=e instanceof Error?e.message:'Steam could not start voice.';throw e;}};
 const active=()=>{const a=app();if(!a.VoiceStore.IsAnyVoiceActive())throw Error('There is no active Steam call.');return a;};
 const member=(id:number)=>{const a=active();if(id===a.FriendStore.self.accountid||!a.VoiceStore.BIsAccountFullyConnectedToActiveVoiceChat(id))throw Error('This participant is no longer connected.');return a.VoiceStore;};
 return {
  read(){
   const a=app(),v=a.VoiceStore,c=detectVoiceCapabilities(v),self=a.FriendStore.self,live=v.IsAnyVoiceActive(),connected=v.BIsAccountFullyConnectedToActiveVoiceChat(self.accountid),all=rooms(a),call=v.m_VoiceCallState;
   if(connected){everConnected=true;operation=undefined;failure='';}
   if(operation==='leaving'&&!live)operation=undefined;
   if(operation==='joining'&&Date.now()-started>30000&&!connected){operation=undefined;failure='Steam has not connected. Check the microphone and connection in native Steam voice.';}
   if(lastActive&&!live){if(!operation&&!failure&&!everConnected)failure='The call ended before connecting. Try again or open native Steam voice.';operation=undefined;}
   lastActive=live;
   const selected=all.find(e=>e.g.GetGroupID()===call.m_chatRoom?.groupID&&e.r.GetRoomID()===call.m_chatRoom?.chatID);
   const candidates=new Map<number,Player>();
   if(live){candidates.set(self.accountid,self);for(const p of selected?.r.voice_active_member_list?.member_list??[])candidates.set(p.accountid,p);for(const stream of v.audio_streams??[]){if(stream.type===2&&stream.accountid&&!candidates.has(stream.accountid))candidates.set(stream.accountid,a.FriendStore.GetFriendIfCached(stream.accountid)??{accountid:stream.accountid});}if(call.m_targetAccountID)candidates.set(call.m_targetAccountID,a.FriendStore.GetFriendIfCached(call.m_targetAccountID)??{accountid:call.m_targetAccountID});}
   const members=[...candidates.values()].filter(p=>v.BIsAccountFullyConnectedToActiveVoiceChat(p.accountid)).map(p=>({id:p.accountid,steamid:id64(p.accountid),name:label(p),avatar:safeAvatar(p.persona?.avatar_url_medium),self:p.accountid===self.accountid,connected:true,speaking:c.speaking?v.get_volume!(p.accountid)>0:undefined,muted:p.accountid===self.accountid?v.IsMicMuted?.():v.GetPerUserVoiceStatus?.().get(p.accountid)?.mic_muted_locally,localMuted:p.accountid===self.accountid?undefined:v.GetPerUserMuting?.(p.accountid),gain:p.accountid===self.accountid?undefined:v.GetPerUserGainLevel?.(p.accountid)}));
   return {account,groupId:call.m_chatRoom?.groupID,state:operation==='leaving'?'leaving':connected?'connected':failure?'failed':live||operation==='joining'?'joining':everConnected?'disconnected':'idle',active:live,title:selected?`${selected.g.name} · ${selected.r.name}`:a.ChatStore.GetActiveVoiceChannelName?.()||'Steam voice chat',members,rooms:all.map(({g,r,id})=>({id,group:g.name,name:r.name,count:r.voice_active_member_list?.member_list.length??0})),incoming:[...(v.GetOneOnOneCallsWaitingForJoinOrAccept?.().keys()??[])].filter(id=>a.FriendStore.GetFriendIfCached(id)?.is_friend).map(id=>({id,name:label(a.FriendStore.GetFriendIfCached(id))})),capabilities:c,micMuted:c.microphone?v.IsMicMuted!():undefined,noMic:live?v.BNoMicAvailableForSession?.():undefined,denied:v.GetUserDeniedMicAccess?.(),output:c.output?v.GetVoiceOutputGain!():undefined,pushToTalk:v.GetPushToTalkEnabled?.(),error:failure||undefined};
  },
  subscribe(fn){let v:Voice|undefined,unregister:(()=>void)|undefined;const tick=()=>{try{const next=app().VoiceStore;if(next!==v){unregister?.();v=next;const sub=v.RegisterForVoiceChatActiveStateChange?.(fn);unregister=()=>sub?.Unregister();}}catch{/* Reader exposes unavailable state. */}fn();};tick();const timer=setInterval(tick,300);return()=>{clearInterval(timer);unregister?.();};},
  start(steamid){if(!/^7656119\d{10}$/.test(steamid))throw Error('Invalid Steam friend.');const a=available(),id=Number(BigInt(steamid)-76561197960265728n),p=a.FriendStore.GetFriendIfCached(id);if(!p?.is_friend||p.is_blocked||!a.ChatStore.BIsEligibleForVoiceChat(p))throw Error('This friend is not available for Steam voice.');begin(()=>a.VoiceStore.InitiateFriendChat(id));},
  join(id){const a=available(),room=rooms(a).find(r=>r.id===id);if(!room)throw Error('This voice channel is no longer available.');begin(()=>a.VoiceStore.InitiateRoomChat(room.g.GetGroupID(),room.r.GetRoomID()));},
  accept(id){const a=available();if(!a.VoiceStore.GetOneOnOneCallsWaitingForJoinOrAccept?.().has(id))throw Error('This incoming call is no longer available.');begin(()=>{if(!a.VoiceStore.AcceptPartnersOneOnOneChatRequest?.(id))throw Error('Steam could not accept this call.');});},
  leave(){const a=active();if(operation==='leaving')return;operation='leaving';started=Date.now();failure='';try{a.VoiceStore.OnUserEndVoiceChat();}catch(e){operation=undefined;throw e;}},
  mute(value){const v=active().VoiceStore;if(typeof v.IsMicMuted!=='function'||typeof v.ToggleMicMuting!=='function')throw Error('Use native Steam microphone controls.');if(v.IsMicMuted()!==value)v.ToggleMicMuting();},
  volume(id,value){const v=member(id);if(!v.SetPerUserGainLevel||!Number.isFinite(value))throw Error('Participant volume is unavailable.');v.SetPerUserGainLevel(id,Math.max(0,Math.min(2,value)));},
  localMute(id,value){const v=member(id);if(!v.SetPerUserMuting)throw Error('Local mute is unavailable.');v.SetPerUserMuting(id,value);},
  output(value){const v=app().VoiceStore;if(!v.SetVoiceOutputGain||!Number.isFinite(value))throw Error('Voice volume is unavailable.');v.SetVoiceOutputGain(Math.max(0,Math.min(4,value)));}
 };
}
