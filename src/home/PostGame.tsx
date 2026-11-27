import {FriendsGlyph} from './HomeIcons';
import {classMap,Focusable,GamepadButton,Navigation,useParams} from '@decky/ui';
import {useEffect,useRef,useState} from 'react';
import {MdNotifications,MdSportsEsports,MdWifi,MdAlbum,MdCloudDownload} from 'react-icons/md';
import {readGameAchievements} from '../achievements';
import {GameAction} from '../GameAction';
import {controlCenterHeaders} from '../fullscreen';
import {footerSelector} from '../center-footer';
import {openGameHubWeb} from '../fullscreen-web';
import {focusControl} from '../navigation';
import {readSteamFriends} from '../model';
import {readDockPresence,FriendsOnlineCounter} from '../presence';
import {SystemMenu} from '../SystemMenu';
import {controlCenterCSS} from '../control-center-style';
import {welcomeServices} from './welcome-services';
import {readTray} from '../system-adapters';
import {HUB_ROUTE} from '../social-entry';
import {Art} from './upstream/components';
import {heroUrls,landscapeUrls,openAchievements,openGameMenu,persona,type App} from './upstream/steam';
import {postGameCSS} from './post-game-style';

export const POST_GAME_ROUTE='/game-hub/post-game/:appid';
const tabs=['Play','Multiplayer','Trophies','Store','Community','Media','Management'];

export function PostGameRoute(){
  const {appid}=useParams<{appid:string}>();
  const app=(window as any).appStore?.GetAppOverviewByAppID(Number(appid));
  return app?<PostGame key={appid} app={app}/>:<Focusable onActivate={()=>Navigation.NavigateBack()}>Game unavailable · Back</Focusable>;
}
function PostGame({app}:{app:App}){
  const [tab,setTab]=useState(0),[time,setTime]=useState(new Date());
  const [percent,setPercent]=useState<number>(),[friendCount,setFriends]=useState<number>(),[addons,setAddons]=useState<number>();
  const root=useRef<HTMLDivElement>(null),user=persona(),host=window as any;
  const shortcut=app.app_type===1073741824;
  useEffect(()=>{
    let live=true;
    readGameAchievements(window,app.appid,shortcut).then(r=>{if(live&&r.total&&r.done!==undefined)setPercent(Math.floor(100*r.done/r.total));});
    if(!shortcut) Promise.resolve().then(()=>host.SteamClient.Apps.GetFriendsWhoPlay(app.appid)).then(ids=>{if(live&&Array.isArray(ids))setFriends(new Set(ids).size);}).catch(()=>{});
    Promise.resolve().then(()=>host.appDetailsStore.RequestAppDetails?.(app.appid)).then(()=>{
      const dlc=host.appDetailsStore.GetAppDetails?.(app.appid)?.vecDLC;
      if(live&&Array.isArray(dlc))setAddons(dlc.length);
    }).catch(()=>{});
    const timer=setInterval(()=>setTime(new Date()),15000);
    const frame=requestAnimationFrame(()=>focusControl(root.current?.querySelector('.gh-primary-action .ghd-button')));
    return ()=>{live=false;clearInterval(timer);cancelAnimationFrame(frame);};
  },[app.appid]);
  useEffect(()=>{
    const el=root.current;
    if(!el)return;
    const selectors=['.gh-post-head-button','.gh-post-tab','.gh-post-action .Focusable','footer .Focusable'];
    const handle=(event:Event)=>{
      const key=(event as KeyboardEvent).key;
      const direction=event.type==='vgp_ondirection'?(event as CustomEvent).detail?.button:
        ({ArrowUp:9,ArrowDown:10,ArrowLeft:11,ArrowRight:12} as Record<string,number>)[key];
      if(![9,10,11,12].includes(direction)&&key!=='Tab')return;
      const target=event.target as HTMLElement;
      const rows=selectors.map(s=>Array.from(el.querySelectorAll<HTMLElement>(s))).filter(row=>row.length);
      const rowIndex=rows.findIndex(row=>row.some(n=>n.contains(target)));
      if(rowIndex<0)return;
      event.preventDefault();event.stopImmediatePropagation();
      const row=rows[rowIndex],index=row.findIndex(n=>n.contains(target));
      let next:HTMLElement;
      if(key==='Tab'){
        const all=rows.flat(),step=(event as KeyboardEvent).shiftKey?-1:1;
        next=all[(all.indexOf(row[index])+step+all.length)%all.length];
      }else if(direction===11||direction===12){
        next=row[Math.max(0,Math.min(row.length-1,index+(direction===11?-1:1)))];
      }else{
        const destination=rows[Math.max(0,Math.min(rows.length-1,rowIndex+(direction===9?-1:1)))];
        next=destination===row?row[index]:destination.find(n=>n.dataset.current==='true')??destination[Math.min(index,destination.length-1)];
      }
      focusControl(next,true);
    };
    el.addEventListener('keydown',handle,true);
    el.addEventListener('vgp_ondirection',handle,true);
    return ()=>{el.removeEventListener('keydown',handle,true);el.removeEventListener('vgp_ondirection',handle,true);};
  },[]);
  const [showNotices,setShowNotices]=useState(false);
  const services=welcomeServices();
  useEffect(()=>{
    if(!showNotices||!services)return;
    services.notifications.refresh();
    return services.notifications.start(()=>true);
  },[showNotices,services]);
  const closeNotices=()=>{setShowNotices(false);requestAnimationFrame(()=>focusControl(root.current?.querySelector('[aria-label="Notifications"]')));};
  const online=readDockPresence(host,readSteamFriends(host)).count;
  const web=(url:string)=>openGameHubWeb(url,u=>Navigation.NavigateToSteamWeb(u));
  const actions=[
    undefined,()=>Navigation.Navigate(HUB_ROUTE),()=>openAchievements(app),
    ()=>web('https://store.steampowered.com/app/'+app.appid),()=>web('https://steamcommunity.com/app/'+app.appid),
    ()=>Navigation.Navigate('/media/grid'),(el:HTMLElement)=>openGameMenu(app,el)
  ];
  const labels=['Start the game','Open friends','View trophies','Visit store','Open community','Open captures','Game options'];
  const unavailable=shortcut&&[3,4].includes(tab);
  const details=host.appDetailsStore?.GetAppDetails?.(app.appid);
  const minutes=details?.nPlaytimeForever ?? app.minutes_playtime_forever;
  const diskUsage=Number(details?.lDiskUsageBytes || app.size_on_disk);
  const bytes=diskUsage>0?diskUsage:undefined;
  const hide=[controlCenterHeaders(classMap).selector,footerSelector(classMap)].join(',').split(',').filter(Boolean).map(s=>'body:has(.gh-post-game) '+s+'{display:none!important}').join('');
  let notices:number|undefined;
  try{notices=readTray().filter(n=>n.unread).length;}catch{}
  const pads=Array.from(navigator.getGamepads?.()??[]).filter(Boolean);
  return <><Focusable inert={showNotices} ref={root} className="gh-post-game" onMenuButton={e=>{e.stopPropagation();e.preventDefault();openGameMenu(app,e.currentTarget);}} onButtonDown={e=>{
    const b=e.detail.button;
    if(b!==GamepadButton.BUMPER_LEFT&&b!==GamepadButton.BUMPER_RIGHT)return;
    e.preventDefault();e.stopPropagation();const next=(tab+(b===GamepadButton.BUMPER_LEFT?-1:1)+tabs.length)%tabs.length;
    setTab(next);focusControl(root.current?.querySelectorAll<HTMLElement>('.gh-post-tab')[next]);
  }} onCancel={e=>{e.preventDefault();e.stopPropagation();if(!e.detail.is_repeat)Navigation.NavigateBack()}}>
    <style>{postGameCSS}{hide}</style>
    <div className="gh-post-backdrop" aria-hidden="true"><Art className="gh-post-art" sources={[...heroUrls(app),...landscapeUrls(app)]}/></div>
    <header><span>{time.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false})} {navigator.onLine&&<MdWifi/>}</span>
      <span className="gh-post-pads">{pads.map(p=><span key={p!.index}><MdSportsEsports/>{p!.index+1}</span>)}</span>
      <div className="gh-post-head-actions">
        <Focusable className="gh-post-head-button" aria-label="Notifications" noFocusRing focusClassName="focused" onActivate={()=>setShowNotices(true)}><MdNotifications/>{notices??'—'}</Focusable>
        <Focusable className="gh-post-head-button" aria-label={online===undefined?'Friends':online+' friends online'} noFocusRing focusClassName="focused" onActivate={()=>Navigation.Navigate(HUB_ROUTE)}><FriendsGlyph/><FriendsOnlineCounter count={online}/></Focusable>
        <Focusable className="gh-post-head-button" aria-label="My profile" noFocusRing focusClassName="focused" onActivate={()=>web('https://steamcommunity.com/my/')}>{user.avatar&&<img src={user.avatar} alt=""/>}{user.name}</Focusable>
      </div></header>
    <main><section>
      <Focusable className="gh-post-tabs" flow-children="row"><small>L1</small>{tabs.map((name,i)=><Focusable key={name} className="gh-post-tab" focusClassName="focused" noFocusRing data-current={tab===i} onActivate={()=>setTab(i)}>{name}</Focusable>)}<small>R1</small></Focusable>
      <div className="gh-post-platform">{shortcut?'Non-Steam':'Steam'}</div><h1>{app.display_name}</h1>
      <dl>
        <div><dt>Played for</dt><dd>{minutes===undefined?'—':<>{Math.floor(minutes/60)}<small>H</small>{minutes%60}<small>M</small></>}</dd></div>
        <div><dt>Storage</dt><dd>{bytes===undefined?'—':<>{(bytes/1e9).toFixed(1)}<small>GB</small></>}</dd></div>
        <div><dt>Add-ons</dt><dd>{addons??'—'}</dd></div>
        <div><dt>Friends who play</dt><dd>{friendCount??'—'}</dd></div>
      </dl>
    </section><aside><div className="gh-post-progress"><strong>Trophy progress</strong><b>{percent===undefined?'—':percent+'%'}</b></div><div className="gh-post-track"><i style={{width:(percent??0)+'%'}}/></div>
      <div className="gh-post-action">{tab===0?<GameAction app={app} playLabel="Start the game"/>:unavailable?<span>Unavailable for this shortcut</span>:<Focusable noFocusRing focusClassName="focused" onActivate={e=>actions[tab]?.(e.currentTarget as HTMLElement)}>{labels[tab]}</Focusable>}<MdAlbum/></div>
    </aside></main><footer>{!shortcut&&<Focusable onActivate={()=>web('https://store.steampowered.com/account/remotestorageapp/?appid='+app.appid)}><MdCloudDownload/> Saves</Focusable>}<span>ⓧ Select</span><Focusable onActivate={()=>Navigation.NavigateBack()}>◯ Back</Focusable></footer>
  </Focusable>{showNotices&&services&&<div id="gh-game-notifications" role="dialog" aria-label="Notifications">
    <style>{controlCenterCSS.replaceAll('#game-hub-control-center','#gh-game-notifications')}</style>
    <SystemMenu kind="Notifications" controls={services.controls} notifications={services.notifications}
      close={closeNotices} native={services.actions.notifications} nativeDecky={services.actions.decky}
      nativePage={services.actions.deckyPage} integrationSettings={services.actions.notificationSettings}
      openNotice={n=>{if(n.requests)services.actions.hub('Friend Requests');else if(n.conversation)services.actions.hub('Messages',n.conversation);else if(n.friend)services.actions.hub('Friends',undefined,n.friend);else if(n.party)services.actions.hub('Party');}}/>
  </div>}</>;
}
