import type {Snapshot} from './model';
export type Presence='online'|'away'|'offline'|'unknown';
export function personaPresence(p:any):Presence {
 if(!p||typeof p.m_ePersonaState!=='number')return 'unknown';
 if(p.m_ePersonaState===0||p.m_ePersonaState===7)return 'offline';
 if(p.m_ePersonaState===3||p.m_ePersonaState===4)return 'away';
 return [1,2,5,6].includes(p.m_ePersonaState)?'online':'unknown';
}
export function readDockPresence(host:any,friends:Snapshot|undefined){
 const a=host?.g_FriendsUIApp,connected=a?.CMInterface?.logged_on===true,ready=a?.FriendStore?.friends_list_ready===true;
 const profile=connected?personaPresence(a?.FriendStore?.self?.persona):a?.CMInterface?.logged_on===false?'offline':'unknown';
 const raw=host?.friendStore?.allFriends,complete=Array.isArray(raw)&&raw.every((f:any)=>f?.is_ready===true);
 const count=connected&&ready&&complete&&friends?.kind==='ready'?friends.friends.filter(f=>f.state!=='offline').length:undefined;
 return {profile,count:connected&&ready&&friends!==undefined&&friends.kind!=='unavailable'&&Array.isArray(raw)&&raw.length===0?0:count};
}
export function OnlineStatusDot({state}:{state:Presence}){return <i className="gh-status-dot" data-presence={state} aria-hidden="true"/>;}
export function FriendsOnlineCounter({count}:{count?:number}){return <span className="gh-friends-online" title={count===undefined?'Steam presence unavailable':`${count} friends online`}><OnlineStatusDot state={count===undefined?'unknown':count>0?'online':'offline'}/><span>{count??'—'}</span></span>;}
export function ProfilePresenceBadge({state}:{state:Presence}){return <span className="gh-profile-status" title={`Steam presence: ${state}`}><OnlineStatusDot state={state}/></span>;}
export const presenceCSS=`
#game-hub-control-center .gh-status-dot{display:block;width:.48vw;height:.48vw;min-width:5px;min-height:5px;border-radius:50%;background:#9198a4;border:1px solid #101825;box-sizing:content-box}
#game-hub-control-center .gh-status-dot[data-presence=online]{background:#30d67a}#game-hub-control-center .gh-status-dot[data-presence=away]{background:#f4b54d}
#game-hub-control-center .gh-status-dot[data-presence=unknown]{background:transparent;border-color:#a3adba}
#game-hub-control-center .gh-friends-online{position:absolute;left:73%;top:22%;display:flex;align-items:center;gap:.15vw;font-size:clamp(9px,.63vw,16px);color:#fff;pointer-events:none;white-space:nowrap;z-index:5;line-height:1}
#game-hub-control-center .gh-profile-status{position:absolute;left:67%;top:67%;pointer-events:none;z-index:5}#game-hub-control-center .gh-profile-status .gh-status-dot{width:.65vw;height:.65vw;border-width:2px}
`;
