import {T} from "./i18n";
import {useEffect,useRef,useState} from 'react';
import type {Controls} from './Panel';
import {cachedNews,chooseNews,loadCenterNews,newsIsCached,type CenterNews} from './center-news';
import {recentGames} from './game-adapter';
export function GameNewsCard({controls,active,open}:{controls:Controls;active:boolean;open:(url:string)=>void}){
 const {Button}=controls,ref=useRef<HTMLDivElement>(null);
 const [story,setStory]=useState<CenterNews|undefined>(()=>chooseNews(cachedNews())),[status,setStatus]=useState('Loading Steam news…');
 const rows=useRef(cachedNews());
 const [expanded,setExpanded]=useState(false);
 useEffect(()=>{if(!active)return;let stopped=false;
  const refresh=async()=>{try{const relevant=recentGames().filter(g=>!g.shortcut).map(g=>({appid:g.id,game:g.name}));const next=await loadCenterNews(relevant);if(stopped)return;rows.current=next;setStatus(next.length?(newsIsCached()?'Cached Steam news':'Steam'):'Steam news unavailable');setStory(current=>!current||!ref.current?.contains(ref.current.ownerDocument.activeElement)?chooseNews(next):current);}catch{if(!stopped)setStatus('Steam news unavailable');}};
  void refresh();const timer=setInterval(()=>void refresh(),30*60*1000);return()=>{stopped=true;clearInterval(timer);};
 },[active]);
 useEffect(()=>{const el=ref.current;if(!el)return;const next=(e:Event)=>{const k=e as KeyboardEvent;if(e.type==='keydown'&&k.key!=='ContextMenu')return;e.preventDefault();e.stopPropagation();if(k.repeat||(e as CustomEvent).detail?.is_repeat)return;if(expanded)setStory(chooseNews(rows.current));setExpanded(true);};const collapse=()=>setExpanded(false);el.addEventListener('gcc_news_collapse',collapse);el.addEventListener('vgp_onmenu',next);el.addEventListener('keydown',next);return()=>{el.removeEventListener('gcc_news_collapse',collapse);el.removeEventListener('vgp_onmenu',next);el.removeEventListener('keydown',next);};},[expanded]);
 return <div className="gcc-news-wrap" ref={ref} data-news-expanded={expanded}><Button className="gcc-card gcc-news" aria-label={story?`Game News: ${story.headline}. ${story.category}. Menu for details and more stories.`:'Game News unavailable'} onClick={()=>{if(story)open(story.url);}}>
 {story?.image&&<img key={story.image} className="gcc-news-art" src={story.image} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={e=>{e.currentTarget.style.visibility='hidden';}}/>}
 <span className="gcc-news-shade" aria-hidden="true"/><small className="gcc-news-label"><T text="Game News"/></small><span className="gcc-news-content">{story?<><span className="gcc-news-category">{story.category==='New Releases'?'New Release':story.category}</span><strong>{story.game}</strong>{story.headline!==story.game&&<span className="gcc-news-headline">{story.headline}</span>}<span className="gcc-news-date">{story.date||'Steam Store'}{status==='Cached Steam news'?' · Cached':''}</span></>:<span className="gcc-news-headline" role="status">{status}</span>}</span>
 </Button></div>;
}
