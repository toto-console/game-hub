import {openMediaManager} from '../../MediaManager';
import {useMediaPins} from '../../media-pins';
import {launchMediaApp} from '../../media-launch';
import {readLibrary} from '../../library-data';
import {useLibraryRevision} from '../../library-live';
import {landscapeUrls,heroUrls} from '../../library-art';
import {Art} from './components';
import { focusControl } from "../../navigation";
import { Focusable } from "@decky/ui";
import { ReactNode, useState, useRef, useEffect } from "react";
import { MdApps, MdLiveTv, MdVideoLibrary } from "react-icons/md";
import { Tile } from "./components";

export interface MediaUtility { icon: ReactNode; title: string; description: string; go: () => void }
/** Presentation uses the existing Steam focus tree; no independent controller polling. */
let lastMediaSelection:number|string="tv";
export function MediaHome({ utilities, renderLibrary }: { utilities: MediaUtility[]; renderLibrary: () => ReactNode }) {
 const [library,setLibrary]=useState(false);
 const [selected,setSelected]=useState<number|string>(lastMediaSelection);
 const root=useRef<HTMLDivElement>(null);
 // Mounting a preferredFocus child does not transfer Steam's existing focus owner.
 // Transfer once on entry / subview change, never on selection or artwork updates.
 useEffect(()=>{
  const frame=requestAnimationFrame(()=>focusControl(root.current?.querySelector<HTMLElement>(library?'.ghd-card':'.gh-media-picked')));
  return()=>cancelAnimationFrame(frame);
 },[library]);
 const pins=useMediaPins();useLibraryRevision();
 const apps=readLibrary(window as any).entries;
 const [error,setError]=useState('');
 const pending=useRef(false);
 const launch=async(id:number)=>{if(pending.current)return;pending.current=true;setError('');try{await launchMediaApp(id);}catch(e){setError(e instanceof Error?e.message:'Unable to open this shortcut.');}finally{pending.current=false;}};
 const entries=[{id:"all",title:"All Apps",icon:<MdApps/>,description:"Your media apps and Game Hub destinations.",go:()=>openMediaManager()},
 {id:"tv",title:"TV & Video",icon:<MdLiveTv/>,description:"Open your media apps, screenshots and recordings. Add your Steam shortcuts in Settings → Media → Manage Apps.",go:()=>setLibrary(true)},
 ...pins.map(pin=>{const app=apps.find(a=>a.appid===pin.id);return {title:pin.label||app?.display_name||'Unavailable shortcut',icon:<Art sources={[...(pin.icon?[pin.icon]:[]),...(app?landscapeUrls(app):[])]} fallback={<MdApps/>}/>,description:app?'Open your configured Steam application. Use Menu to customize this tile.':'This shortcut is unavailable. Open Manage Apps to reselect it.',go:()=>void launch(pin.id),id:pin.id,background:pin.background||(app?heroUrls(app)[0]:undefined)};}),
 {id:"library",title:"App Library",icon:<MdVideoLibrary/>,description:"Browse your apps and media tools.",go:()=>openMediaManager('manage')}];
 if(library)return <Focusable ref={root} onCancelButton={e=>{e.stopPropagation();setLibrary(false);}}>{renderLibrary()}</Focusable>;
 const pick=entries.find(e=>e.id===selected)??entries[1];
 const background='background' in pick?pick.background:undefined;
 return <Focusable ref={root} className="gh-media" flow-children="column">
 <style>{mediaCSS}</style>
 <div className="gh-media-atmosphere" aria-hidden="true"/>{background&&<div className="gh-media-wallpaper" aria-hidden="true"><Art sources={[background]} /></div>}
 <Focusable className="gh-media-apps ghd-row" flow-children="row">
 {entries.map((entry,i)=><Tile key={entry.id} label={entry.title} preferredFocus={entry.id===pick.id} onFocus={()=>{lastMediaSelection=entry.id;setSelected(entry.id);}} onActivate={entry.go} onMenu={()=>openMediaManager('manage',typeof entry.id==='number'?entry.id:undefined)} className={entry.id===pick.id?"gh-media-picked":""}><div className="gh-media-symbol">{entry.icon}</div></Tile>)}
 </Focusable>
 {error&&<p role="alert" className="gh-media-error">{error}</p>}<div className="gh-media-hero"><h1>{pick.title}</h1><p>{pick.description}</p></div>
 <section className="gh-media-featured"><h2>Your media</h2><Focusable className="ghd-row gh-media-destinations" flow-children="row">
 {utilities.slice(0,2).map(item=><Tile key={item.title} label={item.title} onActivate={item.go}><div className="gh-media-symbol">{item.icon}</div></Tile>)}
 </Focusable>{!pins.length&&<div className="gh-media-note">Make Media your own — add your favorite streaming apps and shortcuts.</div>}</section>
 </Focusable>;
}
const mediaCSS=`
.gh-media{position:absolute;inset:11vh 0 0;color:white;isolation:isolate}
.gh-media-atmosphere{position:absolute;inset:-11vh 0 0;z-index:-1;pointer-events:none;background:linear-gradient(90deg,#030a12 0%,transparent 75%),radial-gradient(ellipse at 85% 38%,#267581 0%,#102e45 35%,#030a12 80%)}
.gh-media-apps{display:flex;gap:1.2vw;padding:1vh 2.6vw 4vh;overflow-x:auto;align-items:flex-start}
.gh-media-apps .ghd-tile{flex:0 0 5.6vw;width:5.6vw;min-width:70px;transition:flex-basis .3s,width .3s}
.gh-media-apps .gh-media-picked{flex-basis:9vw;width:9vw}
.gh-media .ghd-tile-box{width:100%;aspect-ratio:1;height:auto;border-radius:1vw;background:#0c121ad9}
.gh-media-symbol{height:100%;display:flex;align-items:center;justify-content:center;font-size:3.4vw}
.gh-media-apps .ghd-tile-name{visibility:hidden;white-space:nowrap}
.gh-media-apps .gh-media-picked .ghd-tile-name{visibility:visible;font-size:1.8vw}
.gh-media-hero{position:absolute;left:9vw;top:32vh;max-width:52vw;pointer-events:none}
.gh-media-hero h1{font-size:3vw;font-weight:400;margin:0 0 2vh}
.gh-media-hero p{font-size:1.35vw;line-height:1.4;color:#c4cbd1;margin:0}
.gh-media-featured{position:absolute;left:9vw;right:3vw;bottom:2vh}
.gh-media-featured h2{font-size:1.3vw;font-weight:400}
.gh-media-destinations{display:flex;gap:1.6vw;overflow-x:auto;padding:1vh}
.gh-media-destinations .ghd-tile{flex:0 0 12.3vw;width:12.3vw}
.gh-media-destinations .ghd-tile-box{aspect-ratio:16/9}
.gh-media-error{position:absolute;top:23vh;left:9vw;color:#ffcece}
.gh-media-wallpaper{position:absolute;inset:-11vh 0 0;z-index:-1;pointer-events:none;opacity:.5}
.gh-media-wallpaper img{width:100%;height:100%;object-fit:cover}
.gh-media-symbol img{width:100%;height:100%;object-fit:contain}
.gh-media-picked .ghd-tile-name{opacity:1!important}
.gh-media-note{font-size:1vw;color:#aab6c3}
@media(prefers-reduced-motion:reduce){.gh-media-apps .ghd-tile{transition:none}}
`;
