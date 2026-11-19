import type {Friend} from './model';
import {steamMachineIcon} from './steam-machine-icon';
export function FriendActivity({friend}:{friend:Friend}){
 // This artwork denotes Steam activity, not the friend's physical hardware.
 const playing=friend.state==='playing';
 const activity=friend.game||({playing:'In game',online:'Online',away:'Away',offline:'Offline'}[friend.state]);
 return <span className="gbs-friend-activity"><small className="gbs-activity-title" title={activity}>{activity}</small>{playing&&<span className="gbs-platform" title="Playing on Steam" role="img" aria-label="Playing on Steam"><img src={steamMachineIcon} alt="" draggable={false}/></span>}</span>;
}
