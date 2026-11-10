import {callable} from '@decky/api';
import {useEffect,useState} from 'react';
import {readSteamFriends,type Snapshot} from '../model';
import {loadStore,type StoreItem} from '../store-content';
import {loadCenterNews,type CenterNews} from '../center-news';
import {gameById,loadGame,type GameData} from '../game-adapter';
import {welcomeServices} from './welcome-services';
import type {App} from './upstream/steam';
import type {Inbox} from '../messages';
export type SystemData={storage?:{free:number;total:number;label:string};controllers?:Array<{index:number;wired:boolean;level?:string}>};
const readSystem=callable<[],SystemData>('welcome_system');
export function useWelcomeData(active:boolean,app?:App){
 const [social,setSocial]=useState<{friends:Snapshot;inbox?:Inbox;controllers:string[]}>({friends:{kind:'loading',friends:[],detail:''},controllers:[]});
 const [system,setSystem]=useState<SystemData>({}),[store,setStore]=useState<StoreItem[]>([]),[news,setNews]=useState<CenterNews[]>([]),[game,setGame]=useState<GameData>();
 const [refreshed,setRefreshed]=useState(0);
 useEffect(()=>{if(!active)return;let disposed=false,busy=false,contentTime=0,systemTime=0;
  const live=()=>{if(document.hidden)return;let friends:Snapshot={kind:'unavailable',friends:[],detail:'Reconnect to Steam'},inbox:Inbox|undefined;
   try{friends=welcomeServices()?.bridge.readFriends()??readSteamFriends(window);inbox=welcomeServices()?.bridge.messages?.inbox();}catch{}
   let controllers:string[]=[];try{controllers=Array.from(navigator.getGamepads?.()??[]).filter((p):p is Gamepad=>!!p&&p.connected).map(p=>p.id);}catch{}
   if(!disposed)setSocial({friends,inbox,controllers});
  };
  const refresh=async()=>{if(busy||document.hidden||Date.now()-systemTime<30_000)return;systemTime=Date.now();busy=true;try{const sys=await readSystem().catch(()=>({}));if(!disposed)setSystem(sys);
   if(Date.now()-contentTime>60_000){contentTime=Date.now();const g=app&&gameById(app.appid);const results=await Promise.allSettled([loadStore(),loadCenterNews(),g?loadGame(g):Promise.resolve(undefined)]);
    if(!disposed){if(results[0].status==='fulfilled')setStore(results[0].value);if(results[1].status==='fulfilled')setNews(results[1].value);if(results[2].status==='fulfilled')setGame(results[2].value);setRefreshed(Date.now());}
   }
  }finally{busy=false;}};
  live();void refresh();const timer=setInterval(()=>{live();void refresh();},3000);
  document.addEventListener('visibilitychange',live);
  return()=>{disposed=true;clearInterval(timer);document.removeEventListener('visibilitychange',live);};
 },[active,app?.appid]);
 return {...social,system,store,news,game,refreshed};
}
