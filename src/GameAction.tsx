import {downloadSource,useDownloadTick} from './downloads-live';
import {useEffect,useState} from 'react';
import {gameAction,openGameDownloads} from './game-action';
import {type LibraryApp} from './library-data';
import {launch,openDetails,runningAppId} from './home/upstream/steam';
import {Button} from './home/upstream/components';
export function useGameAction(app:LibraryApp){
 const read=()=>gameAction(window as any,(window as any).appStore?.GetAppOverviewByAppID(app.appid)??app,runningAppId()===app.appid,downloadSource.getSnapshot());
 const [state,setState]=useState(read);
 useDownloadTick(()=>{const next=read();setState(old=>JSON.stringify(old)===JSON.stringify(next)?old:next);},[app.appid]);
 return state;
}
export function GameAction({app,onFocus}:{app:LibraryApp;onFocus?:()=>void}){
 const state=useGameAction(app),[error,setError]=useState('');
 const activate=async(anchor:EventTarget|null)=>{setError('');try{
  const host=window as any,current=host.appStore?.GetAppOverviewByAppID(app.appid)??app;
  const now=gameAction(host,current,runningAppId()===app.appid);
  if(now.kind==='downloads')openGameDownloads(app.appid,anchor as HTMLElement);
  else if(now.kind==='install'){if(typeof host.SteamClient?.Installs?.OpenInstallWizard==='function')await host.SteamClient.Installs.OpenInstallWizard([app.appid]);else openDetails(app);}
  else if(now.kind==='running'||now.kind==='details')openDetails(app);
  else await launch(current);
 }catch(e){setError(e instanceof Error?e.message:'Action unavailable.');}};
 return <div className="gh-primary-action"><Button preferredFocus label={state.label} onActivate={activate} onFocus={onFocus}><span>{state.label}</span>{state.kind==='downloads'&&<progress aria-label={state.label} max={100} value={state.percent}/>}</Button>{error&&<small role="alert">{error}</small>}<style>{`.gh-primary-action{display:flex;flex-direction:column;max-width:40vw}.gh-primary-action .ghd-button{display:flex;flex-direction:column;gap:.6vh;min-width:18vw}.gh-primary-action progress{width:100%;height:3px;appearance:none;border:0;background:#ffffff35}.gh-primary-action progress::-webkit-progress-bar{background:#ffffff35}.gh-primary-action progress::-webkit-progress-value{background:currentColor}.gh-primary-action small{font-size:1vw;margin-top:1vh}`}</style></div>;
}
