import {motionAllowed} from './focus-motion';
import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import type {Controls} from './Panel';
import {focusControl} from './navigation';
import {loadGameActivity,suspendCapability,type GameActivityData,type ActivityAchievement} from './game-activity-adapter';
export function useGameActivity(id?:number){
 const [state,setState]=useState<{id?:number;data?:GameActivityData;error?:string}>({id});
 useEffect(()=>{let cancelled=false;setState({id});if(id)loadGameActivity(id).then(data=>{if(!cancelled)setState({id,data});},()=>{if(!cancelled)setState({id,error:'Game information is unavailable.'});});return()=>{cancelled=true;};},[id]);
 return state.id===id?state:{id};
}
export function GameAsset({sources,className,style,lazy=false}:{sources:string[];className?:string;style?:CSSProperties;lazy?:boolean}){
 const key=sources.join('|'),[failure,setFailure]=useState({key,index:0});const index=failure.key===key?failure.index:0;
 return sources[index]?<img key={sources[index]} src={sources[index]} className={className} style={style} alt="" draggable={false} loading={lazy?'lazy':'eager'} decoding="async" onError={()=>setFailure({key,index:index+1})}/>:null;
}
export function GameActivity({controls,data,error,title,resume,exitGame,toDock,onModal}:{controls:Controls;data?:GameActivityData;error?:string;title:string;resume:()=>void;exitGame?:()=>void|Promise<void>;toDock:()=>void;onModal:(open:boolean)=>void}){
 const {Button,Group}=controls,root=useRef<HTMLDivElement>(null),row=useRef<HTMLDivElement>(null);
 const [selected,setSelected]=useState(0),[options,setOptions]=useState(false),[detail,setDetail]=useState<ActivityAchievement>();
 const [confirmExit,setConfirmExit]=useState(false),[exitError,setExitError]=useState('');const exiting=useRef(false);const [exitPending,setExitPending]=useState(false);
 const selectedRef=useRef(0),returnIndex=useRef(0),restoring=useRef(false),restoreFrame=useRef(0),scroll=useRef(0),latest=useRef({options,detail,confirmExit});latest.current={options,detail,confirmExit};
 const scrollFrame=useRef(0);
 const cards=()=>Array.from(row.current?.querySelectorAll<HTMLElement>('.ga-card')??[]);
 const reveal=(el:HTMLElement|undefined)=>{const listBox=row.current;if(el&&listBox){const margin=Math.max(20,el.offsetWidth*.035);const left=el.offsetLeft-margin,right=el.offsetLeft+el.offsetWidth+margin;const target=right>listBox.scrollLeft+listBox.clientWidth?right-listBox.clientWidth:left<listBox.scrollLeft?left:listBox.scrollLeft;cancelAnimationFrame(scrollFrame.current);const from=listBox.scrollLeft,to=Math.max(0,Math.min(listBox.scrollWidth-listBox.clientWidth,target));if(!motionAllowed(listBox)||restoring.current){listBox.scrollLeft=to;}else{const start=performance.now();const step=(now:number)=>{const t=Math.min(1,(now-start)/220);listBox.scrollLeft=from+(to-from)*(1-Math.pow(1-t,3));if(t<1)scrollFrame.current=requestAnimationFrame(step);};scrollFrame.current=requestAnimationFrame(step);}}};
 const focus=(n:number)=>{const list=cards(),index=Math.max(0,Math.min(list.length-1,n));selectedRef.current=index;setSelected(index);const el=list[index];focusControl(el);reveal(el);};
 const close=()=>{const index=returnIndex.current,top=scroll.current;restoring.current=true;setOptions(false);setConfirmExit(false);setExitError('');setDetail(undefined);onModal(false);cancelAnimationFrame(restoreFrame.current);restoreFrame.current=requestAnimationFrame(()=>{restoreFrame.current=requestAnimationFrame(()=>{focus(index);if(row.current)row.current.scrollLeft=top;restoring.current=false;});});};
 const openOptions=()=>{returnIndex.current=selectedRef.current;scroll.current=row.current?.scrollLeft??0;setOptions(true);onModal(true);};
 const show=(a:ActivityAchievement)=>{returnIndex.current=selectedRef.current;scroll.current=row.current?.scrollLeft??0;setDetail(a);onModal(true);};
 useEffect(()=>{const el=row.current;if(!el)return;const Resize=el.ownerDocument.defaultView?.ResizeObserver;if(!Resize)return;const observer=new Resize(()=>{const active=el.ownerDocument.activeElement as HTMLElement;if(active?.matches('.ga-card')&&el.contains(active))reveal(active);});observer.observe(el);return()=>observer.disconnect();},[]);
 useEffect(()=>()=>{cancelAnimationFrame(restoreFrame.current);cancelAnimationFrame(scrollFrame.current);onModal(false);},[]);
 useLayoutEffect(()=>{if(!options&&!detail)return;const f=requestAnimationFrame(()=>focusControl(root.current?.querySelector<HTMLElement>('.ga-popover button,.ga-detail button')));return()=>cancelAnimationFrame(f);},[options,detail,confirmExit]);
 useEffect(()=>{const el=root.current;if(!el)return;const handle=(e:Event)=>{
  const key=e as KeyboardEvent,d=(e as CustomEvent).detail,menu=e.type==='vgp_onmenu'||key.key==='ContextMenu',back=e.type==='vgp_oncancel'||key.key==='Escape';
  const direction=e.type==='vgp_ondirection'?d?.button:({ArrowUp:9,ArrowDown:10,ArrowLeft:11,ArrowRight:12} as Record<string,number>)[key.key];
  if(!menu&&!back&&!direction&&key.key!=='Tab')return;e.preventDefault();e.stopImmediatePropagation();
  if((menu||back)&&(key.repeat||d?.is_repeat))return;
  if(back){if(latest.current.confirmExit){setConfirmExit(false);setExitError('');return;}if(latest.current.options||latest.current.detail)close();else toDock();return;}
  if(latest.current.options||latest.current.detail){const buttons=Array.from(el.querySelectorAll<HTMLElement>('.ga-popover button:not(:disabled),.ga-detail button:not(:disabled)'));const index=buttons.indexOf(el.ownerDocument.activeElement as HTMLElement);focusControl(buttons[Math.max(0,Math.min(buttons.length-1,index+(direction===9||key.shiftKey?-1:1)))]);return;}
  if(menu){if(selectedRef.current===0)openOptions();else {const a=data?.achievements[selectedRef.current-1];if(a)show(a);}return;}
  if(direction===10){toDock();return;}if(direction===9)return;focus(selectedRef.current+(direction===11||key.shiftKey?-1:1));
 };const track=(e:Event)=>{if(restoring.current)return;const card=(e.target as HTMLElement).closest<HTMLElement>('.ga-card');const n=card?cards().indexOf(card):-1;if(n>=0){selectedRef.current=n;setSelected(n);reveal(card!);}};
 for(const t of ['keydown','vgp_ondirection','vgp_oncancel','vgp_onmenu'])el.addEventListener(t,handle,true);for(const t of ['focusin','vgp_onfocus'])el.addEventListener(t,track,true);
 return()=>{for(const t of ['keydown','vgp_ondirection','vgp_oncancel','vgp_onmenu'])el.removeEventListener(t,handle,true);for(const t of ['focusin','vgp_onfocus'])el.removeEventListener(t,track,true);};},[data,controls]);
 return <div ref={root} className="gcc-game-zone" onContextMenu={e=>{if((e.target as HTMLElement).closest('.ga-game')){e.preventDefault();openOptions();}}}>
  <div ref={row} className="ga-carousel" inert={options||!!detail}><Group horizontal className="ga-track">
   <Button className={`gcc-card ga-card ga-game${options?' ga-origin':''}`} onClick={resume}><GameAsset sources={data?.covers??[]} className="ga-cover"/><div className="ga-shade"/><GameAsset sources={data?.covers.length?[]:data?.logos??[]} className="ga-logo"/><div className="ga-copy"><small>Resume</small><strong>{title}</strong></div></Button>
   {data?.achievements.map((a,i)=><Button key={a.id} className={`gcc-card ga-card ga-achievement${detail?.id===a.id?' ga-origin':''}`} onClick={()=>show(a)} aria-label={`${a.name} · ${a.done?'Unlocked':'Locked'}`}>
    {Math.abs(i+1-selected)<7&&<><GameAsset sources={data.shots.length?[data.shots[i%data.shots.length]]:data.heroes} className="ga-cover" lazy/>{a.image&&<img className="ga-achievement-icon" src={a.image} alt="" loading="lazy" decoding="async"/>}</>}
    <div className="ga-shade"/>{!a.image&&<span className="ga-hidden-icon" aria-hidden="true">◇</span>}
    <div className="ga-copy"><small>{a.done?'Unlocked':'Locked'} · Achievement</small><strong>{a.name}</strong><span>{a.description}</span></div>
   </Button>)}
  </Group></div>
  {(error||data?.warning||data&&!data.achievements.length)&&<p className="ga-status">{error||data?.warning||'No achievements reported for this game.'}</p>}
  {options&&<section className="ga-popover" aria-label={confirmExit?'Confirm exit game':'Game options'}>{confirmExit?<><p>Exit {title}? This ends the session. Unsaved progress may be lost. It does not suspend the game.</p><Button className="gcc-utility" onClick={()=>{setConfirmExit(false);setExitError('');}}>Cancel</Button><Button className="gcc-utility" disabled={exitPending} onClick={async()=>{if(exiting.current||!exitGame)return;exiting.current=true;setExitPending(true);setExitError('');try{await exitGame();}catch(e){if(root.current)setExitError(e instanceof Error?e.message:'Exit Game failed.');}finally{exiting.current=false;if(root.current)setExitPending(false);}}}>{exitPending?'Exiting…':'Exit Game'}</Button>{exitError&&<p role="alert">{exitError}</p>}</>:<><Button className="gcc-utility" onClick={resume}>Resume</Button><button type="button" className="gcc-utility" disabled aria-describedby="ga-suspend-reason">Suspend</button>{exitGame&&<Button className="gcc-utility" onClick={()=>setConfirmExit(true)}>Exit Game…</Button>}<p id="ga-suspend-reason">{suspendCapability.reason}</p></>}</section>}
  {detail&&<section className="ga-detail" aria-label="Achievement details">{detail.image&&<img src={detail.image} alt=""/>}<small>{detail.done?'Unlocked':'Locked'} · Steam achievement</small><h2>{detail.name}</h2><p>{detail.description}</p>{detail.unlocked>0&&<p>Unlocked {new Date(detail.unlocked*1000).toLocaleDateString()}</p>}{detail.current!==undefined&&detail.max!==undefined&&<p>{detail.current} / {detail.max}</p>}{detail.rarity!==undefined&&<p>{detail.rarity.toFixed(1)}% of players</p>}<Button className="gcc-utility" onClick={close}>Back</Button></section>}
 </div>;
}
export const gameActivityCSS=`
#game-hub-control-center[data-game=true]{background:#091524!important;backdrop-filter:none;font-family:Arial,sans-serif}
#game-hub-control-center[data-live-game=true]{background:var(--ga-live-shade)!important}
#game-hub-control-center[data-live-game=true] .ga-background,#game-hub-control-center[data-live-game=true] .ga-background-shade{display:none}
.FullModalOverlay:has(#game-hub-control-center[data-live-game=true]) .ModalOverlayBackground{background:transparent!important;backdrop-filter:none!important;animation:none!important;transition:none!important}
#game-hub-control-center .ga-background{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;pointer-events:none;z-index:-2}
#game-hub-control-center .ga-background-shade{position:absolute;inset:0;pointer-events:none;z-index:-1;background:var(--ga-cinematic-shade)}
#game-hub-control-center[data-game=true] .gcc-cards{left:3.45%;top:29.8%;width:96.55%;height:45%;overflow:visible}
#game-hub-control-center .gcc-game-zone{position:relative;width:100%;height:100%}
#game-hub-control-center .ga-carousel{width:100%;height:100%;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;padding:5vh 1.5vw 1.2vh 1vw;scroll-behavior:auto;scroll-padding:2vw;position:relative}
#game-hub-control-center .ga-carousel::-webkit-scrollbar{display:none}
#game-hub-control-center .ga-track{display:flex!important;align-items:flex-end!important;gap:1.1vw!important;height:100%;width:max-content;padding-right:2vw}
#game-hub-control-center .ga-card{flex:none!important;width:14.35vw!important;height:33.5vh!important;padding:0!important;border-radius:1.15vw!important;background:#0b1620!important;border:1px solid #c6ddf14d!important;box-shadow:none!important;text-align:left!important}
#game-hub-control-center .ga-card.ga-game{width:21.6vw!important;height:37.8vh!important}
#game-hub-control-center .ga-card:is(:focus,.gbs-focus,.gpfocus,.ga-origin){border-color:white!important;box-shadow:0 0 0 1px white,0 0 14px #c0e2ff70!important}
#game-hub-control-center .ga-cover{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.9}
#game-hub-control-center .ga-shade{position:absolute;inset:0;background:linear-gradient(0deg,#07121df7 0%,#07121dd9 29%,#07121d48 68%,#07121d08)}
#game-hub-control-center .ga-game .ga-cover{object-position:center bottom}
#game-hub-control-center .ga-game .ga-shade{background:linear-gradient(0deg,#07121d 0%,#07121de0 22%,transparent 70%)}
#game-hub-control-center .ga-logo{position:absolute;width:86%;max-height:18%;object-fit:contain;left:7%;bottom:26%}
#game-hub-control-center .ga-achievement-icon,#game-hub-control-center .ga-hidden-icon{position:absolute;z-index:1;top:28%;left:29%;width:42%;height:30%;object-fit:contain}
#game-hub-control-center .ga-hidden-icon{display:grid;place-items:center;font-size:4vw;color:#e2e8f0}
#game-hub-control-center .ga-copy{position:absolute;bottom:2.2vh;left:1.35vw;right:1vw;display:flex;flex-direction:column;gap:.7vh}
#game-hub-control-center .ga-copy small{font-size:1.04vw;color:#c9cdd2;line-height:1.2}
#game-hub-control-center .ga-copy strong{font-size:1.35vw;line-height:1.2;font-weight:400;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
#game-hub-control-center .ga-copy span{font-size:.88vw;color:#c9cdd2;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
#game-hub-control-center .ga-game .ga-copy strong{font-size:1.4vw}
#game-hub-control-center .ga-popover{position:absolute;z-index:4;left:18%;top:0;width:14.6vw;padding:.45vw;background:#142431f5;border:1px solid #cbdaee66;border-radius:.85vw;box-shadow:0 8px 25px #0006}
#game-hub-control-center .ga-popover .gcc-utility{display:block!important;width:100%!important;padding:.7vw .9vw!important;font-size:1.4vw!important;border:1px solid transparent!important;border-radius:.2vw!important}
#game-hub-control-center .ga-popover .gcc-utility:focus,#game-hub-control-center .ga-popover .gbs-focus{border-color:white!important;outline:none!important;box-shadow:inset 0 0 8px #b3d7ff55!important;background:#b3d7ff18!important}
#game-hub-control-center .ga-popover .gcc-utility:disabled{opacity:.5!important}
#game-hub-control-center .ga-popover p{font-size:.73vw;color:#bec7d4;line-height:1.3;padding:.1vw .7vw;margin:.5vh 0}
#game-hub-control-center .ga-detail{position:fixed;inset:20% 30% 23%;z-index:5;padding:2.2vw;background:#111f2cf5;border:1px solid #cfdeef80;border-radius:1vw;color:white}
#game-hub-control-center .ga-detail img{width:6vw;height:6vw;object-fit:contain;display:block;margin-bottom:2vh}
#game-hub-control-center .ga-detail h2{font-size:2vw;margin:1vh 0}#game-hub-control-center .ga-detail p{font-size:1.1vw}#game-hub-control-center .ga-detail small{font-size:1vw;color:#bac7d6}
#game-hub-control-center .ga-status{position:absolute;top:100%;font-size:1vw;color:#c4cfdd}
#game-hub-control-center[data-game=true] .gcc-dock{left:9.4%;right:11.5%;top:81.8%;height:10.7%}
#game-hub-control-center .gcc-dock-item>.ga-dock-cover{position:absolute;inset:7%;width:86%!important;height:86%!important;object-fit:cover;border-radius:50%;pointer-events:none}
#game-hub-control-center[data-game=true] .gcc-dock-label{font-size:1.5vw;max-width:16vw;overflow:hidden;text-overflow:ellipsis}
#game-hub-control-center[data-game=true] .gcc-selected{border-color:white!important;box-shadow:0 0 9px #dbe7ff55!important}
#game-hub-control-center .ga-options-hint{position:absolute;right:2.8%;bottom:3.5%;display:flex;gap:.5vw;align-items:center;font-size:1.3vw;color:white;pointer-events:none}
#game-hub-control-center .ga-options-hint svg{width:1.7vw;height:1.3vw}
#game-hub-control-center[data-game=true] footer{bottom:.4%;font-size:.72vw;opacity:.4}
`;
