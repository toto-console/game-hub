import {downloadSource,useDownloadsSnapshot,useDownloadTick} from './downloads-live';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {Controls} from './Panel';
import {focusControl} from './navigation';
import {readDownloads,runDownloadAction,formatBytes,formatETA,type DownloadHost,type Transfer,type TransferSection} from './downloads';
import {downloadsCSS} from './downloads-style';
const sections:Array<{key:TransferSection;title:string;empty:string}>=[{key:'active',title:'Downloading',empty:''},{key:'queue',title:'Up Next',empty:'There are no downloads in the queue'},{key:'scheduled',title:'Scheduled',empty:'No scheduled downloads'},{key:'uploads',title:'Uploads',empty:'No uploads reported by Steam'},{key:'completed',title:'Recent downloads',empty:''}];
function Artwork({appid}:{appid:number}){const [failed,setFailed]=useState(false);return <span className="gcd-art">{failed?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/></svg>:<img src={`/assets/${appid}/header.jpg`} alt="" onError={()=>setFailed(true)}/>}</span>;}
export function DownloadsPage({controls,back,native,motion,initialAppId}:{initialAppId?:number;controls:Controls;back:()=>void;native:()=>void;motion:boolean}){
 const {Button,Group}=controls,host=window as unknown as DownloadHost,root=useRef<HTMLDivElement>(null);
 const snapshot=useDownloadsSnapshot();
 const [clock,setClock]=useState(()=>new Date()),[selected,setSelected]=useState(''),[busy,setBusy]=useState(''),[notice,setNotice]=useState('');
 const pending=useRef(false),mounted=useRef(true),focusKey=useRef({row:'',column:0}),lastBack=useRef(0),backRef=useRef(back);backRef.current=back;
 const refresh=downloadSource.refresh;
 useDownloadTick(()=>setClock(old=>{const now=new Date();return old.getHours()===now.getHours()&&old.getMinutes()===now.getMinutes()?old:now;}),[]);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const rows=()=>Array.from(root.current?.querySelectorAll<HTMLElement>('[data-download-row]')??[]);
 const buttons=(row:HTMLElement)=>Array.from(row.querySelectorAll<HTMLElement>('.gcd-control')).filter(e=>!e.matches(':disabled'));
 const move=(row:HTMLElement|undefined,column=0)=>{if(!row)return;const el=buttons(row)[Math.max(0,Math.min(column,buttons(row).length-1))];if(!el)return;focusControl(el);focusKey.current={row:row.dataset.downloadRow??'',column:buttons(row).indexOf(el)};const list=root.current?.querySelector<HTMLElement>('.gcd-scroll');if(list?.contains(el)){const a=row.getBoundingClientRect(),b=list.getBoundingClientRect();const smooth=motion&&!list.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;if(a.top<b.top)list.scrollBy({top:a.top-b.top,behavior:smooth?'smooth':'auto'});else if(a.bottom>b.bottom)list.scrollBy({top:a.bottom-b.bottom,behavior:smooth?'smooth':'auto'});}};
 const close=()=>{if(Date.now()-lastBack.current<200)return;lastBack.current=Date.now();backRef.current();};
 useLayoutEffect(()=>{const f=requestAnimationFrame(()=>move(rows().find(r=>r.dataset.downloadRow===String(initialAppId))??rows()[0]));return()=>cancelAnimationFrame(f);},[]);
 useLayoutEffect(()=>{const el=root.current;if(!el||el.contains(el.ownerDocument.activeElement))return;const all=rows();move(all.find(r=>r.dataset.downloadRow===focusKey.current.row)??all[0],focusKey.current.column);},[snapshot,busy]);
 useEffect(()=>{const el=root.current;if(!el)return;
  const handle=(e:Event)=>{if(controls.keyboard?.visible())return;const key=e as KeyboardEvent,detail=(e as CustomEvent).detail;const cancel=e.type==='vgp_oncancel'||key.key==='Escape';const dir=e.type==='vgp_ondirection'?detail?.button:({ArrowUp:9,ArrowDown:10,ArrowLeft:11,ArrowRight:12} as Record<string,number>)[key.key];const tab=e.type==='keydown'&&key.key==='Tab';if(!cancel&&!dir&&!tab&&e.type!=='vgp_onmenu')return;e.preventDefault();e.stopImmediatePropagation();if(cancel){if(!key.repeat&&!detail?.is_repeat)close();return;}if(e.type==='vgp_onmenu')return;
   const all=rows(),target=(e.target as HTMLElement)?.closest<HTMLElement>('[data-download-row]'),row=target??all.find(r=>r.dataset.downloadRow===focusKey.current.row)??all[0];if(!row)return;const index=all.indexOf(row),opts=buttons(row),focused=(e.target as HTMLElement)?.closest<HTMLElement>('.gcd-control'),column=focused?Math.max(0,opts.indexOf(focused)):focusKey.current.column;
   if(dir===9||dir===10||tab)move(all[Math.max(0,Math.min(all.length-1,index+((dir===9||tab&&key.shiftKey)?-1:1)))],0);
   else move(row,column+(dir===11?-1:1));
  };
  const track=(e:Event)=>{const control=(e.target as HTMLElement)?.closest<HTMLElement>('.gcd-control'),row=control?.closest<HTMLElement>('[data-download-row]');if(control&&row)focusKey.current={row:row.dataset.downloadRow??'',column:buttons(row).indexOf(control)};};
  for(const t of ['keydown','vgp_ondirection','vgp_oncancel','vgp_onmenu'])el.addEventListener(t,handle,true);
  for(const t of ['focusin','vgp_onfocus'])el.addEventListener(t,track,true);
  return()=>{for(const t of ['keydown','vgp_ondirection','vgp_oncancel','vgp_onmenu'])el.removeEventListener(t,handle,true);for(const t of ['focusin','vgp_onfocus'])el.removeEventListener(t,track,true);};
 },[controls,motion]);
 const run=async(row:Transfer)=>{if(pending.current||!row.action)return;pending.current=true;setBusy(row.id);setNotice('');try{await runDownloadAction(host,row.id,row.action);if(mounted.current){setNotice('Request sent to Steam. Status updates when Steam confirms the change.');refresh();}}catch(e){if(mounted.current)setNotice(e instanceof Error?e.message:'Steam action unavailable.');}finally{pending.current=false;if(mounted.current)setBusy('');}};
 const size=(row:Transfer)=>row.total?`${row.bytes!==undefined?formatBytes(row.bytes)+' / ':''}${formatBytes(row.total)}`:'';
 return <div ref={root} className="gcc-settings gcd-page" data-motion={motion} aria-label="Downloads and uploads"><style>{downloadsCSS}</style>
  <header className="gcd-status"><time>{clock.toLocaleTimeString([], {hour:'numeric',minute:'2-digit',hour12:true})}</time><span>{clock.toLocaleDateString([], {weekday:'short',month:'short',day:'numeric'})}</span></header>
  <div className="gcd-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M12 2v13m-5-5 5 5 5-5M3 16v5h18v-5"/></svg><h1>Downloads / Uploads</h1></div>
  <div className="gcd-scroll"><Group className="gcd-list">
   {!snapshot.ready?<div className="gcd-empty"><h2>Download information unavailable</h2><p>Steam’s local download queue could not be read. You can use the native downloads page below.</p></div>:sections.map(section=>{const list=snapshot.rows.filter(r=>r.section===section.key);if(!list.length&&(section.key==='active'||section.key==='completed'))return null;return <section key={section.key} aria-label={section.title}>
    <h2>{section.title} <span>({list.length})</span></h2>
    {!list.length&&<p className="gcd-empty">{section.key==='uploads'&&!snapshot.overviewReady?'Upload status unavailable':section.empty}</p>}
    {list.map(row=><div className="gcd-transfer" key={row.id} data-download-row={row.id}>
     <div className="gcd-line"><Button className="gcc-utility gcd-control gcd-item" aria-pressed={selected===row.id} onClick={()=>setSelected(selected===row.id?'':row.id)}><Artwork appid={row.appid}/><span className="gcd-info"><strong>{row.title}</strong><span className="gcd-meta">{row.status}{row.percent!==undefined&&(row.section==='active'||row.section==='uploads')?` · ${Math.floor(row.percent)}%`:''}{size(row)?` · ${size(row)}`:''}</span>{row.scheduled&&<span className="gcd-meta">{new Date(row.scheduled*1000).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true})}</span>}{row.finished&&<span className="gcd-meta">{new Date(row.finished*1000).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true})}</span>}{(row.section==='active'||row.section==='uploads')&&<><progress max={100} value={row.percent} aria-label={`${row.title} progress`}/><span className="gcd-meta">{[row.speed?`${formatBytes(row.speed)}/s`:undefined,row.eta!==undefined?formatETA(row.eta):undefined].filter(Boolean).join(' · ')}</span></>}</span></Button>
     {row.action&&<Button className="gcc-utility gcd-control gcd-action" disabled={!!busy} onClick={()=>{void run(row);}}>{busy===row.id?'Please wait…':row.actionLabel}</Button>}</div>
     {selected===row.id&&<div className="gcd-details">{row.error||`${row.status}${size(row)?' · '+size(row):''}`}{!row.action&&row.section!=='completed'&&<span>Additional controls are available through Open Steam downloads.</span>}</div>}
    </div>)}
   </section>;})}
   <p className="gcd-source-note">Local Steam transfers. Cloud sync, workshop and media uploads may not all be reported here.</p>
  </Group></div>
  <div className="gcd-notice" role="status">{notice}</div>
  <footer className="gcd-footer"><span>↑ ↓ Navigate · ← → Actions · A Select · B / Esc Back</span><Group horizontal><div data-download-row="back"><Button className="gcc-utility gcd-control gcd-footer-button" onClick={close}>Back</Button></div><div data-download-row="native"><Button className="gcc-utility gcd-control gcd-footer-button" onClick={native}>Open Steam downloads</Button></div></Group></footer>
 </div>;
}
