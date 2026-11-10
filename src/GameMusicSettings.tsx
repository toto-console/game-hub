import {useEffect,useRef,useState} from 'react';
import {DialogButton,Focusable,Navigation,useParams} from '@decky/ui';
import type {Controls} from './Panel';
import {saveSoundtrackPreferences,soundtrackPreferences,themeDeckStatus,themeDeckCall,SOUNDTRACK_EVENT} from './themedeck-adapter';
import {decky} from './decky-adapter';
import {themeIdentity} from './soundtrack-coordinator';
export const GAME_MUSIC_ROUTE='/game-hub/music';
export function openGameMusic(appid?:number){window.dispatchEvent(new Event("game-hub:open-music"));Navigation.CloseSideMenus?.();Navigation.Navigate(appid?`${GAME_MUSIC_ROUTE}/${appid}`:GAME_MUSIC_ROUTE);}
export function openThemeDeck(){const s=themeDeckStatus();if(!s.loaded)throw Error(s.reason);decky()?.deckyState.setActivePlugin('ThemeDeck');Navigation.OpenQuickAccessMenu(999);}
export function GameMusicSettings({controls,appid,close}:{controls:Pick<Controls,'Button'|'Group'>;appid?:number;close?:()=>void}){
 const {Button,Group}=controls;const [prefs,setPrefs]=useState(soundtrackPreferences),[status,setStatus]=useState(themeDeckStatus),[track,setTrack]=useState<any>(),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[confirm,setConfirm]=useState(false);
 const alive=useRef(true),preview=useRef<ReturnType<typeof themeDeckStatus>['bridge']>(undefined);
 useEffect(()=>{alive.current=true;const refresh=()=>{setPrefs(soundtrackPreferences());setStatus(themeDeckStatus());};const timer=setInterval(refresh,1000);window.addEventListener(SOUNDTRACK_EVENT,refresh);return()=>{alive.current=false;clearInterval(timer);window.removeEventListener(SOUNDTRACK_EVENT,refresh);if(appid)preview.current?.stopPreview(appid);};},[appid]);
 useEffect(()=>{let active=true;const refresh=()=>{if(!appid||!status.loaded||status.version!=='3.3.7')return;void themeDeckCall('get_track',appid).then(t=>{if(active)setTrack(t);},()=>{if(active)setNotice('Could not read the assigned track. Open ThemeDeck to check it.');});};refresh();window.addEventListener('themedeck:tracks-updated',refresh);return()=>{active=false;window.removeEventListener('themedeck:tracks-updated',refresh);};},[appid,status.loaded,status.version]);
 const run=async(fn:()=>unknown)=>{if(busy)return;setBusy(true);setNotice('');try{await fn();}catch(e){if(alive.current)setNotice(e instanceof Error?e.message:'Music control unavailable.');}finally{if(alive.current)setBusy(false);}};
 const save=(next:typeof prefs)=>void run(()=>{saveSoundtrackPreferences(next);setPrefs(next);});
 const row=(label:string,fn:()=>unknown,disabled=false)=><Button className="gcc-utility gcc-setting-row" disabled={busy||disabled} onClick={()=>void run(fn)}>{label}</Button>;
 const native=status.bridge?.settings();const allowed=!!status.bridge;
 return <Group className="gcc-vertical-list gh-music-settings"><h2>{appid?'Game Music':'ThemeDeck — Game Soundtracks'}</h2><p>{status.reason}</p>{notice&&<p role="status">{notice}</p>}
 {appid?<><p>{track?.filename||'No soundtrack assigned.'}</p>{row(`Music for this game in Game Hub: ${prefs.disabledGames.includes(appid)?'Off':'On'}`,()=>{const next={...prefs,disabledGames:prefs.disabledGames.includes(appid)?prefs.disabledGames.filter(id=>id!==appid):[...prefs.disabledGames,appid]};saveSoundtrackPreferences(next);setPrefs(next);})}
 {row('Choose / change Game Music · ThemeDeck editor',()=>{Navigation.Navigate(`/themedeck/${appid}`);Navigation.CloseSideMenus?.();},!status.loaded||status.version!=='3.3.7')}
 <small>ThemeDeck’s editor provides local files, downloaded tracks, YouTube search and previews. Back returns here.</small>
 {row('Preview assigned track',async()=>{if(!await status.bridge?.preview(appid))throw Error('Preview unavailable while a game or other media is active.');preview.current=status.bridge;},!allowed||!track)}
 {row('Stop preview',()=>{preview.current?.stopPreview(appid);preview.current=undefined;},!allowed)}
 <p>Per-game volume: {track?`${Math.round((track.volume??1)*100)}%`:'—'}</p>
 {row('Lower per-game volume',()=>themeDeckCall('set_volume',appid,Math.max(0,(track?.volume??1)-.05)),!track)}
 {row('Raise per-game volume',()=>themeDeckCall('set_volume',appid,Math.min(1,(track?.volume??1)+.05)),!track)}
 {row(`Repeat: ${track?.loop!==false?'On':'Off'}`,()=>themeDeckCall('set_loop',appid,track?.loop===false),!track)}
 <p>Playlists are not supported by this ThemeDeck version.</p>
 {row(confirm?'Confirm remove assignment (audio file retained)':'Remove assignment',async()=>{if(!confirm){setConfirm(true);return;}await themeDeckCall('remove_track',appid);setConfirm(false);},!track)}
 </>:<>
 {row(`Enable Game Soundtracks in Game Hub: ${prefs.enabled?'On':'Off'}`,()=>{const next={...prefs,enabled:!prefs.enabled};saveSoundtrackPreferences(next);setPrefs(next);})}
 {row(`Play on game highlight: ${prefs.highlight?'On':'Off'}`,()=>{const next={...prefs,highlight:!prefs.highlight};saveSoundtrackPreferences(next);setPrefs(next);})}
 <p>Library browsing is silent. Game music plays on Home highlights and game detail pages.</p>
 {row(`Smooth transitions: ${prefs.smooth?'On':'Off'}`,()=>{const next={...prefs,smooth:!prefs.smooth};saveSoundtrackPreferences(next);setPrefs(next);})}
 {row(`ThemeDeck autoplay: ${native?.autoPlay?'On':'Off'}`,()=>status.bridge?.setAutoPlay(!native?.autoPlay),!allowed)}
 <p>Game music master volume: {native?`${Math.round(native.volume*100)}%`:'Open ThemeDeck settings'}</p>
 {row('Lower game music volume',()=>status.bridge?.setVolume(Math.max(0,(native?.volume??1)-.05)),!allowed)}
 {row('Raise game music volume',()=>status.bridge?.setVolume(Math.min(1,(native?.volume??1)+.05)),!allowed)}
 <p>Respect Now Playing: On · ThemeDeck also yields to gameplay and audible Steam media.</p>
 <p>Configure Game Music from a game’s Start/Menu options. Assignments are shared with Steam’s native library.</p>
 </>}
 {status.installed?row('Open ThemeDeck settings · original controls',openThemeDeck,!status.loaded):<>{row('Install ThemeDeck · view verified instructions',()=>Navigation.NavigateToExternalWeb(status.windows?'https://github.com/LoZazaMastro/ThemeDeck-Windows/releases/latest':'https://github.com/BrenticusMaximus/ThemeDeck/releases'))}<p>Installation is manual. Choose the package for your platform; Game Hub does not install plugins automatically.</p>{close&&row('Not Now',close)}</>}
 {close&&row('Back',close)}</Group>;
}
const routeControls:Pick<Controls,'Button'|'Group'>={Button:({children,...props})=><DialogButton {...props}>{children}</DialogButton>,Group:({children,onBack,horizontal,...props})=><Focusable {...props} flow-children={horizontal?'row':'column'} onCancel={onBack?()=>onBack():undefined}>{children}</Focusable>};
export function GameMusicRoute(){const params=useParams<{appid?:string}>();const id=themeIdentity(Number(params.appid));return <div className="gcc-settings gh-music-route"><style>{`.gh-music-route{position:absolute;inset:0;padding:5vh 8vw;overflow:auto;background:linear-gradient(130deg,#151e2b,#05080e);color:white}.gh-music-settings{display:flex;flex-direction:column;gap:10px;max-width:900px}.gh-music-settings .gcc-setting-row{min-height:44px;text-align:left;border-radius:12px;background:#ffffff12;color:white}.gh-music-settings .gcc-setting-row:focus,.gh-music-settings .gpfocus{outline:2px solid white;background:#ffffff25}`}</style><GameMusicSettings controls={routeControls} appid={id??undefined} close={()=>Navigation.NavigateBack()}/></div>;}
