import {safeAvatar} from './model';
export type Player={id:string;name:string;avatar?:string;relationship:number};
type Raw={accountid:number;is_ready:boolean;efriendrelationship:number;LoadIfNecessary():void;persona:{m_strPlayerName:string;avatar_url_medium?:string}};
type Store={self:Raw;friends_list_ready:boolean;GetPlayer(id:number):Raw;FriendGroupStore:{incoming_invites_group:{member_list:Raw[]};outgoing_invites_group:{member_list:Raw[]}};SendFriendInviteBySteamID(id:string):Promise<{eResult:number;eFriendRelationship:number}>;RemoveFriendBySteamID(id:string):Promise<number>};
export function resolvePlayerID(query:string):string|undefined {
 let q=query.trim();if(q.startsWith('https://')){let u:URL;try{u=new URL(q);}catch{return;}if(u.hostname!=='steamcommunity.com'||u.username||u.password||u.port)return;q=u.pathname.match(/^\/profiles\/(\d+)\/?$/)?.[1]??'';}
 if(!/^\d{1,17}$/.test(q))return;
 const n=BigInt(q),base=76561197960265728n,account=n>base?n-base:n;
 if(account<1n||account>0xffffffffn)return;
 return String(base+account);
}
export const relationshipLabel=(n:number)=>({0:'Not friends',1:'Blocked',2:'Incoming request',3:'Friends',4:'Request Sent',5:'Blocked',6:'Unavailable'}[n]??'Relationship unavailable');
export type FriendManagement=ReturnType<typeof createFriendManagement>;
export function createFriendManagement(host:unknown){
 const pending=new Set<string>();const confirmed=new Map<string,number>();let currentOwner:number|undefined;
 const app=()=>{const a=(host as {g_FriendsUIApp?:{FriendStore:Store;CMInterface:{logged_on:boolean}}}).g_FriendsUIApp;if(!a?.CMInterface?.logged_on||!a.FriendStore.friends_list_ready)throw Error('Steam is offline or still loading friends.');if(currentOwner!==a.FriendStore.self.accountid){confirmed.clear();currentOwner=a.FriendStore.self.accountid;}return a;};
 const convert=(r:Raw):Player=>{r.LoadIfNecessary();const id=String(76561197960265728n+BigInt(r.accountid));if(confirmed.get(id)===r.efriendrelationship)confirmed.delete(id);return {id:String(76561197960265728n+BigInt(r.accountid)),name:r.is_ready?r.persona.m_strPlayerName:'Loading Steam profile…',avatar:r.is_ready?safeAvatar(r.persona.avatar_url_medium):undefined,relationship:confirmed.get(id)??r.efriendrelationship};};
 return {
 account:()=>app().FriendStore.self.accountid,
 read(id:string){const normalized=resolvePlayerID(id);if(normalized!==id)throw Error('Invalid Steam ID.');return convert(app().FriendStore.GetPlayer(Number(BigInt(id)-76561197960265728n)));},
 requests(){const s=app().FriendStore;return {incoming:s.FriendGroupStore.incoming_invites_group.member_list.map(convert).filter(p=>p.relationship===2),outgoing:s.FriendGroupStore.outgoing_invites_group.member_list.map(convert).filter(p=>p.relationship===4)};},
 async act(id:string,action:'add'|'accept'|'ignore'|'cancel'){
  if(resolvePlayerID(id)!==id)throw Error('Invalid Steam ID.');
  const a=app(),s=a.FriendStore,owner=s.self.accountid,key=owner+':'+id;
  if(pending.has(key))throw Error('A request for this player is already processing.');
  const r=s.GetPlayer(Number(BigInt(id)-76561197960265728n));
  if(!r.is_ready||r.accountid===owner)throw Error('Wait for a valid player profile.');
  const expected={add:0,accept:2,ignore:2,cancel:4}[action];
  if((confirmed.get(id)??r.efriendrelationship)!==expected)throw Error('Relationship changed. Refresh before trying again.');
  pending.add(key);
  try{
   let relation:number;
   if(action==='add'||action==='accept'){
    if(typeof s.SendFriendInviteBySteamID!=='function')throw Error('Use native Steam to manage this request.');
    const result=await s.SendFriendInviteBySteamID(id);
    if(result.eResult!==1)throw Error('Steam rejected the request (result '+result.eResult+'). Check account restrictions, invitation limits or connection.');
    relation=result.eFriendRelationship;
    if(relation!==3&&relation!==4)throw Error('Steam has not confirmed a friendship or pending request. Refresh before retrying.');
   }else{
    if(typeof s.RemoveFriendBySteamID!=='function')throw Error('Use native Steam to manage this request.');
    relation=await s.RemoveFriendBySteamID(id);
    if(relation!==0)throw Error('Steam has not confirmed removal. Refresh before retrying.');
   }
   if(app()!==a||s.self.accountid!==owner)throw Error('Steam account changed. Refresh this screen.');
   confirmed.set(id,relation);return relation;
  }finally{pending.delete(key);}
 }
 };
}
