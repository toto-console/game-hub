import type {SocialBridge} from '../model';
import type {CenterActions} from '../ControlCenter';
let services:{bridge:SocialBridge;actions:CenterActions}|undefined;
export function connectWelcome(bridge:SocialBridge,actions:CenterActions){services={bridge,actions};return()=>{services=undefined;};}
export function welcomeServices(){return services;}
