import {useEffect,useState} from 'react';
export type CenterRow={id:string;title:string;detail:string;progress?:number;count?:number;destination?:'Messages'|'Party'};
export function useCenterData(){
 const [data,setData]=useState<{downloads:CenterRow[];downloadsReady:boolean}>({downloads:[],downloadsReady:false});
 useEffect(()=>{const read=()=>{
  const downloads:CenterRow[]=[];let downloadsReady=false;
  try{
   const host=window as unknown as {downloadsStore?:{m_DownloadItems:Map<string,Array<{appid:number;active:boolean;paused:boolean;completed:boolean;queue_index:number;total_bytes:number;downloaded_bytes:number;update_error?:string}>>;LocalDownloadOverview?:{update_appid:number;update_is_install:boolean;update_is_upload:boolean;update_network_bytes_per_second:number}};appStore?:{GetAppOverviewByAppID(id:number):{display_name?:string}}};
   const items=host.downloadsStore?.m_DownloadItems?.get('0'),overview=host.downloadsStore?.LocalDownloadOverview;
   if(Array.isArray(items)){downloadsReady=true;for(const item of [...items].sort((a,b)=>Number(b.active)-Number(a.active)||Number(a.completed)-Number(b.completed)||a.queue_index-b.queue_index)){
    const current=overview?.update_appid===item.appid?overview:undefined;
    const status=item.update_error?'Needs attention':item.completed?'Completed':item.paused?'Paused':item.active?(current?.update_is_upload?'Uploading':current?.update_is_install?'Installing':'Downloading'):'Queued';
    const progress=!current?.update_is_install&&!current?.update_is_upload&&item.total_bytes>0&&Number.isFinite(item.downloaded_bytes)?Math.max(0,Math.min(100,item.downloaded_bytes/item.total_bytes*100)):undefined;
    const speed=current&&current.update_network_bytes_per_second>0?` · ${(current.update_network_bytes_per_second/1048576).toFixed(1)} MB/s`:'';
    downloads.push({id:String(item.appid),title:host.appStore?.GetAppOverviewByAppID(item.appid)?.display_name||`Steam app ${item.appid}`,detail:status+speed,progress});
   }}
  }catch{/* Native downloads remains available. */}
  setData({downloads,downloadsReady});
 };read();const timer=setInterval(read,2000);return()=>clearInterval(timer);},[]);
 return data;
}
