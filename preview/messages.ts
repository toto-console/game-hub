import type {MessagesBridge,ChatMessage} from '../src/messages';
import {friends,preview} from './fixtures';
const rows=new Map<string,ChatMessage[]>();
for(const friend of friends)rows.set(friend.id,preview.messages.map((m,i)=>({id:String(i),author:m.author,self:!!m.self,text:m.text,time:1793482860+i*60,state:'sent'})));
export const previewMessages:MessagesBridge={
 inbox:()=>({account:'fictional-preview',connected:true,conversations:friends.map((f,i)=>({id:f.id,name:f.name,kind:'friend',subtitle:i?'Direct message':'Same crew tonight?',unread:i===0?2:0,time:1793482860}))}),
 friend:id=>id,
 open:id=>({read:()=>({messages:rows.get(id)??[],more:false,typing:false,canSend:true}),load:async()=>{},send:async text=>{rows.get(id)?.push({id:String(Date.now()),author:'You',self:true,text,time:Date.now()/1000,state:'sent'});},dispose:()=>{}})
};
