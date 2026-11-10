import {safeAvatar} from './model';

export type Conversation = {id:string;name:string;avatar?:string;kind:'friend'|'group';subtitle:string;preview?:string;unread:number;time:number};
export type ChatMessage = {id:string;author:string;self:boolean;text:string;time:number;state:'sent'|'sending'|'failed'|'system'};
export type Inbox = {account:string;connected:boolean;conversations:Conversation[]};
export type Thread = {messages:ChatMessage[];more:boolean;typing:boolean;canSend:boolean};
export interface MessageSession {read():Thread;load(older?:boolean):Promise<void>;send(text:string):Promise<void>;dispose():void}
export interface MessagesBridge {inbox():Inbox;open(id:string,account:string):MessageSession;friend(id:string):string}

type Player = {accountid:number;is_ready?:boolean;is_friend?:boolean;is_blocked?:boolean;persona?:{m_strPlayerName?:string;avatar_url_medium?:string}};
type RawMessage = {unAccountID:number;rtTimestamp:number;unOrdinal:number;strMessage:string;eDeleteState:number;eErrorSending:number;UniqueKey():string|number;BHasServerAcknowledged():boolean;BIsServerMessage():boolean};
type QueueItem = {id:string;message:string;eError?:number};
type Chat = {accountid_partner?:number;chat_partner?:Player;name:string;unique_id:string;unread_message_count:number;time_last_message:number;chat_messages:RawMessage[];is_friend_typing?:boolean;is_blocked_friend?:boolean;m_bReceivedChatLogs:boolean;m_nLoadingHistoryInProgressCount:number;m_MessageSendQueue:{queued_messages:QueueItem[]};LoadChatLogs():Promise<void>;InternalLoadChatLogs(recent:boolean):Promise<void>;LoadMoreHistory():Promise<unknown>;IsMoreHistoryAvailable():boolean;SendChatMessage(text:string):Promise<void>;GetMember(id:number):Player|undefined};
type Group = {name:string;avatar_url_medium?:string;textRoomList:Chat[];GetGroupID():string;BIsCurrentUserAMember():boolean;BCanChat():boolean};
type App = {FriendStore:{self:Player;GetFriendIfCached(id:number):Player|undefined};ChatStore:{CMInterface:{logged_on:boolean};FriendChatStore:{GetAllChats():Chat[]};currentChatRoomGroups:Group[];GetFriendChat(id:number,create?:boolean):Chat|null;IncRefActiveChatRoomGroup(id:string,notify:boolean):number;DecRefActiveChatRoomGroup(id:string):number}};
const accountID=(v:unknown):v is number=>Number.isInteger(v)&&Number(v)>0&&Number(v)<=4294967295;
const unavailable=()=>new Error('Steam chat is unavailable. Reconnect to Steam and try again.');
const name=(p:Player|undefined)=>p?.is_ready&&p.persona?.m_strPlayerName?.slice(0,100);
const validChat=(c:Chat)=>c&&Array.isArray(c.chat_messages)&&typeof c.LoadChatLogs==='function'&&typeof c.SendChatMessage==='function'&&Array.isArray(c.m_MessageSendQueue?.queued_messages);
// Uses the existing signed-in Steam store. No tokens, raw RPCs or message persistence.
export function createMessagesBridge(host:unknown):MessagesBridge {
  const sending=new Set<string>();
  const app=():App=>{
    const a=(host as {g_FriendsUIApp?:App})?.g_FriendsUIApp;
    if(!a||!accountID(a.FriendStore?.self?.accountid)||typeof a.ChatStore?.FriendChatStore?.GetAllChats!=='function')throw unavailable();
    return a;
  };
  const entries=(a:App)=>{
    const out:{info:Conversation;chat:Chat;group?:Group}[]=[];
    for(const c of a.ChatStore.FriendChatStore.GetAllChats().slice(0,1000)) {
      if(!validChat(c)||!accountID(c.accountid_partner)||c.is_blocked_friend)continue;
      const p=c.chat_partner,n=name(p);
      if(!n)continue;
      out.push({chat:c,info:{id:`friend:${c.accountid_partner}`,name:n,avatar:safeAvatar(p?.persona?.avatar_url_medium),kind:'friend',subtitle:'Direct message',unread:Math.max(0,c.unread_message_count||0),time:c.time_last_message||0}});
    }
    for(const g of a.ChatStore.currentChatRoomGroups?.slice(0,200)??[]) {
      if(!g.BIsCurrentUserAMember())continue;
      for(const c of g.textRoomList?.slice(0,100)??[]) {
        if(!validChat(c))continue;
        out.push({chat:c,group:g,info:{id:`group:${g.GetGroupID()}:${c.unique_id}`,name:g.name.slice(0,100),avatar:safeAvatar(g.avatar_url_medium),kind:'group',subtitle:c.name||'Group message',unread:Math.max(0,c.unread_message_count||0),time:c.time_last_message||0}});
      }
    }
    return out.sort((a,b)=>b.info.time-a.info.time||a.info.name.localeCompare(b.info.name));
  };
  return {
    inbox(){const a=app();return {account:String(a.FriendStore.self.accountid),connected:a.ChatStore.CMInterface.logged_on===true,conversations:entries(a).map(e=>{const m=e.chat.chat_messages.at(-1);return {...e.info,preview:m&&!m.eDeleteState&&!m.BIsServerMessage()&&typeof m.strMessage==='string'?m.strMessage.slice(0,160):undefined};})};},
    friend(id){
      if(!/^7656119\d{10}$/.test(id))throw unavailable();
      const n=Number(BigInt(id)-76561197960265728n),a=app();
      if(!accountID(n)||!a.FriendStore.GetFriendIfCached(n)?.is_friend)throw unavailable();
      const c=a.ChatStore.GetFriendChat(n,true);if(!c||!validChat(c))throw unavailable();return `friend:${n}`;
    },
    open(id,account){
      const a=app(),e=entries(a).find(e=>e.info.id===id);
      if(String(a.FriendStore.self.accountid)!==account||!e)throw unavailable();
      const {chat:c,group:g}=e;let disposed=false;
      const check=()=>{if(disposed||app()!==a||String(a.FriendStore.self.accountid)!==account)throw unavailable();};
      const connected=()=>{check();if(a.ChatStore.CMInterface.logged_on!==true)throw unavailable();};
      const allowed=()=>!c.is_blocked_friend&&(g?g.BIsCurrentUserAMember()&&g.BCanChat():c.chat_partner?.is_friend===true&&!c.chat_partner.is_blocked);
      if(g)a.ChatStore.IncRefActiveChatRoomGroup(g.GetGroupID(),true);
      return {
        read(){check();return {more:c.IsMoreHistoryAvailable(),typing:c.is_friend_typing===true,canSend:a.ChatStore.CMInterface.logged_on===true&&allowed()&&!sending.has(id),messages:c.chat_messages.map((m,i)=>{
          const self=m.unAccountID===a.FriendStore.self.accountid;
          return {id:String(m.UniqueKey?.()??`${m.rtTimestamp}:${m.unOrdinal}:${i}`),author:self?'You':name(c.GetMember?.(m.unAccountID))||e.info.name,self,time:m.rtTimestamp||0,text:m.eDeleteState?'Message removed':m.BIsServerMessage()?'Steam chat event':typeof m.strMessage==='string'?m.strMessage.slice(0,13000):'Unsupported message',state:m.BIsServerMessage()?'system':m.eErrorSending?'failed':m.BHasServerAcknowledged()?'sent':'sending'};
        })};},
        async load(older=false){connected();if(older){await c.LoadMoreHistory();return;}await c.LoadChatLogs();if(!c.m_bReceivedChatLogs&&c.m_nLoadingHistoryInProgressCount===0)await c.InternalLoadChatLogs(false);check();},
        async send(text){
          connected();if(!allowed())throw new Error('You cannot send to this conversation.');
          if(!text.trim()||text.length>4000)throw new Error('Enter a message of up to 4,000 characters.');
          if(sending.has(id))throw new Error('A message is already being sent.');
          sending.add(id);
          try {
            const before=new Set(c.m_MessageSendQueue.queued_messages.map(q=>q.id));
            const pending=c.SendChatMessage(text);
            const queued=c.m_MessageSendQueue.queued_messages.find(q=>!before.has(q.id)&&q.message===text);
            await pending;
            // Steam's method resolves even on failure. Inspect its queue, not the promise alone.
            if(!queued)throw new Error('Delivery could not be confirmed. Check Steam before trying again.');
            if(c.m_MessageSendQueue.queued_messages.some(q=>q.id===queued.id))throw new Error('Steam could not deliver this message. Your draft is still here.');
          } finally {sending.delete(id);}
        },
        dispose(){if(disposed)return;disposed=true;if(g)a.ChatStore.DecRefActiveChatRoomGroup(g.GetGroupID());}
      };
    }
  };
}
