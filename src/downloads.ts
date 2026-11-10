export type TransferSection='active'|'queue'|'scheduled'|'uploads'|'completed';
export type Transfer={id:string;appid:number;title:string;section:TransferSection;status:string;bytes?:number;total?:number;percent?:number;speed?:number;eta?:number;scheduled?:number;finished?:number;error?:string;action?:'pause'|'resume';actionLabel?:string};
type Progress={bytes_in_progress?:number;bytes_total?:number};
type Item={appid:number;active?:boolean;paused?:boolean;completed?:boolean;queue_index?:number;deferred_time?:number;completed_time?:number;overall_percent_complete?:number;update_error?:string;update_type_info?:Array<{progress?:Progress[]}>};
type Overview={update_appid?:number;paused?:boolean;update_is_upload?:boolean;update_state?:string;overall_percent_complete?:number;overall_estimated_time_remaining_sec?:number;update_network_bytes_per_second?:number;progress?:Progress[]};
export type DownloadHost={downloadsStore?:{m_DownloadItems?:Map<string,Item[]>;LocalDownloadOverview?:Overview;RecentlyCompleted?:Item[];RegisterForDownloadItemsUpdate?:(cb:()=>void)=>{Unregister():void}};appStore?:{GetAppOverviewByAppID:(id:number)=>{display_name?:string;local_per_client_data?:{installed?:boolean}}|undefined};SteamClient?:{Downloads?:{PauseAppUpdate?:(id:number,client:string)=>unknown;ResumeAppUpdate?:(id:number,client:string)=>unknown}}};
export type DownloadSnapshot={ready:boolean;overviewReady:boolean;rows:Transfer[]};
const valid=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
const positive=(n:unknown):n is number=>valid(n)&&n>0;
export function readDownloads(host:DownloadHost):DownloadSnapshot{
 try{
  const store=host.downloadsStore,items=store?.m_DownloadItems?.get('0'),o=store?.LocalDownloadOverview;
  if(!Array.isArray(items))return {ready:false,overviewReady:false,rows:[]};
  const rows:Transfer[]=[],seen=new Set<string>();
  const add=(item:Item,recent=false)=>{
   if(!Number.isSafeInteger(item.appid)||item.appid<=0)return;
   const current=!recent&&o?.update_appid===item.appid,done=!!item.completed||recent;
   const app=host.appStore?.GetAppOverviewByAppID(item.appid);
   if(recent&&app?.local_per_client_data?.installed!==true)return;
   const id=done?`${item.appid}:completed:${item.completed_time??0}`:String(item.appid);if(seen.has(id))return;seen.add(id);
   const paused=!done&&(!!item.paused||!!o?.paused);
   const upload=current&&!!o?.update_is_upload;
   const active=!done&&!paused&&(!!item.active||current);
   const scheduled=!done&&!active&&item.queue_index===-1&&positive(item.deferred_time);
   const section:TransferSection=done?'completed':upload?'uploads':active?'active':scheduled?'scheduled':'queue';
   const state=current?o?.update_state:undefined;
   const status=item.update_error?'Needs attention':done?'Completed':paused?'Paused':upload?'Uploading':active?({Downloading:'Downloading',Installing:'Installing',Verifying:'Verifying',Updating:'Updating',Staging:'Installing',Committing:'Installing',Preallocating:'Preparing',Starting:'Starting',Stopping:'Stopping'}[state??'']||'Updating'):scheduled?'Scheduled':'Queued';
   // Steam's installed download model uses progress[2] for network bytes.
   const progress=item.update_type_info?.map(t=>t.progress?.[2]).filter((p):p is Progress=>!!p)??[];
   const total=progress.length?progress.reduce((n,p)=>n+(valid(p.bytes_total)?p.bytes_total:0),0):current?o?.progress?.[2]?.bytes_total:undefined;
   const bytes=progress.length?progress.reduce((n,p)=>n+(valid(p.bytes_in_progress)?p.bytes_in_progress:0),0):current?o?.progress?.[2]?.bytes_in_progress:undefined;
   const raw=current?o?.overall_percent_complete:item.overall_percent_complete;
   const percent=done?100:valid(raw)?Math.min(100,raw):undefined;
   const api=host.SteamClient?.Downloads;
   const action=!done&&!upload?(active&&typeof api?.PauseAppUpdate==='function'?'pause':!active&&typeof api?.ResumeAppUpdate==='function'?'resume':undefined):undefined;
   rows.push({id,appid:item.appid,title:app?.display_name||`Steam app ${item.appid}`,section,status,total:positive(total)?total:undefined,bytes:valid(bytes)?bytes:undefined,percent,speed:current&&positive(o?.update_network_bytes_per_second)?o.update_network_bytes_per_second:undefined,eta:current&&valid(o?.overall_estimated_time_remaining_sec)?o.overall_estimated_time_remaining_sec:undefined,scheduled:scheduled?item.deferred_time:undefined,finished:done&&positive(item.completed_time)?item.completed_time:undefined,error:item.update_error||undefined,action,actionLabel:action==='pause'?'Pause':action?item.update_error?'Retry':paused?'Resume':'Start now':undefined});
  };
  [...items].sort((a,b)=>(a.queue_index??-1)-(b.queue_index??-1)).forEach(i=>add(i));
  if(positive(o?.update_appid)&&!items.some(i=>i.appid===o.update_appid))add({appid:o.update_appid,active:true});
  for(const item of store?.RecentlyCompleted??[])add(item,true);
  const order={active:0,queue:1,scheduled:2,uploads:3,completed:4};
  rows.sort((a,b)=>order[a.section]-order[b.section]||(a.section==='scheduled'?(a.scheduled??0)-(b.scheduled??0):a.section==='completed'?(b.finished??0)-(a.finished??0):0));
  return {ready:true,overviewReady:!!o,rows};
 }catch{return {ready:false,overviewReady:false,rows:[]};}
}
export async function runDownloadAction(host:DownloadHost,id:string,action:'pause'|'resume'){
 const row=readDownloads(host).rows.find(r=>r.id===id);
 if(!row||row.action!==action)throw Error('This transfer changed. Please select its current action.');
 const api=host.SteamClient?.Downloads;
 if(action==='pause'&&api?.PauseAppUpdate)await api.PauseAppUpdate(row.appid,'0');
 else if(action==='resume'&&api?.ResumeAppUpdate)await api.ResumeAppUpdate(row.appid,'0');
 else throw Error('Use Open Steam downloads for this action.');
}
export function formatBytes(n:number){if(n<1024)return `${Math.round(n)} B`;const units=['KB','MB','GB','TB'];let value=n/1024,i=0;while(value>=1024&&i<units.length-1){value/=1024;i++;}return `${value.toFixed(value>=100?0:1)} ${units[i]}`;}
export function formatETA(n:number){return n<60?'Less than a minute':n<3600?`${Math.ceil(n/60)} min remaining`:`${Math.floor(n/3600)} hr ${Math.ceil(n%3600/60)} min remaining`;}
