import {useFocusPresentation,focusMotionCSS} from './focus-motion';
import {useProfileState,useProfileRef,useProfileFocus,returningFromProfile} from './profile-return';
import {FindPlayers} from './FindPlayers';
import {findPlayersVariables,findPlayersCSS} from './find-players-style';
import {useTabNavigation} from './tab-navigation';
import {ambientVariables} from './ambient-style';
import {MiniProfile} from './MiniProfile';
import { useEffect, useState, type ComponentType, type ReactNode, type HTMLAttributes, type Ref } from 'react';

import { type Friend, type Snapshot, type SocialBridge } from './model';

import { type Settings } from './settings';

import {focusControl,useRoomNavigation,type KeyboardBridge} from './navigation';
import {useLayoutEffect,useRef} from 'react';
import {useFriendsFocus} from './friends-focus';
import {FriendActionMenu} from './FriendActionMenu';
import {PartyView} from './PartyView';
import {Messages} from './ChatPanel';

import { css } from './styles';



export type ButtonProps = {children:ReactNode;onClick:()=>void;className?:string;disabled?:boolean;'aria-pressed'?:boolean;'aria-label'?:string};

export type GroupProps = {children:ReactNode;className?:string;onBack?:()=>void;horizontal?:boolean};

export type InputProps = {value:string;onChange:(value:string)=>void;onConfirm?:()=>void;label:string;placeholder?:string;disabled?:boolean};

export type HistoryProps=HTMLAttributes<HTMLDivElement>&{historyRef:Ref<HTMLDivElement>};
export type Controls = {Message?:ComponentType<HTMLAttributes<HTMLDivElement>>;History?:ComponentType<HistoryProps>;Slider?:ComponentType<{label:string;value:number;max:number;onChange:(value:number)=>void}>;keyboard?:KeyboardBridge;Input:ComponentType<InputProps>;Button:ComponentType<ButtonProps>;Group:ComponentType<GroupProps>};

export type PreviewContent = {messages:{author:string;text:string;time:string;self?:boolean}[];members:Friend[]};

type Props = {bridge:SocialBridge;controls:Controls;settings:Settings;setSettings:(s:Settings)=>void;onBack:()=>void;preview?:PreviewContent;initialTab?:HubTab;entryRequest?:{tab:HubTab;serial:number;conversation?:string;friend?:string}};

export type HubTab = 'Friends' | 'Messages' | 'Party' | 'Search for Players' | 'Friend Requests' | 'Settings';
type Tab=HubTab;

function Avatar({friend}:{friend:Friend}) {

  const [failed,setFailed] = useState(false);

  useEffect(()=>setFailed(false),[friend.avatar]);

  return <span className="gbs-avatar" aria-hidden="true">{friend.avatar && !failed ? <img src={friend.avatar} alt="" onError={()=>setFailed(true)} referrerPolicy="no-referrer"/> : friend.name.slice(0,2).toUpperCase()}<span className="gbs-dot" data-state={friend.state}/></span>;

}

export function Panel({bridge,controls,settings,setSettings,onBack,preview,initialTab,entryRequest}:Props) {

  const {Button,Group}=controls;

  const [conversation,setConversation]=useProfileState<string>("Panel:[conversation,setConversation]");
  const [partyGroup,setPartyGroup]=useProfileState<string>("Panel:[partyGroup,setPartyGroup]");
 const [partyPlayers,setPartyPlayers]=useProfileState<string[]>("Panel:[partyPlayers,setPartyPlayers]",[]);
 const [menuFriend,setMenuFriend]=useProfileState<Friend>("Panel:[menuFriend,setMenuFriend]");
 const menuReturn=useProfileRef("Panel:menuReturn",{top:0});
 const [menuClosing,setMenuClosing]=useProfileState("Panel:[menuClosing,setMenuClosing]",false);
 const menuCloseTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 useEffect(()=>()=>clearTimeout(menuCloseTimer.current),[]);
 const closeMenu=()=>{if(menuCloseTimer.current)return;const id=menuFriend?.id;setMenuClosing(true);menuCloseTimer.current=setTimeout(()=>{menuCloseTimer.current=undefined;setMenuClosing(false);setMenuFriend(undefined);requestAnimationFrame(()=>{const list=friendsRoot.current?.querySelector<HTMLElement>('.gbs-list');const row=Array.from(list?.querySelectorAll<HTMLElement>('.gbs-friend')??[]).find(e=>e.querySelector<HTMLElement>('[data-friend-id]')?.dataset.friendId===id);focusControl(row);if(list)list.scrollTop=menuReturn.current.top;});},110);};
  const [threadOpen,setThreadOpen]=useProfileState("Panel:[threadOpen,setThreadOpen]",false);
  const childBack=useRef<(()=>void)|undefined>(undefined);
  const messageMemory=useProfileRef("Panel:messageMemory",{last:'',scroll:0,drafts:new Map<string,{text:string;pending:boolean;error:string}>()});

  const [tab,setTab] = useProfileState<Tab>("Panel:[tab,setTab]",initialTab??'Friends');
  const messageParent=useProfileRef<Tab>("Panel:messageParent",'Friends');
  const profileEntry=useRef(returningFromProfile());
  useEffect(()=>{if(profileEntry.current){profileEntry.current=false;return;}if(entryRequest){setTab(entryRequest.tab);setConversation(entryRequest.conversation);setThreadOpen(false);setMenuFriend(undefined);if(entryRequest.friend)setSelected(entryRequest.friend);}},[entryRequest]);

  const [snapshot,setSnapshot] = useProfileState<Snapshot>("Panel:[snapshot,setSnapshot]",{kind:'loading',friends:[],detail:'Loading friends…'});

  const [selected,setSelected] = useProfileState<string>("Panel:[selected,setSelected]");

  const [error,setError] = useProfileState("Panel:[error,setError]",'');

  const [refresh,setRefresh] = useProfileState("Panel:[refresh,setRefresh]",0);

  const [limit,setLimit] = useProfileState("Panel:[limit,setLimit]",40);

  const tabs:Tab[] = ['Friends',...(settings.messages?['Messages' as const]:[]),...(settings.party?['Party' as const]:[]),'Search for Players','Friend Requests','Settings'];

  const activeTab = tabs.includes(tab) ? tab : 'Friends';
  const friendsRoot=useFriendsFocus(activeTab==='Friends'&&settings.enabled,setSelected,controls.keyboard,id=>{const f=snapshot.friends.find(f=>f.id===id);if(f){menuReturn.current.top=friendsRoot.current?.querySelector('.gbs-list')?.scrollTop??0;setMenuFriend(f);}});

  useEffect(()=>{

    if(activeTab !== 'Friends')return;
    if (!settings.enabled || !settings.liveFriends) {setSnapshot({kind:'loading',friends:[],detail:''});return;}

    let active=true;

    const read=()=>{if (active) {try {setSnapshot(bridge.readFriends());} catch {setSnapshot({kind:'unavailable',friends:[],detail:'The Steam adapter could not read friends.'});}}};

    read();const timer=setInterval(read,5000);

    return ()=>{active=false;clearInterval(timer);};

  },[bridge,settings.enabled,settings.liveFriends,activeTab,refresh]);

  const friends=settings.liveFriends ? snapshot.friends : [];

  const friend=friends.find(f=>f.id===selected) ?? friends[0];

  const act=(fn:()=>void)=>{setError('');try {fn();} catch {setError('Steam navigation is unavailable. Open Friends & Chat from Steam’s own social menu.');}};

  const native=()=>act(()=>bridge.openNative());

  const back=()=>{if(menuFriend){closeMenu();return;}if((activeTab==='Messages'||activeTab==='Party')&&childBack.current){childBack.current();return;}if(activeTab!=='Friends')setTab('Friends');else onBack();};
  const root=useRoomNavigation(back,controls.keyboard);useProfileFocus(root,'panel-focus');useFocusPresentation(root);
  useLayoutEffect(()=>{if(activeTab==='Messages'||activeTab==='Party')return;const frame=requestAnimationFrame(()=>focusControl(root.current?.querySelector('.gbs-tab[aria-pressed="true"]')));return()=>cancelAnimationFrame(frame);},[activeTab]);
  useTabNavigation(root,activeTab,tabs,next=>{setConversation(undefined);setPartyGroup(undefined);setPartyPlayers([]);setTab(next);setError('');},!!menuFriend||menuClosing||threadOpen,controls.keyboard);


  const toggle=(key:keyof Settings)=>setSettings({...settings,[key]:!settings[key]});

  const settingsView=<div className="gbs-panel gbs-settings"><h2>Make yourself at home</h2>{([

    ['enabled','Enable Game Hub','Show this social panel.'],['friendsEntry','Open from Friends & Chat','Open Game Hub from Steam’s social menu entry.'],['liveFriends','Read Steam friends · experimental','Read loaded names, presence and avatars on this device.'],

    ['controlCenter','Control Center','Replace the main Big Picture menu. Native gameplay overlays remain available.'],['messages','Messages tab','Read and send Steam messages in Game Hub.'],['party','Party tab','Start and manage Steam voice calls.'],['motion','Quiet transitions','Respects your system’s reduced-motion preference.']

  ] as [keyof Settings,string,string][]).map(([key,label,hint])=><Button key={key} className="gbs-button gbs-setting" aria-pressed={settings[key]} onClick={()=>toggle(key)}><span>{label}<small>{hint}</small></span><span className="gbs-switch">{settings[key]?'ON':'OFF'}</span></Button>)}<p className="gbs-note">Only preferences are saved. Friends and messages are never saved by this plugin. Native voice, messaging and notifications remain under Steam’s control.</p></div>;

  return <div className="gbs-root gbs-room" style={{...ambientVariables,...findPlayersVariables}} data-discovery={activeTab==='Search for Players'||activeTab==='Friend Requests'} data-motion={settings.motion} data-ambient={settings.ambientLight} ref={root}>

    <style>{css}{findPlayersCSS}{focusMotionCSS}</style><div className="gbs-ambient" aria-hidden="true"/><div className="gbs-discovery-background" aria-hidden="true"/><Group className="gbs-shell">

      {!(activeTab==='Messages'&&threadOpen)&&<><header className="gbs-top"><div><h1>Game Hub</h1></div>{preview&&<span className="gbs-badge">DESIGN PREVIEW · FICTIONAL DATA</span>}</header>

      <Group className="gbs-tabs" horizontal>{tabs.map(t=><Button key={t} className="gbs-button gbs-tab" aria-pressed={t===activeTab} onClick={()=>{if(t==='Party'){setPartyGroup(undefined);setPartyPlayers([]);}setTab(t);setError('');}}>{t}</Button>)}<Button className="gbs-button gbs-tab" onClick={back}>Back</Button></Group></>}

      {error&&<p role="alert" className="gbs-error">{error}</p>}

      {!settings.enabled ? <div className="gbs-panel gbs-empty"><h2>Game Hub is off</h2><p>Your native Steam social experience is available as usual.</p><Button className="gbs-button gbs-primary" onClick={()=>toggle('enabled')}>Enable Game Hub</Button></div> : activeTab==='Settings' ? settingsView : activeTab==='Search for Players'||activeTab==='Friend Requests'?<FindPlayers main key={activeTab} bridge={bridge} controls={controls} initial={activeTab==='Search for Players'?'search':'incoming'} close={()=>setTab('Friends')} message={settings.messages&&bridge.messages?id=>{messageParent.current=activeTab;setConversation(bridge.messages!.friend(id));setTab('Messages');}:undefined}/>:activeTab==='Friends'?
      <div className="gbs-layout" ref={friendsRoot}><section className="gbs-panel" aria-label="Steam friends"><div className="gbs-panelhead"><span className="gbs-label">Friends {friends.length>0&&`· ${friends.length}`}</span><Button className="gbs-button" onClick={()=>setRefresh(v=>v+1)}>Refresh</Button></div>

      {!settings.liveFriends ? <div className="gbs-empty"><div className="gbs-symbol" aria-hidden="true">♧</div><h2>A place for your people</h2><p>Enable the experimental read-only connection to see friends loaded by Steam.</p><Button className="gbs-button gbs-primary" onClick={()=>toggle('liveFriends')}>Enable Steam friends</Button><p className="gbs-note">Names, status and avatars stay on this device.</p></div> : friends.length ? <Group className="gbs-list">{friends.slice(0,limit).map(f=><Button key={f.id} className="gbs-button gbs-friend" aria-pressed={f.id===friend?.id} onClick={()=>setSelected(f.id)}><Avatar friend={f}/><span className="gbs-person" data-friend-id={f.id}><strong>{f.name}</strong><small>{f.game || ({playing:'In game',online:'Online',away:'Away',offline:'Offline'}[f.state])}</small></span><span className="gbs-chevron" aria-hidden="true">›</span></Button>)}{friends.length>limit&&<Button className="gbs-button" onClick={()=>setLimit(n=>n+40)}>Show more friends</Button>}</Group> : <div className="gbs-empty" role="status"><h2>{snapshot.kind==='unavailable'?'Steam connection unavailable':'Waiting for your friends'}</h2><p>{snapshot.detail}</p><Button className="gbs-button" onClick={native}>Open native chat</Button></div>}</section>

      <section className="gbs-panel gbs-detail" aria-label="Selected friend">{friend&&<MiniProfile key={friend.id} id={friend.id} motion={settings.motion}/>} {friend ? <><Avatar friend={friend}/><h2>{friend.name}</h2><span className="gbs-badge">{friend.state==='playing'?'In game':friend.state}</span><p>{friend.game || 'Stay close, even between games.'}</p><Group className="gbs-actions" horizontal><Button className="gbs-button gbs-primary" onClick={()=>{if(bridge.messages&&settings.messages){try{messageParent.current='Friends';setConversation(bridge.messages.friend(friend.id));setTab('Messages');}catch{setError('Steam messaging is unavailable. Try again after Steam connects.');}}else native();}}>{bridge.messages&&settings.messages?'Message':'Open native chat'}</Button>{bridge.voice&&settings.party&&<Button className="gbs-button" onClick={()=>act(()=>{bridge.voice!.start(friend.id);setTab('Party');})}>Start voice chat</Button>}<Button className="gbs-button" onClick={()=>act(()=>bridge.openProfile(friend.id))}>View profile</Button></Group><p className="gbs-note">Send a message to {friend.name} or view their Steam profile.</p></> : <><div className="gbs-symbol" aria-hidden="true">◇</div><h2>Good games. Better company.</h2><p>Choose a friend to see their activity and open their Steam profile.</p><Button className="gbs-button" onClick={native}>Open native chat</Button></>}<p className="gbs-note" role="status">{settings.liveFriends&&snapshot.detail}</p></section></div>

      : activeTab==='Messages' ? <Messages onParty={id=>{setPartyGroup(id);setTab('Party');}} bridge={bridge} controls={controls} initial={conversation} native={native} memory={messageMemory.current} onThread={setThreadOpen} registerBack={fn=>{childBack.current=fn;}} onParent={()=>setTab(messageParent.current)} onInitialUsed={()=>setConversation(undefined)}/>

      : <PartyView initialPlayers={partyPlayers} initialGroup={partyGroup} onGroupMessage={id=>{messageParent.current='Party';setConversation(id);setTab('Messages');}} liveFriends={settings.liveFriends} bridge={bridge} controls={controls} registerBack={fn=>{childBack.current=fn;}} onParent={()=>setTab('Friends')} onMessage={id=>{if(!bridge.messages||!settings.messages)throw Error('Messages are disabled. Enable Messages in Game Hub settings.');messageParent.current='Party';setConversation(bridge.messages.friend(id));setTab('Messages');}}/>}

      {preview&&<footer className="gbs-foot">No Steam account connected</footer>}

    </Group>
    {menuFriend&&<FriendActionMenu closing={menuClosing} nativeMessage={!bridge.messages||!settings.messages} key={menuFriend.id} friend={snapshot.friends.find(f=>f.id===menuFriend.id)??menuFriend} available={snapshot.friends.some(f=>f.id===menuFriend.id)} bridge={bridge} controls={controls} close={closeMenu} message={()=>{if(bridge.messages&&settings.messages){const id=bridge.messages.friend(menuFriend.id);setMenuFriend(undefined);messageParent.current='Friends';setConversation(id);setTab('Messages');}else{if(!bridge.openFriendChat)throw Error('Native friend chat is unavailable. Open Steam Friends & Chat.');bridge.openFriendChat(menuFriend.id);}}} party={async()=>{if(!bridge.groups||!settings.party)throw Error('Enable Party in Game Hub settings.');const current=bridge.voice?.read();if(current?.groupId&&current.active){await bridge.groups.invite(current.groupId,[menuFriend.id]);return bridge.groups.operation().invitations[0]?.status||'Check invitation status in Party.';}if(current?.active)throw Error('Leave the current direct call before creating a group party.');setPartyPlayers([menuFriend.id]);setPartyGroup(undefined);setMenuFriend(undefined);setTab('Party');}}/>}
  </div>;

}



