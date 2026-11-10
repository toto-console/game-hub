import {ConversationView,type Draft} from './ChatPanel';
import type {Conversation} from './messages';
import type {SocialBridge} from './model';
import type {Controls} from './Panel';

export function QuickConversation({bridge,controls,item,account,saved,presence,close}:{bridge:SocialBridge;controls:Controls;item:Conversation;account:string;saved:Draft;presence?:string;close:()=>void}){
 return <div className="gq-inline-chat"><ConversationView compact presence={presence} social={bridge} item={item} account={account} bridge={bridge.messages!} controls={controls} saved={saved} onClose={close} native={()=>{}}/></div>;
}
