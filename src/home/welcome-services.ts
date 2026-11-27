import type {SocialBridge} from '../model';
import type {CenterActions} from '../ControlCenter';
import type {Controls} from '../Panel';
import type {NotificationStore} from '../notification-store';
let services:{bridge:SocialBridge;actions:CenterActions;controls:Controls;notifications:NotificationStore}|undefined;
export function connectWelcome(bridge:SocialBridge,actions:CenterActions,controls:Controls,notifications:NotificationStore){services={bridge,actions,controls,notifications};return()=>{services=undefined;};}
export function welcomeServices(){return services;}
