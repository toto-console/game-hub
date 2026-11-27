import platinumArt from '../../store-theme/assets/completion-trophy.png';
import {useEffect,useId,useState} from 'react';
import {MdSportsEsports} from 'react-icons/md';
import {callable} from '@decky/api';
import {useAchievements} from './upstream/gameinfo';
import type {App} from './upstream/steam';
import type {SystemData} from './welcome-data';

const tiers=['Platinum','Gold','Silver','Bronze'];
function TrophyArt({tier}:{tier:number}){
 const id=useId();
 if(tier===0)return <img className="gh-summary-trophy-art" alt="" draggable={false} src={platinumArt}/>;
 const [shade,metal,shine]=[['#866022','#e5b246','#fff0b0'],['#515965','#b9c1cb','#f6fbff'],['#633d32','#bf8066','#f4cbad']][tier-1];
 const fill=`url(#${id})`;
 return <svg aria-hidden="true" className="gh-summary-trophy-art" viewBox="0 0 64 76">
 <defs><linearGradient id={id}><stop stopColor={shade}/><stop offset=".24" stopColor={shine}/><stop offset=".53" stopColor={metal}/><stop offset=".81" stopColor={shade}/><stop offset="1" stopColor={metal}/></linearGradient></defs>
 <path d="M15 11H5c-1 12 3 22 15 27m29-27h10c1 12-3 22-15 27" fill="none" stroke={fill} strokeWidth="4" strokeLinejoin="round"/>
 <path d="M12 7Q32 4 52 7l-2 17c-1 11-7 19-15 23-2 8 1 14 6 18l5 2v4H18v-4l5-2c5-4 8-10 6-18-8-4-14-12-15-23Z" fill={fill} stroke={shade} strokeWidth="1.1"/>
 <path d="M14 8q18-2 36 0M20 68h24" fill="none" stroke={shine} strokeWidth="1.3"/>
 <g stroke={shade} strokeWidth="1.5" fill="none"><path d="M22 14h7v7h-7zM38 14l4 7h-8zM22 25l7 7m0-7-7 7"/><circle cx="38" cy="28.5" r="3.7"/></g>
 </svg>;
}
export function HomeTrophies({app}:{app:App}){
 const result=useAchievements(app);
 const stats=result.state==='done'?result.value:null;
 return <><span className="gh-summary-heading"><TrophyArt tier={0}/>Trophies
 <span className="gh-summary-count">Total: {stats?stats.medals.reduce((a,b)=>a+b,0):'—'}</span></span>
 <span className="gh-summary-medals">{tiers.map((name,i)=><span key={name} title={name} aria-label={name+' trophies: '+(stats?.medals[i]??'unavailable')}><TrophyArt tier={i}/>{stats?.medals[i]??'—'}</span>)}</span></>;
}

const system=callable<[],SystemData>('welcome_system');
let cached:SystemData|undefined,at=0,pending:Promise<SystemData>|undefined;
function devices(){
 if(cached&&Date.now()-at<15000)return Promise.resolve(cached);
 return pending??=system().then(value=>{at=Date.now();cached=value;return value}).finally(()=>{pending=undefined});
}
export function HomeController(){
 const [device,setDevice]=useState(cached?.controllers?.[0]);
 const [pad,setPad]=useState(false);
 useEffect(()=>{let live=true;const refresh=()=>{if(document.hidden)return;
  setPad(Array.from(navigator.getGamepads?.()??[]).some(p=>p?.connected));
  void devices().then(result=>{if(live)setDevice(result.controllers?.[0])}).catch(()=>{});
 };refresh();const timer=setInterval(refresh,15000);return()=>{live=false;clearInterval(timer)}},[]);
 return <><span className="gh-device-ring" data-connected={!!device||pad}><MdSportsEsports/></span>
 <span>{device?'Controller '+device.index:'Controller'}<small>{device?.wired?'Wired connection':device?.level?'Battery: '+device.level:pad||device?'Controller connected':'Connect a controller'}</small></span></>;
}
