import {T} from "./i18n";
import {useProfileState,useProfileRef,useProfileFocus,returningFromProfile} from './profile-return';
import {useMessageNavigation,type MessagePosition} from './message-navigation';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';

import {focusControl} from './navigation';
import type {Controls,HistoryProps} from './Panel';

import type {SocialBridge} from './model';

import type {Conversation,Inbox,MessageSession,MessagesBridge,Thread} from './messages';



function BrowserMessage(props:import('react').HTMLAttributes<HTMLDivElement>){return <div {...props}/>;}
function BrowserHistory({historyRef,...props}:HistoryProps){return <div {...props} ref={historyRef}/>;}

const time=(n:number)=>n?new Date(n*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'';

const date=(n:number)=>new Date(n*1000).toLocaleDateString([],{month:'long',day:'numeric'});

function ChatAvatar({item}:{item:{name:string;avatar?:string}}){return <span className="gbs-chat-avatar">{item.avatar?<img src={item.avatar} alt="" onError={e=>{e.currentTarget.style.display='none';}}/>:item.name.slice(0,2).toUpperCase()}</span>;}

export type Draft={history?:MessagePosition;text:string;pending:boolean;error:string};
type Memory={last:string;scroll:number;drafts:Map<string,Draft>;account?:string};
export function Messages({bridge,controls,initial,native,memory,onParty,onThread,registerBack,onParent,onInitialUsed}:{bridge:SocialBridge;controls:Controls;initial?:string;native:()=>void;memory:Memory;onParty?:(id:string)=>void;onThread:(open:boolean)=>void;registerBack:(fn:(()=>void)|undefined)=>void;onParent:()=>void;onInitialUsed:()=>void}) {

  const {Button,Group}=controls;

  const [inbox,setInbox]=useProfileState<Inbox>("ChatPanel:[inbox,setInbox]");const [error,setError]=useProfileState("ChatPanel:[error,setError]",'');const [selected,select]=useProfileState("ChatPanel:[selected,select]",initial);const [picking,setPicking]=useProfileState("ChatPanel:[picking,setPicking]",false);

  const account=useRef<string|undefined>(undefined);
  const list=useRef<HTMLDivElement>(null);
  const open=(id:string)=>{memory.last=id;memory.scroll=list.current?.querySelector('.gbs-conversation-list')?.scrollTop??0;select(id);};

  const [friends,setFriends]=useProfileState<ReturnType<SocialBridge['readFriends']>['friends']>("ChatPanel:[friends,setFriends]",[]);

  useEffect(()=>{

    if(!bridge.messages)return;

    const read=()=>{try{const next=bridge.messages!.inbox();if(memory.account&&memory.account!==next.account){select(undefined);setPicking(false);setFriends([]);memory.drafts.clear();memory.last='';memory.scroll=0;}account.current=next.account;memory.account=next.account;setInbox(next);setError('');}catch{setInbox(undefined);select(undefined);setError('Steam chat is unavailable. Check your connection.');}};

    read();const timer=setInterval(read,1000);return ()=>clearInterval(timer);

  },[bridge]);

  const chosen=inbox?.conversations.find(c=>c.id===selected);

  const close=()=>{if(selected)memory.last=selected;select(undefined);};
  useLayoutEffect(()=>{
    onThread(!!chosen);
    registerBack(chosen?close:picking?()=>setPicking(false):onParent);
    return()=>{registerBack(undefined);onThread(false);};
  },[!!chosen,picking]);
  useEffect(()=>{onInitialUsed();},[]);
  useLayoutEffect(()=>{
    if(chosen)return;
    const frame=requestAnimationFrame(()=>{
      const container=list.current?.querySelector<HTMLElement>('.gbs-conversation-list');
      const rows=container?.querySelectorAll<HTMLElement>('.gbs-conversation');
      const row=Array.from(rows??[]).find(e=>e.querySelector('[data-chat-id]')?.getAttribute('data-chat-id')===memory.last)??rows?.[0];
      focusControl(row??list.current?.querySelector('.gbs-new-message'));
      if(container)container.scrollTop=memory.scroll;
    });return()=>cancelAnimationFrame(frame);
  },[!!chosen,picking,!!inbox]);
  if(chosen&&inbox&&bridge.messages){
    const key=`${inbox.account}:${chosen.id}`;
    if(!memory.drafts.has(key))memory.drafts.set(key,{text:'',pending:false,error:''});
    return <div className="gbs-messages" data-open="true"><Group className="gbs-chat-focus"><ConversationView social={bridge} onParty={onParty} key={key} saved={memory.drafts.get(key)!} item={chosen} account={inbox.account} bridge={bridge.messages} controls={controls} onClose={close} native={native} profile={chosen.kind==='friend'?()=>bridge.openProfile(String(76561197960265728n+BigInt(chosen.id.split(':')[1]))):undefined}/></Group></div>;
  }

  return <div className="gbs-messages" data-picking={picking} ref={list} onScrollCapture={e=>{if((e.target as HTMLElement).classList.contains('gbs-conversation-list'))memory.scroll=(e.target as HTMLElement).scrollTop;}}><aside className="gbs-conversations" aria-label="Conversations">

    <Group className="gbs-conversation-actions" horizontal><Button className="gbs-button gbs-new-message" onClick={()=>{try{setFriends(bridge.readFriends().friends);setPicking(v=>!v);}catch{setError('Friends are unavailable.');}}}>{picking?'Recent messages':'+ New message'}</Button></Group>

    <div className="gbs-connection" role="status">{inbox?(inbox.account==='fictional-preview'?'Fictional preview':inbox.connected?'Connected to Steam':'Steam is offline'):error||'Connecting to Steam…'}</div>

    <Group className="gbs-conversation-list">{picking?friends.map(f=><Button className="gbs-button gbs-conversation" key={f.id} onClick={()=>{try{const id=bridge.messages?.friend(f.id);if(id){setInbox(bridge.messages!.inbox());open(id);setPicking(false);}}catch{setError('This friend is unavailable. Try again after Steam reconnects.');}}}><ChatAvatar item={f}/><span><strong>{f.name}</strong><small>{f.state==='playing'?'In game':f.state}</small></span></Button>):inbox?.conversations.map(c=><Button className="gbs-button gbs-conversation" key={c.id} onClick={()=>open(c.id)}><ChatAvatar item={c}/><span><strong data-chat-id={c.id}>{c.name}</strong><small>{c.subtitle}</small></span>{c.unread>0&&<span className="gbs-unread" aria-label={`${c.unread} unread`}>{c.unread>99?'99+':c.unread}</span>}</Button>)}</Group>

    {!picking&&inbox&&!inbox.conversations.length&&<p className="gbs-note">No recent conversations. Choose New message to talk to a friend.</p>}

    {picking&&!friends.length&&<p className="gbs-note">Waiting for Steam to load your friends.</p>}

    {error&&inbox&&<p className="gbs-error" role="alert">{error}</p>}

    </aside><section className="gbs-chat-welcome"><span className="gbs-message-outline" aria-hidden="true">▤</span><h2>Your messages</h2><p>Choose a conversation, or start a new message.</p>{!bridge.messages&&<><p>Steam messaging is unavailable in this host.</p><Button className="gbs-button" onClick={native}>Open native chat</Button></>}</section>

  </div>;

}

export function ConversationView({compact=false,presence,social,onParty,item,account,bridge,controls:{Button,Input,Group,keyboard,History=BrowserHistory,Message=BrowserMessage},saved,onClose,native,profile}:{compact?:boolean;presence?:string;social:SocialBridge;onParty?:(id:string)=>void;saved:Draft;item:Conversation;account:string;bridge:MessagesBridge;controls:Controls;onClose:()=>void;native:()=>void;profile?:()=>void}) {

  const [thread,setThread]=useState<Thread>();const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [draft,updateDraft]=useState(saved.text);const setDraft=(text:string)=>{saved.text=text;updateDraft(text);};const [sending,setSending]=useState(saved.pending);
  const composer=useRef<HTMLDivElement>(null);
  const restoreComposer=useRef<()=>void>(()=>{});
  const confirmAction=useRef<()=>void>(()=>{});
  const confirm=()=>{const input=composer.current?.querySelector<HTMLInputElement>('input');if(input)setDraft(input.value.slice(0,4000));keyboard?.hide();restoreComposer.current();};
  confirmAction.current=confirm;
  const sendAction=useRef<()=>void>(()=>{});
  useEffect(()=>{
    const el=composer.current;if(!el)return;
    let frame=requestAnimationFrame(()=>{if(!returningFromProfile()||!saved.history?.id)focusControl(el.querySelector('input'));});
    const restore=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>focusControl(el.querySelector('input')));};
    restoreComposer.current=restore;
    const unsubscribe=keyboard?.subscribe(open=>{if(!open)restore();});
    const handle=(e:Event)=>{
      const keyEvent=e as KeyboardEvent;
      if((e.type==='keydown'||e.type==='keyup')&&keyEvent.key==='Enter'&&(e.target as HTMLElement)?.closest('.gbs-text-field')){
        e.preventDefault();e.stopImmediatePropagation();
        if(e.type==='keydown'&&!keyEvent.repeat&&!keyEvent.isComposing){confirmAction.current();restore();}return;
      }
      if(e.type==='submit'){e.preventDefault();e.stopImmediatePropagation();return;}
      if(keyboard?.visible())return;
      const button=(e as CustomEvent).detail?.button;const key=(e as KeyboardEvent).key;
      const input=el.querySelector<HTMLInputElement>('input');const send=el.querySelector<HTMLElement>('.gbs-send');
      const inInput=!!input&&(e.target===input||!!(e.target as HTMLElement)?.closest?.('.gbs-text-field'));
      const inSend=!!(e.target as HTMLElement)?.closest?.('.gbs-send');
      const target=(button===12||key==='ArrowRight')&&inInput?send:(button===11||key==='ArrowLeft')&&inSend?input:undefined;
      if(target){e.preventDefault();e.stopImmediatePropagation();focusControl(target);}
      if(e.type==='vgp_onmenu'){e.preventDefault();e.stopImmediatePropagation();if(!(e as CustomEvent).detail?.is_repeat)sendAction.current();}
    };
    for(const name of ['vgp_ondirection','vgp_onmenu','keydown','keyup','submit'])el.addEventListener(name,handle,true);
    return()=>{restoreComposer.current=()=>{};unsubscribe?.();cancelAnimationFrame(frame);for(const name of ['vgp_ondirection','vgp_onmenu','keydown','keyup','submit'])el.removeEventListener(name,handle,true);};
  },[keyboard]);
  const initialSendFocus=useRef(true);
  useEffect(()=>{if(initialSendFocus.current&&returningFromProfile()&&saved.history?.id){if(thread?.canSend)initialSendFocus.current=false;return;}initialSendFocus.current=false;if(!sending&&thread?.canSend){const frame=requestAnimationFrame(()=>focusControl(composer.current?.querySelector('input')));return()=>cancelAnimationFrame(frame);}},[sending,thread?.canSend]);

  const loadingOlder=useRef(false);
  const session=useRef<MessageSession|undefined>(undefined);const alive=useRef(true);const busy=useRef(false);const scroll=useRef<HTMLDivElement>(null);const pinned=useRef(!saved.history);const prepend=useRef<{height:number;top:number}|undefined>(undefined);

  useEffect(()=>{

    alive.current=true;let cancelled=false;let current:MessageSession;let timer:ReturnType<typeof setInterval>|undefined;

    const read=()=>{if(cancelled)return;try{setThread(current.read());setSending(saved.pending);updateDraft(saved.text);if(saved.error)setError(saved.error);}catch{setThread(undefined);setError('This conversation is no longer available.');}};

    try{current=bridge.open(item.id,account);session.current=current;read();void current.load().then(()=>{if(!cancelled){read();setLoading(false);}},()=>{if(!cancelled){setLoading(false);setError('Could not load messages. Try again.');}});timer=setInterval(read,750);}catch{setLoading(false);setError('This conversation is unavailable.');}

    return ()=>{cancelled=true;alive.current=false;clearInterval(timer);current?.dispose();session.current=undefined;};

  },[bridge,item.id,account]);

  const root=useRef<HTMLElement>(null);
  const position=useRef(saved.history??{top:0});saved.history=position.current;
  useMessageNavigation(root,scroll,position.current,keyboard,()=>{pinned.current=false;});
  const restored=useRef(false);
  useLayoutEffect(()=>{if(restored.current||!thread?.messages.length||!scroll.current)return;restored.current=true;if(position.current.id){scroll.current.scrollTop=position.current.top;if(returningFromProfile()){const target=Array.from(scroll.current.querySelectorAll<HTMLElement>('[data-message-id]')).find(e=>e.dataset.messageId===position.current.id);focusControl(target);}}},[thread]);

  const signature=thread?.messages.map(m=>`${m.id}:${m.state}`).join('|');

  useLayoutEffect(()=>{const el=scroll.current;if(!el)return;if(prepend.current&&!loadingOlder.current){el.scrollTop=prepend.current.top+el.scrollHeight-prepend.current.height;prepend.current=undefined;}else if(!prepend.current&&pinned.current)el.scrollTop=el.scrollHeight;},[signature,loading]);

  const load=async(older=false)=>{if(loading||loadingOlder.current||!session.current)return;loadingOlder.current=true;setLoading(true);setError('');if(older&&scroll.current)prepend.current={height:scroll.current.scrollHeight,top:scroll.current.scrollTop};try{await session.current.load(older);if(alive.current)setThread(session.current.read());}catch{if(alive.current)setError('Could not load messages. Try again.');}finally{loadingOlder.current=false;if(alive.current)setLoading(false);}};

  const send=async()=>{if(busy.current||saved.pending||!draft.trim()||!session.current||!thread?.canSend)return;busy.current=true;saved.pending=true;saved.error='';setSending(true);setError('');const text=draft;try{await session.current.send(text);if(saved.text===text)saved.text='';if(alive.current){updateDraft(saved.text);pinned.current=true;setThread(session.current.read());}}catch(e){saved.error=e instanceof Error?e.message:'Message could not be delivered.';if(alive.current)setError(saved.error);}finally{busy.current=false;saved.pending=false;if(alive.current)setSending(false);}};

  sendAction.current=()=>void send();
  return <section ref={root} className="gbs-chat-thread" aria-label={`Messages with ${item.name}`}><header className="gbs-chat-title"><ChatAvatar item={item}/><div><h2>{item.name}</h2><small>{compact?(presence??item.subtitle):item.subtitle}</small></div></header>

    {compact?<Button className="gbs-button gq-chat-back" onClick={onClose}>← Back to Messages</Button>:<aside className="gbs-chat-sidebar">{item.kind==='group'&&social.groups&&<><Button className="gbs-button gbs-chat-action" onClick={()=>{const id=item.id.split(':')[1];void social.groups!.start(id).then(()=>onParty?.(id),e=>{if(alive.current)setError(e instanceof Error?e.message:'Steam could not start group voice.');});}}>Start Group Voice Chat</Button><Button className="gbs-button gbs-chat-action" onClick={()=>onParty?.(item.id.split(':')[1])}>Group Members &amp; Invites</Button><Button className="gbs-button gbs-chat-action" onClick={()=>onParty?.(item.id.split(':')[1])}>Open Party / Group Details</Button></>}{profile&&<Button className="gbs-button gbs-chat-action" onClick={()=>{try{profile();}catch{setError('Profile unavailable.');}}}><span aria-hidden="true">◎</span> <T text="View profile"/></Button>}<Button className="gbs-button gbs-chat-action" onClick={onClose}><span aria-hidden="true">←</span> All messages</Button><p className="gbs-note">{item.kind==='friend'?'Direct message':'Group conversation'} · Steam</p></aside>}

    <History className="gbs-chat-history" historyRef={scroll} tabIndex={-1} aria-label="Message history" onScroll={()=>{const e=scroll.current;if(e)pinned.current=!root.current?.ownerDocument.activeElement?.closest('[data-message-id]')&&e.scrollHeight-e.scrollTop-e.clientHeight<72;}}>

      {thread?.more&&<Button className="gbs-button gbs-history-more" disabled={loading} onClick={()=>void load(true)}>Earlier messages</Button>}

      {loading&&<p className="gbs-chat-status" role="status">Loading messages…</p>}

      {!loading&&!thread?.messages.length&&!error&&<p className="gbs-chat-status">Start the conversation.</p>}

      {thread?.messages.map((m,i)=>{const prev=thread.messages[i-1];return <div key={m.id}>{(!prev||date(prev.time)!==date(m.time))&&<div className="gbs-date-divider"><span>{date(m.time)}</span></div>}<article className="gbs-chat-message" data-self={m.self} data-system={m.state==='system'}><small>{m.self?'':m.author}</small><Message className="gbs-chat-bubble" tabIndex={0} data-message-id={m.id} aria-label={`${m.author}: ${m.text}`} >{m.text}</Message><time>{time(m.time)}{m.self&&m.state==='sending'?' · Sending…':m.state==='failed'?' · Not delivered':''}</time></article></div>;})}

    </History>

    <div className="gbs-chat-feedback" role="status">{thread?.typing?`${item.name} is typing…`:sending?'Sending…':''}</div>

    {error&&<div className="gbs-chat-error" role="alert">{error} {!sending&&<Button className="gbs-button" onClick={()=>void load()}>Reload</Button>}</div>}

    <div ref={composer} className="gbs-composer-host"><Group className="gbs-composer" horizontal><Input value={draft} onConfirm={confirm} label={`Message ${item.name}`} placeholder="Enter a message" disabled={sending||!thread?.canSend} onChange={v=>setDraft(v.slice(0,4000))}/><Button className="gbs-button gbs-send" disabled={sending||!draft.trim()||!thread?.canSend} onClick={()=>void send()}>{sending?'Sending…':<T text="Send"/>}</Button></Group></div>

  </section>;

}

