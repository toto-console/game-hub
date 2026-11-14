import {T} from "./i18n";
import {useEffect,useState,useRef} from 'react';
import {callable} from '@decky/api';
import {Router,Navigation} from '@decky/ui';
import type {Controls} from './Panel';
import {updateCall,loaderVersion,type UpdateStatus} from './software-updates';
export function SoftwareUpdate({controls,decky}:{controls:Controls;decky:()=>void}){
 const {Button}=controls;const alive=useRef(true);const [state,setState]=useState<UpdateStatus>(),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notes,setNotes]=useState(false);
 useEffect(()=>{alive.current=true;let stopped=false;updateCall('status').then(s=>{if(!stopped)setState(s);},()=>{if(!stopped)setError('Update service unavailable. Use Decky settings.');});return()=>{stopped=true;alive.current=false;};},[]);
 const run=async(action:string,channel=state?.channel,auto=state?.autoCheck)=>{setBusy(true);setError('');try{setState(await updateCall(action,await loaderVersion(),channel,auto));}catch{setError('Update operation failed. Your current installation is unchanged.');}finally{setBusy(false);}};
 const install=async()=>{setBusy(true);setError('');try{
  const host=window as any;
  if(!host.DeckyBackend?.call||!host.DeckyPluginLoader?.updateVersion)throw Error('Native Decky installation is unavailable.');
  if(Router.MainRunningApp?.appid)throw Error('Close the running game before updating.');
  const data=await callable<[action:string,loader:string],{path:string;version:string;hash:string}>('software_update')('prepare',await loaderVersion());
  if(alive.current)setError(`Download verified and rollback saved. When games, calls and downloads are finished, use Decky’s Install Plugin from ZIP: ${data.path}. SHA-256: ${data.hash}`);
 }catch(e){setError(e instanceof Error?e.message:'Could not prepare the update. Use Decky settings.');}finally{setBusy(false);}};
 return <div><h3>Decky Direct Updater</h3>
 <p>Update Game Hub through Decky using the optional community Direct Updater. Our installed name remains Game Base Social; the official repository is toto-console/game-hub.</p>
 <p>Experimental releases require manual selection: open Direct Updater → All → Game Base Social → Install another version. Confirm toto-console/game-hub if asked for a source. Stable automatic checks do not offer experimental releases.</p>
 <p>First installation: use the Game-Base-Social.zip asset from Official releases below. Direct Updater currently searches for stable installable releases, so its search cannot install our prerelease-only project yet.</p>
 <p>Install Direct Updater once: Decky Settings → General → Developer Mode; then Developer → Install Plugin from URL: https://deckyup.nukeador.com/install.zip. Review Decky’s confirmation. No GitHub token is required.</p>
 <Button className="gcc-utility" onClick={decky}>Open Decky · Select Direct Updater</Button>
 <Button className="gcc-utility" onClick={()=>Navigation.NavigateToExternalWeb('https://deckyup.nukeador.com/en/')}>Direct Updater installation guide</Button>
 <p>Use Back Up Current Version and Settings before updating. Decky handles installation and confirmation. Direct Updater is optional and separate from the official Decky Store; this does not indicate Store approval.</p>
 <h3>Game Hub update checks and recovery</h3><p>Current version: {state?.current??'Loading…'}</p><p>{state?.platform} · Decky {state?.loader||'version checked when checking for updates'}</p><p role="status">{error||state?.result?.message||(state?.result?.status==='available'?`Update available: ${state.result.version}`:'Ready to check for updates.')}</p>
 <Button className="gcc-utility" disabled={busy||!state} onClick={()=>void run('check')}>{busy?'Working…':'Check for Updates'}</Button>
 <Button className="gcc-utility" disabled={busy||!state} onClick={()=>void run('preferences',state?.channel==='stable'?'beta':'stable')}>Channel: {state?.channel??'stable'}</Button>
 <Button className="gcc-utility" disabled={busy||!state} onClick={()=>void run('preferences',state?.channel,!state?.autoCheck)}>Automatic checks: {state?.autoCheck?<T text="On"/>:<T text="Off"/>}</Button>
 <p>Automatic installation is unavailable until safe idle detection and loader recovery are verified. Installation is manual through Decky. Game Hub never restarts Steam or installs updates itself. Finish voice calls and downloads before installing.</p>
 {state?.result?.status==='available'&&<><Button className="gcc-utility" disabled={busy} onClick={()=>void install()}>Update Now · Download Verified Update</Button><Button className="gcc-utility" onClick={()=>setNotes(!notes)}>View Changelog</Button>{notes&&<p style={{whiteSpace:'pre-wrap'}}>{state.result.changelog}</p>}</>}
 <Button className="gcc-utility" disabled={busy||!state} onClick={()=>void run('backup')}>Back Up Current Version and Settings</Button><p>Last successful update: {state?.lastSuccess?`${state.lastSuccess.version} · ${new Date(state.lastSuccess.time*1000).toLocaleString()}`:'Not tracked for manual installations'}</p>
 {state?.recovery&&<p>Restore previous version: use Decky’s Install Plugin from ZIP with {state.recovery}. The matching settings backup is beside it. This recovery works even if Game Hub cannot open.</p>}
 <Button className="gcc-utility" onClick={decky}>Open Decky Manager / Recovery</Button><Button className="gcc-utility" onClick={()=>Navigation.NavigateToExternalWeb('https://github.com/toto-console/game-hub/releases')}>Official releases</Button>
 </div>;
}
