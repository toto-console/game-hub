import {decky} from './decky-adapter';
export const steamcordVersion='1.43.1';
type Backend={call:(route:string,plugin:string,method:string,...args:unknown[])=>Promise<unknown>;addEventListener?:(event:string,fn:(data:any)=>void)=>void;removeEventListener?:(event:string,fn:(data:any)=>void)=>void};
const backend=()=>(window as unknown as {DeckyBackend?:Backend}).DeckyBackend;
export function steamcordAvailable(){try{const d=decky(),p=d?.plugins.find(p=>p.name==='Steamcord'),s=d?.deckyState.publicState();return !!p&&p.version===steamcordVersion&&typeof p.onDismount==='function'&&!s?.disabledPlugins.some(p=>p.name==='Steamcord');}catch{return false;}}
const methods=new Set(['get_state','get_dm_channels','get_guilds_vc','get_text_channels','get_messages','send_message','join_vc','toggle_mute','toggle_deafen','disconnect_vc']);
export async function steamcordCall(method:string,...args:unknown[]){
 if(!steamcordAvailable())throw Error('Steamcord 1.43.1 is not loaded, is disabled, or has changed. Use the original Steamcord menu.');
 if(!methods.has(method)||!backend()?.call)throw Error('This Steamcord integration is unavailable.');
 const value=await backend()!.call('loader/call_plugin_method','Steamcord',method,...args);
 if(value&&typeof value==='object'&&(value as any).ok===false)throw Error(String((value as any).error||'Steamcord rejected the request.'));
 return value;
}
// Decky's reviewed event envelope. Do not take over Steamcord's global watched channel,
// UI registration, QR login, account storage or background voice lifecycle.
export function subscribeSteamcord(fn:(event:string,args:unknown[])=>void){const b=backend();const receive=(data:any)=>{if(data?.plugin==='Steamcord'&&['state','dm_channels_changed','chat_message'].includes(data.event))fn(data.event,Array.isArray(data.args)?data.args:[]);};b?.addEventListener?.('loader/plugin_event',receive);return()=>b?.removeEventListener?.('loader/plugin_event',receive);}
export const snowflake=(v:unknown):v is string=>typeof v==='string'&&/^\d{1,22}$/.test(v);
const text=(v:unknown,max=4000)=>typeof v==='string'?v.slice(0,max):'';
export function discordImage(value:unknown){if(typeof value!=='string')return;try{const u=new URL(value);if(u.protocol==='https:'&&!u.username&&!u.password&&['cdn.discordapp.com','media.discordapp.net'].includes(u.hostname))return u.href;}catch{}return;}
export function discordAvatar(id:string,hash?:string|null,kind='avatars'){if(!snowflake(id)||!hash||!/^[a-zA-Z0-9_]+$/.test(hash))return;return `https://cdn.discordapp.com/${kind}/${id}/${hash}.webp?size=128`;}
export type DiscordUser={id:string;name:string;avatar?:string;muted:boolean;deafened:boolean;speaking:boolean};
function user(v:any):DiscordUser{if(!v||!snowflake(v.id))throw Error('Steamcord user data changed.');return {id:v.id,name:text(v.global_name||v.username,120)||'Discord user',avatar:discordImage(v.avatar)||discordAvatar(v.id,v.avatar),muted:v.is_muted===true,deafened:v.is_deafened===true,speaking:v.is_speaking===true};}
export type DiscordState={connected:boolean;enabled:boolean;me?:DiscordUser;voice?:{id:string;name:string;guild:string;users:DiscordUser[]}};
export function parseDiscordState(v:any):DiscordState{if(!v||typeof v.loaded!=='boolean'||typeof v.logged_in!=='boolean')throw Error('Steamcord session data changed.');const connected=v.loaded&&v.logged_in&&v.discord_enabled!==false;return {connected,enabled:v.discord_enabled!==false,me:connected?user(v.me):undefined,voice:connected&&v.vc&&snowflake(v.vc.channel_id)?{id:v.vc.channel_id,name:text(v.vc.channel_name,120),guild:text(v.vc.guild_name,120),users:Array.isArray(v.vc.users)?v.vc.users.map(user):[]}:undefined};}
export type DiscordChannel={id:string;name:string;avatar?:string;voice?:boolean;guild?:string;participants?:number;call?:boolean};
export type DiscordGuild={id:string;name:string;avatar?:string;channels:DiscordChannel[]};
function list(v:unknown):any[]{if(!Array.isArray(v))throw Error('Steamcord returned unavailable data. Try again.');return v;}
export function parseDMs(v:unknown):DiscordChannel[]{return list(v).filter(x=>snowflake(x?.id)).map(x=>({id:x.id,name:text(x.name,160)||'Direct message',avatar:x.type===3?discordAvatar(x.id,x.icon,'channel-icons'):discordAvatar(x.recipients?.[0]?.id,x.recipients?.[0]?.avatar),call:x.active_call===true}));}
export function parseGuilds(texts:unknown,voices:unknown):DiscordGuild[]{const found=new Map<string,DiscordGuild>();for(const [rows,voice] of [[list(texts),false],[list(voices),true]] as const)for(const v of rows){if(!snowflake(v?.id)||v.hidden===true)continue;const g:DiscordGuild=found.get(v.id)??{id:v.id,name:text(v.name,160),avatar:discordAvatar(v.id,v.icon,'icons'),channels:[]};for(const c of list(v.channels)){if(!snowflake(c?.id)||g.channels.some(x=>x.id===c.id))continue;g.channels.push({id:c.id,name:text(c.name,160),voice,guild:g.id,participants:voice&&Array.isArray(c.members)?c.members.length:undefined});}found.set(g.id,g);}return [...found.values()];}
export type DiscordMessage={id:string;author:string;authorId:string;text:string;time:string;images:string[]};
export function parseMessages(v:unknown):DiscordMessage[]{return list(v).filter(x=>snowflake(x?.id)).map(x=>({id:x.id,author:text(x.author,120)||'Discord user',authorId:text(x.author_id,22),text:text(x.content,8000),time:typeof x.ts==='string'&&Number.isFinite(Date.parse(x.ts))?x.ts:'',images:Array.isArray(x.images)?x.images.map((i:any)=>discordImage(i.url)||discordImage(i.proxy_url)).filter(Boolean).slice(0,8):[]})).sort((a,b)=>BigInt(a.id)<BigInt(b.id)?-1:1);}
const pending=new Set<string>();
export async function sendDiscordMessage(account:string,channel:string,body:string){if(!snowflake(channel)||!body.trim())throw Error('Enter a message first.');const key=account+':'+channel;if(pending.has(key))throw Error('A message is already being sent.');pending.add(key);try{const state=parseDiscordState(await steamcordCall('get_state'));if(!state.connected||state.me?.id!==account)throw Error('Discord account changed. Reopen Steamcord.');const result=await steamcordCall('send_message',channel,body.trim());if(result!==true)throw Error('Steamcord did not confirm sending. Your draft is preserved; check history before retrying.');}finally{pending.delete(key);}}
