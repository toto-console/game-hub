import {T} from "./i18n";
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {Controls} from './Panel';
import {focusControl} from './navigation';
import {scrollWithin} from './quick-navigation';
import {steamcordAvailable,steamcordCall,subscribeSteamcord,parseDiscordState,parseDMs,parseGuilds,parseMessages,sendDiscordMessage,type DiscordState,type DiscordChannel,type DiscordGuild,type DiscordMessage} from './steamcord-adapter';

type View={kind:'home'|'dms'|'servers'|'channels'|'voice'|'chat'|'image'|'settings';channel?:DiscordChannel;guild?:DiscordGuild;image?:string};
type Entry={view:View;focus:number;scroll:number};
export function SteamcordQuickMenu({controls,native,rail,drafts}:{controls:Controls;native:()=>void;rail:()=>void;drafts:Map<string,string>}){
 const {Button,Input}=controls,Message=controls.Message??'div';
 const root=useRef<HTMLDivElement>(null),body=useRef<HTMLDivElement>(null);
 const [view,setView]=useState<View>({kind:'home'}),[state,setState]=useState<DiscordState>();
 const [dms,setDMs]=useState<DiscordChannel[]>([]),[guilds,setGuilds]=useState<DiscordGuild[]>([]),[messages,setMessages]=useState<DiscordMessage[]>([]);
 const [draft,setDraft]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const readyView=useRef<View|undefined>(undefined),stack=useRef<Entry[]>([]),restore=useRef<Entry|undefined>(undefined);
 const account=useRef(''),viewRef=useRef(view),epoch=useRef(0),actionBusy=useRef(false),lastBack=useRef(0),closedKeyboard=useRef(0),mounted=useRef(true);
 const refreshRef=useRef<()=>void>(()=>{}),atEnd=useRef(true),anchor=useRef<{height:number;top:number}|undefined>(undefined);
 const histories=useRef(new Map<string,DiscordMessage[]>());
 viewRef.current=view;
 const targets=()=>Array.from(root.current?.querySelectorAll<HTMLElement>('button,input,[role="button"],[data-gh-control]')??[]).filter(n=>!n.matches(':disabled,[aria-disabled="true"]')&&!n.closest('[inert]')&&n.getClientRects().length>0);
 const move=(n:HTMLElement|undefined|null)=>{focusControl(n);if(n&&body.current?.contains(n))scrollWithin(n,body.current);};
 const go=(next:View)=>{
  stack.current.push({view:viewRef.current,focus:targets().findIndex(n=>n.contains(root.current?.ownerDocument.activeElement??null)),scroll:body.current?.scrollTop??0});
  epoch.current++;setError('');setNotice('');setMessages(next.channel?histories.current.get(next.channel.id)??[]:[]);setLoading(true);atEnd.current=true;setView(next);
 };
 const back=()=>{const prev=stack.current.pop();if(prev){epoch.current++;restore.current=prev;setError('');setNotice('');setMessages(prev.view.channel?histories.current.get(prev.view.channel.id)??[]:[]);setLoading(true);atEnd.current=false;setView(prev.view);}else rail();};
 useLayoutEffect(()=>{const saved=restore.current;const frame=requestAnimationFrame(()=>{if(!saved){if(!root.current?.ownerDocument.activeElement?.closest('.gq-category'))move(targets()[0]);if(body.current)body.current.scrollTop=0;}});return()=>cancelAnimationFrame(frame);},[view]);
 useLayoutEffect(()=>{const saved=restore.current;if(!saved||loading||readyView.current!==view)return;restore.current=undefined;const frame=requestAnimationFrame(()=>{move(targets()[saved.focus]??targets()[0]);if(body.current)body.current.scrollTop=saved.scroll;});return()=>cancelAnimationFrame(frame);},[loading,view,messages,dms,guilds]);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;epoch.current++;};},[]);
 useEffect(()=>{
  let live=true,running=false,again=false;const version=++epoch.current;
  const refresh=async()=>{
   if(running){again=true;return;}running=true;
   try{
    const session=parseDiscordState(await steamcordCall('get_state'));if(!live||version!==epoch.current)return;
    const id=session.me?.id??'';
    if(account.current&&id!==account.current){drafts.clear();histories.current.clear();stack.current=[];account.current=id;setMessages([]);setDMs([]);setGuilds([]);setDraft('');setState(session);setView({kind:'home'});return;}
    account.current=id;setState(session);
    if(!session.connected){setDMs([]);setGuilds([]);setMessages([]);return;}
    if(view.kind==='dms'){const rows=parseDMs(await steamcordCall('get_dm_channels'));if(live&&version===epoch.current)setDMs(rows);}
    if(view.kind==='servers'||view.kind==='channels'){
     const [a,b]=await Promise.all([steamcordCall('get_text_channels',false),steamcordCall('get_guilds_vc',false)]);
     const rows=parseGuilds(a,b);if(live&&version===epoch.current)setGuilds(rows);
    }
    if(view.kind==='chat'&&view.channel){const rows=parseMessages(await steamcordCall('get_messages',view.channel.id));if(live&&version===epoch.current)setMessages(old=>mergeMessages(old,rows));}
    if(live&&version===epoch.current)setError('');
   }catch(e){if(live&&version===epoch.current){setError(e instanceof Error?e.message:'Steamcord is unavailable.');setState(undefined);}}
   finally{running=false;if(live&&version===epoch.current){readyView.current=view;setLoading(false);if(again){again=false;void refresh();}}}
  };
  refreshRef.current=()=>void refresh();setLoading(true);void refresh();
  const off=subscribeSteamcord((event,args)=>{
   if(!live||version!==epoch.current)return;
   if(event==='state'){
    try{const next=parseDiscordState(args[0]);if(next.connected&&next.me?.id===account.current){setState(next);return;}}catch{/* Refresh through the verified backend when an event schema changes. */}
    void refresh();
   }else if(event==='dm_channels_changed'&&view.kind==='dms'||event==='chat_message'&&view.kind==='chat')void refresh();
  });
  const timer=setInterval(()=>void refresh(),5000);
  return()=>{live=false;off();clearInterval(timer);};
 },[view,drafts]);
 useEffect(()=>{if(view.kind==='chat'&&view.channel&&messages.length)histories.current.set(view.channel.id,messages);},[messages,view]);
 useEffect(()=>{if(view.kind==='chat'&&view.channel)setDraft(drafts.get(account.current+':'+view.channel.id)??'');},[view,drafts]);
 useLayoutEffect(()=>{if(view.kind!=='chat'||!body.current)return;const el=body.current;if(anchor.current){el.scrollTop=anchor.current.top+el.scrollHeight-anchor.current.height;anchor.current=undefined;}else if(atEnd.current&&!restore.current)el.scrollTop=el.scrollHeight;},[messages,view]);
 useEffect(()=>controls.keyboard?.subscribe(open=>{if(!open&&viewRef.current.kind==='chat'){closedKeyboard.current=Date.now();requestAnimationFrame(()=>move(root.current?.querySelector('input')));}}),[controls.keyboard]);
 const act=async(fn:()=>Promise<unknown>)=>{
  if(actionBusy.current)return;actionBusy.current=true;setBusy(true);setNotice('');setError('');
  try{const session=parseDiscordState(await steamcordCall('get_state'));if(!session.connected||session.me?.id!==account.current)throw Error('Discord account changed. Reopen Steamcord.');await fn();if(mounted.current)refreshRef.current();}
  catch(e){if(mounted.current)setError(e instanceof Error?e.message:'Steamcord action failed.');}
  finally{actionBusy.current=false;if(mounted.current)setBusy(false);}
 };
 const send=async()=>{
  const ch=viewRef.current.channel,text=draft;if(!ch||!text.trim()||actionBusy.current)return;
  const key=account.current+':'+ch.id;actionBusy.current=true;setBusy(true);setError('');
  try{await sendDiscordMessage(account.current,ch.id,text);if(drafts.get(key)===text)drafts.delete(key);if(mounted.current&&viewRef.current.channel?.id===ch.id){setDraft(current=>current===text?'':current);atEnd.current=true;refreshRef.current();requestAnimationFrame(()=>move(root.current?.querySelector('input')));}}
  catch(e){if(mounted.current)setError(e instanceof Error?e.message:'Message was not confirmed. Draft preserved.');}
  finally{actionBusy.current=false;if(mounted.current)setBusy(false);}
 };
 const older=()=>void act(async()=>{
  if(!view.channel||!messages[0])return;const version=epoch.current,rows=parseMessages(await steamcordCall('get_messages',view.channel.id,messages[0].id));
  if(!mounted.current||version!==epoch.current)return;
  if(body.current)anchor.current={height:body.current.scrollHeight,top:body.current.scrollTop};atEnd.current=false;
  setMessages(old=>mergeMessages(rows,old));if(!rows.length)setNotice('No older messages returned.');
 });
 useEffect(()=>{
  const el=root.current;if(!el)return;
  const handle=(e:Event)=>{
   const k=e as KeyboardEvent,d=(e as CustomEvent).detail,cancel=()=>{e.preventDefault();e.stopImmediatePropagation();};
   if(e.type==='vgp_oncancel'||k.key==='Escape'){
    cancel();if(k.repeat||d?.is_repeat)return;
    if(controls.keyboard?.visible()){controls.keyboard.hide();closedKeyboard.current=Date.now();return;}
    if(Date.now()-lastBack.current<180||Date.now()-closedKeyboard.current<250)return;lastBack.current=Date.now();back();return;
   }
   if(controls.keyboard?.visible())return;
   const direction=e.type==='vgp_ondirection'?d?.button:({ArrowUp:9,ArrowDown:10,ArrowLeft:11,ArrowRight:12} as Record<string,number>)[k.key];
   const target=e.target as HTMLElement;
   if(direction){
    cancel();const all=targets(),index=all.findIndex(n=>n.contains(target));
    if(direction===11){if(target.closest('.sc-send'))move(el.querySelector('input'));else if(!target.matches('input'))rail();}
    else if(direction===12){if(target.matches('input'))move(el.querySelector<HTMLElement>('.sc-send'));}
    else move(all[Math.max(0,Math.min(all.length-1,index+(direction===9?-1:1)))]);return;
   }
   if(k.key==='Tab'){cancel();const all=targets(),i=all.findIndex(n=>n.contains(target));move(all[Math.max(0,Math.min(all.length-1,i+(k.shiftKey?-1:1)))]);return;}
   if(k.key==='Enter'&&target.matches('input')){cancel();if(!k.repeat)void send();return;}
   if(e.type==='vgp_onmenu')cancel();
  };
  const events=['keydown','vgp_oncancel','vgp_ondirection','vgp_onmenu'];events.forEach(n=>el.addEventListener(n,handle,true));return()=>events.forEach(n=>el.removeEventListener(n,handle,true));
 });
 const available=steamcordAvailable(),connected=available&&state?.connected,currentGuild=guilds.find(g=>g.id===view.guild?.id);
 const name=view.kind==='chat'?view.channel?.name:view.kind==='channels'?view.guild?.name:({home:'Steamcord',dms:'Direct Messages',servers:'Servers',voice:'Discord Voice',image:'Image',settings:'Steamcord Settings'} as Record<string,string>)[view.kind];
 const avatar=(src?:string)=><span className="sc-avatar">{src?<img src={src} alt="" onError={e=>{e.currentTarget.style.visibility='hidden';}}/>:<span aria-hidden="true">D</span>}</span>;
 const row=(key:string,label:string,fn:()=>void,sub?:string,src?:string,disabled=false)=><Button key={key} className="sc-row" disabled={disabled} onClick={fn}>{src&&avatar(src)}<span><strong>{label}</strong>{sub&&<small>{sub}</small>}</span></Button>;
 return <div ref={root} data-steamcord className="sc-root"><style>{steamcordCSS}</style><h2>{name}</h2><Button className="sc-back" onClick={back}>{stack.current.length?<T text="Back"/>:'Back to Quick Menu tabs'}</Button>
 <div ref={body} className="sc-body" onScroll={()=>{if(body.current)atEnd.current=body.current.scrollHeight-body.current.scrollTop-body.current.clientHeight<45;}}>
 {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {!connected?<><p>{loading?'Connecting to Steamcord...':!available?'Steamcord 1.43.1 is required for these embedded controls.':state?.enabled===false?'Discord is stopped in Steamcord.':state?'Connect your Discord account in Steamcord.':'Steamcord is unavailable. Retry or open its original menu.'}</p>{row('retry','Retry',()=>refreshRef.current())}{row('native','Open original Steamcord / Setup',native)}</>:<>
 {view.kind==='home'&&<><p>Connected as: {state!.me?.name}</p>{row('dms','Direct Messages',()=>go({kind:'dms'}))}{row('servers','Servers / Voice Channels',()=>go({kind:'servers'}))}{row('voice','Current Discord Call',()=>go({kind:'voice'}),state!.voice?.name||'Not in a Discord call')}{row('settings','Steamcord Settings',()=>go({kind:'settings'}))}</>}
 {view.kind==='dms'&&<>{dms.map(c=>row(c.id,c.name,()=>go({kind:'chat',channel:c}),c.call?'Active Discord call':'Direct message',c.avatar))}{!loading&&!dms.length&&<p>No conversations returned by Steamcord.</p>}</>}
 {view.kind==='servers'&&<>{guilds.map(g=>row(g.id,g.name,()=>go({kind:'channels',guild:g}),`${g.channels.length} available channels`,g.avatar))}{!loading&&!guilds.length&&<p>No accessible channels returned by Steamcord.</p>}</>}
 {view.kind==='channels'&&<>{currentGuild?.channels.map(c=>row(c.id,(c.voice?'Voice: ':'# ')+c.name,()=>c.voice?void act(async()=>{const origin=viewRef.current;await steamcordCall('join_vc',c.id,c.guild);if(mounted.current&&viewRef.current===origin)go({kind:'voice'});}):go({kind:'chat',channel:c}),c.voice?`${c.participants??0} connected`:undefined,undefined,busy))}{!loading&&!currentGuild?.channels.length&&<p>No available channels.</p>}</>}
 {view.kind==='voice'&&<>{state!.voice?<><p>{state!.voice.guild} {state!.voice.name}</p>{state!.voice.users.map(u=><div key={u.id} className="sc-member" data-speaking={u.speaking}>{avatar(u.avatar)}<span>{u.name}<small>{u.speaking?'Speaking':u.muted?'Microphone muted':''}{u.deafened?' | Deafened':''}</small></span></div>)}{row('mute',state!.me?.muted?'Unmute microphone':'Mute microphone',()=>void act(()=>steamcordCall('toggle_mute')),undefined,undefined,busy)}{row('deafen',state!.me?.deafened?'Undeafen':'Deafen',()=>void act(()=>steamcordCall('toggle_deafen')),undefined,undefined,busy)}{row('leave','Disconnect Discord call',()=>void act(()=>steamcordCall('disconnect_vc')),undefined,undefined,busy)}</>:<p>No active Discord call. Choose a voice channel under Servers.</p>}{row('voice-settings','Voice settings / advanced controls (original Steamcord)',native)}</>}
 {view.kind==='settings'&&<><p>Steamcord owns your Discord session, audio devices and saved preferences. Advanced controls remain in its original interface.</p>{row('native-settings','Open original Steamcord settings',native)}</>}
 {view.kind==='chat'&&<>{row('older','Load older messages',older,undefined,undefined,busy||!messages.length)}{messages.map(m=><div key={m.id} className="sc-message" data-self={m.authorId===state!.me?.id}><Message data-gh-control="" tabIndex={0} className="sc-bubble"><small>{m.author}</small><span>{m.text||'(Attachment)'}</span>{m.time&&<time>{new Date(m.time).toLocaleString()}</time>}</Message>{m.images.map((src,i)=>row(m.id+':'+i,'View image',()=>go({kind:'image',image:src})))}</div>)}{!loading&&!messages.length&&<p>No loaded messages.</p>}</>}
 {view.kind==='image'&&<img className="sc-image" src={view.image} alt="Discord attachment"/>}
 </>}{loading&&connected&&<p>Refreshing...</p>}</div>
 {view.kind==='chat'&&connected&&<div className="sc-composer"><Input label="Discord message" placeholder="Message" value={draft} onChange={text=>{setDraft(text);if(view.channel)drafts.set(account.current+':'+view.channel.id,text);}} onConfirm={()=>{requestAnimationFrame(()=>move(root.current?.querySelector('input')));}}/><Button className="sc-send" disabled={busy||!draft.trim()} onClick={()=>void send()}><T text="Send"/></Button></div>}</div>;
}
function mergeMessages(a:DiscordMessage[],b:DiscordMessage[]){return [...new Map([...a,...b].map(m=>[m.id,m])).values()].sort((x,y)=>BigInt(x.id)<BigInt(y.id)?-1:1);}
const steamcordCSS=`
.sc-root{display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;color:white}.sc-root h2{margin-bottom:1vh!important}.sc-body{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:3px;scrollbar-width:thin}.sc-body p{font-size:clamp(11px,1vw,23px);color:#bac9dc}
.sc-root button{color:white!important;background:#ffffff08!important;border:1px solid #c9dfff25!important;border-radius:.6vw!important;padding:.7vh .6vw!important;font-size:clamp(11px,1.1vw,25px)!important;min-width:0!important;min-height:0!important;box-sizing:border-box!important}.sc-root .sc-row{display:flex!important;align-items:center!important;gap:.7vw!important;width:100%!important;margin:.6vh 0!important;text-align:left!important}.sc-row>span{min-width:0}.sc-row strong{display:block;font-weight:400;overflow-wrap:anywhere}.sc-row small,.sc-member small,.sc-bubble small,.sc-bubble time{display:block;font-size:.8em;opacity:.7}.sc-back{align-self:flex-start;flex-shrink:0;margin-bottom:1vh!important}
.sc-avatar{width:2.3vw;height:2.3vw;min-width:24px;min-height:24px;display:grid;place-items:center;flex-shrink:0;border-radius:50%;background:#22334c}.sc-avatar img{width:100%;height:100%;object-fit:cover;border-radius:inherit}.sc-member{display:flex;gap:.7vw;padding:.7vh 0;font-size:1.1vw}.sc-member[data-speaking=true] .sc-avatar{outline:2px solid #30d67a}
.sc-message{margin:1vh 0;display:flex;flex-direction:column;align-items:flex-start}.sc-message[data-self=true]{align-items:flex-end}.sc-bubble{max-width:95%!important;text-align:left!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important}.sc-bubble span{display:block}.sc-composer{display:flex;gap:.5vw;flex-shrink:0;padding-top:1vh;align-items:center}.sc-composer .gbs-text-field{flex:1;min-width:0}.sc-composer input{width:100%;box-sizing:border-box;color:white;font-size:1.1vw}.sc-image{max-width:100%;object-fit:contain}.sc-root button:disabled{opacity:.4!important}
`;
