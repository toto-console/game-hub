import {useEffect,useState} from 'react';
import {readDownloads,type Transfer} from '../downloads';
export function HomeTransfer({appid}:{appid:number}) {
 const [row,setRow]=useState<Transfer>();
 useEffect(()=>{
  const host=window as any;
  const refresh=()=>setRow(readDownloads(host).rows.find(r=>r.appid===appid&&r.section!=='completed'&&r.section!=='uploads'));
  refresh();let subscription:{Unregister():void}|undefined;
  try{subscription=host.downloadsStore?.RegisterForDownloadItemsUpdate?.(refresh);}catch{/* Steam can rebuild its download store during navigation. */}
  const timer=window.setInterval(refresh,2000);
  return()=>{window.clearInterval(timer);subscription?.Unregister?.();};
 },[appid]);
 if(!row)return null;
 return <div className="ghd-install-progress" role="status"><span>{row.status}{row.percent!==undefined?` · ${Math.round(row.percent)}%`:''}</span><progress aria-label={row.status} max={100} value={row.percent}/></div>;
}
