import {callable} from '@decky/api';
import {Navigation} from '@decky/ui';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {Controls} from './Panel';
import {focusControl} from './navigation';

type Modes={supported:boolean;current?:string;choices?:string[];preview?:boolean};
const read=callable<[],Modes>('display_modes');
const change=callable<[action:string,key:string],Modes>('display_resolution');
const names:Record<string,string>={'1920x1080':'1080p','2560x1440':'1440p (2K)','3840x2160':'4K UHD'};

export function DisplaySettings({controls:{Button}}:{controls:Controls}){
 const [modes,setModes]=useState<Modes>(),[error,setError]=useState('');
 const mounted=useRef(false),busy=useRef(false),panel=useRef<HTMLDivElement>(null);
 useEffect(()=>{mounted.current=true;let live=true;
  read().then(m=>{if(live)setModes(m)}).catch(e=>{if(live)setError(String(e))});
  return()=>{live=false;mounted.current=false};
 },[]);
 useEffect(()=>{if(!modes?.preview)return;let live=true;
  const timer=setInterval(()=>{read().then(m=>{if(live&&!m.preview)setModes(m)}).catch(()=>{})},1000);
  return()=>{live=false;clearInterval(timer)};
 },[modes?.preview]);
 useLayoutEffect(()=>{if(modes?.preview)focusControl(panel.current?.querySelector('.gcc-utility'));},[modes?.preview]);
 const run=async(action:string,key='')=>{
  if(busy.current)return;busy.current=true;setError('');
  try{const m=await change(action,key);if(mounted.current)setModes(m)}
  catch(e){if(mounted.current)setError(String(e))}finally{busy.current=false}
 };
 const row=(name:string,action:()=>void)=><Button key={name} className="gcc-utility gcc-setting-row" onClick={action}>{name}</Button>;
 return <div ref={panel}>{error&&<p role="alert">{error}</p>}
 {!modes&&!error&&<p>Reading display modes…</p>}
 {modes?.supported===false&&row('Open Steam display settings',()=>Navigation.Navigate('/settings/display'))}
 {modes?.supported&&<><p>Primary display · {modes.current?.replace('x',' × ')}</p>
 {modes.preview?<><p>Keep this resolution? The previous mode returns automatically after 15 seconds.</p>
 {row('Keep resolution',()=>void run('keep'))}{row('Restore previous resolution',()=>void run('restore'))}</>:
 (modes.choices||[]).filter(key=>key in names||key===modes.current).map(key=>row(
 (names[key]||'Display')+' · '+key.replace('x',' × ')+(key===modes.current?' · Current':''),()=>{if(key!==modes.current)void run('preview',key)}))}</>}
 </div>;
}
