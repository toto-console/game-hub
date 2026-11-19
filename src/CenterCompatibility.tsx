import {useEffect,useState} from 'react';
import {callable} from '@decky/api';
import {centerReport} from './center-diagnostics';
import type {ControlCenterStore} from './control-center-entry';
import type {Controls} from './Panel';
const exportReport=callable<[ReturnType<typeof centerReport>],{path:string}>('export_center_diagnostic');
export function CenterCompatibility({controls,store:provided,resolveStore}:{controls:Controls;store?:ControlCenterStore;resolveStore?:()=>ControlCenterStore|undefined}){
 const store=resolveStore?resolveStore():provided;
 const {Button}=controls;const [report,setReport]=useState(centerReport),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{setReport(centerReport());},[]);
 return <><p>Game Hub {report.gameHubVersion} · Decky UI: {report.deckyUI} · PlayHub plugin: {report.playHubPlugin}</p><p>Control Center: {store?store.diagnostic().enabled?'Enabled':'Disabled':'No mounted context'}</p><p>In-game integration: {report.inGameIntegration}</p><p>Home integration: {report.homeIntegration} · Overlay initialization: {report.overlayInitialization}</p>
 <p>Open shortcut: Steam’s native Home / Guide menu request, when the active overlay exposes it. Controller bindings are managed by Steam.</p>
 <p>Home support does not confirm in-game support. Start a game, open Decky in its overlay, then select Game Base Social → Open Control Center. This uses the same window without remapping your controller.</p>
 <p>If Decky is absent from that overlay, Game Hub cannot replace its menu. Keep the original Steam menu available and check the installed PlayHub, Decky and Steam versions.</p>
 <Button className="gcc-utility gcc-setting-row" onClick={()=>setReport(centerReport())}>Refresh compatibility check</Button>
 <Button className="gcc-utility gcc-setting-row" disabled={!store} onClick={()=>{if(!store)return;const opened=store.show();setReport(centerReport());setMessage(opened?'Current-window open check passed. This does not test a physical Guide press.':'Open check failed: '+store.diagnostic().lastResult);}}>Test current-window open action</Button>
 <Button className="gcc-utility gcc-setting-row" disabled={!store} onClick={()=>store?.native()}>Open original Steam menu</Button>
 <Button className="gcc-utility gcc-setting-row" disabled={busy} onClick={async()=>{setBusy(true);try{const current=centerReport();setReport(current);const result=await exportReport(current);setMessage('Saved sanitized report: '+result.path);}catch{setMessage('Could not save report. Check that the Game Hub backend is loaded.');}finally{setBusy(false);}}}>Export compatibility report</Button>
 <p role="status">{message}</p>{report.contexts.map((c,i)=><p key={i}>{c.context}: {c.reason}{'mounted' in c?` · UI ${c.mounted?'mounted':'not mounted'} · menu hook ${c.hooked?'attached':'unavailable'} · last result ${c.lastResult}`:''}</p>)}</>;
}
