import {useEffect,useRef,useState} from 'react';
import {openGameHubWeb} from '../fullscreen-web';
import {rememberHomeHub} from './home-hub-data';
import {Navigation,DialogButton,Focusable,ModalRoot,showModal} from '@decky/ui';
import {focusControl} from '../navigation';
import type {App} from './upstream/steam';
import {FriendsGlyph} from './HomeIcons';
import {readSteamFriends,type Friend} from '../model';
import {friendsPlaying} from './home-hub-data';

function usePlayers(appid:number,enabled:boolean){
 const [players,setPlayers]=useState<Friend[]>([]);
 const [empty,setEmpty]=useState('Loading friends…');
 useEffect(()=>{
  if(!enabled)return;
  let live=true,ids:Set<string>|undefined;
  const refresh=()=>{
   if(!live)return;
   const current=new Set(friendsPlaying(window,appid).friends.map(f=>f.id));
   const snapshot=readSteamFriends(window);
   const list=snapshot.kind==='ready'?snapshot.friends.filter(f=>current.has(f.id)||ids?.has(f.id)):[];
   const rank=(f:Friend)=>current.has(f.id)?0:f.state==='offline'?2:1;
   list.sort((a,b)=>rank(a)-rank(b));setPlayers(list);
   setEmpty(ids&&snapshot.kind==='ready'?'No friends who play this game':'Player information unavailable');
  };
  Promise.resolve().then(()=>(window as any).SteamClient.Apps.GetFriendsWhoPlay(appid))
   .then(result=>{if(Array.isArray(result))ids=new Set(result.map(String))}).catch(()=>{}).finally(refresh);
  const timer=setInterval(refresh,5000);return()=>{live=false;clearInterval(timer)};
 },[enabled,appid]);
 return {players,empty};
}
export function FriendsWhoPlay({appid,active}:{appid:number;active:boolean}){
 const title=useRef<HTMLSpanElement>(null);
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
  if(!title.current)return;
  const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting));
  observer.observe(title.current);return()=>observer.disconnect();
 },[]);
 const {players,empty}=usePlayers(appid,active||visible);
 return <><span ref={title} className="gh-summary-heading"><FriendsGlyph/>Friends who Play this Game
 <span className="gh-summary-count" title="Online friends who play"><i/>{players.filter(f=>f.state!=='offline').length}</span></span>
 <span className="gh-friends-faces">{players.slice(0,7).map(f=><span className="gh-friend-face" key={f.id} title={f.name}>
 {f.avatar?<img src={f.avatar} alt={f.name}/>:f.name.slice(0,1)}</span>)}{!players.length&&<small>{empty}</small>}</span></>;
}

export function openFriendsWhoPlay(app:App,anchor:HTMLElement|null,friendId?:string){
 const close=()=>{
  handle.Close();
  requestAnimationFrame(()=>{if(anchor?.isConnected)focusControl(anchor);});
 };
 const handle=showModal(<ModalRoot className="gh-friends-modal" bHideCloseIcon onCancel={close}>
  <GameFriendsList app={app} close={close} initialFriend={friendId} open={id=>{
   rememberHomeHub(app.appid,true,id);
   handle.Close();
   openGameHubWeb(`https://steamcommunity.com/profiles/${id}`,url=>Navigation.NavigateToSteamWeb(url));
  }}/>
 </ModalRoot>,anchor?.ownerDocument.defaultView??window,{bNeverPopOut:true,bHideActionIcons:true,strTitle:'Friends who play this game'});
}

function GameFriendsList({app,close,open,initialFriend}:{app:App;close:()=>void;open:(id:string)=>void;initialFriend?:string}){
 const {players,empty}=usePlayers(app.appid,true);
 const list=useRef<HTMLDivElement>(null),focused=useRef(false);
 useEffect(()=>{
  if(focused.current||!players.length)return;
  const row=list.current?.querySelector<HTMLElement>(`[data-friend-id="${initialFriend??players[0].id}"]`)??list.current?.querySelector<HTMLElement>('.gh-game-friend');
  if(row){focusControl(row);focused.current=true;}
 },[players,initialFriend]);
 return <section className="gh-game-friends" aria-label="Friends who play this game">
  <style>{`
   .gh-friends-modal,.gh-friends-modal .DialogContent_InnerWidth{background:transparent!important;box-shadow:none!important;border:0!important;padding:0!important;margin:0!important;min-width:0!important;width:auto!important}
   .gh-game-friends{box-sizing:border-box;width:min(29rem,83vw);margin-inline:auto;padding:1.4rem;color:white;background:linear-gradient(150deg,#202637,#10141d);border-radius:1rem}
   .gh-game-friends h2{margin:0;font-size:1.45rem;font-weight:500}.gh-game-friends p{color:#b8c1d0;margin:.4rem 0 1rem}
   .gh-game-friends-list{max-height:52vh;overflow-y:auto;overscroll-behavior:contain;padding:.25rem}
   .gh-game-friend{display:flex;align-items:center;gap:.85rem;padding:.6rem;border-radius:.55rem}
   .gh-game-friend:focus,.gh-game-friend.gpfocus{background:#ffffff1c;outline:2px solid white;outline-offset:-2px}
   .gh-game-friend-face{width:2.6rem;height:2.6rem;flex:none;border-radius:50%;overflow:hidden;background:#39465b;display:grid;place-items:center}
   .gh-game-friend-face img{width:100%;height:100%;object-fit:cover}.gh-game-friend small{display:block;color:#bec8d6}
  `}</style>
  <h2>Friends who play this game</h2><p>{app.display_name}</p>
  <Focusable ref={list} className="gh-game-friends-list" flow-children="column">
   {players.map(friend=><Focusable key={friend.id} role="button" data-friend-id={friend.id} onActivate={()=>open(friend.id)} tabIndex={0} focusClassName="gpfocus" className="gh-game-friend" onFocus={(e:any)=>e.currentTarget.scrollIntoView({block:'nearest'})}>
    <span className="gh-game-friend-face">{friend.avatar?<img src={friend.avatar} alt=""/>:friend.name.slice(0,1)}</span>
    <span>{friend.name}<small>{friend.game?'Playing '+friend.game:({online:'Online',offline:'Offline',away:'Away',playing:'In game'})[friend.state]}</small></span>
   </Focusable>)}
   {!players.length&&<p role="status">{empty}</p>}
  </Focusable>
  <DialogButton onClick={close}>Back</DialogButton>
 </section>;
}
