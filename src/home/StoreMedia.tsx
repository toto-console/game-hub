import {StoreAction} from './StoreAction';
import Hls from 'hls.js';
import {useRef,useEffect,useState} from 'react';
import {Focusable} from '@decky/ui';
import {focusNavigation} from '../navigation';
export type MediaItem={name:string;url:string;thumb:string;video:boolean};
export function mediaItems(d:any):MediaItem[]{
 return [...(d?.movies||[]).map((m:any)=>({name:m.name,url:m.mp4?.max||m.webm?.max||m.mp4?.['480']||m.hls_h264,thumb:m.thumbnail,video:true})),...(d?.screenshots||[]).map((s:any,i:number)=>({name:'Screenshot '+(i+1),url:s.path_full,thumb:s.path_thumbnail,video:false}))].filter(x=>typeof x.url==='string'&&x.url.startsWith('https://'));
}
export function MediaViewer({items,index,select,close}:{items:MediaItem[];index:number;select:(n:number)=>void;close:()=>void}){
 const root=useRef<HTMLDivElement>(null),video=useRef<HTMLVideoElement>(null),item=items[index];
 useEffect(()=>{focusNavigation(root.current?.querySelector('.cs-control'))},[index]);
 const [error,setError]=useState('');
 useEffect(()=>{
  const el=video.current;setError('');
  if(!el||!item?.video)return;
  let stream:Hls|undefined;
  if(new URL(item.url).pathname.endsWith('.m3u8')&&!el.canPlayType('application/vnd.apple.mpegurl')){
   if(!Hls.isSupported()){setError('This client cannot play this trailer.');return;}
   stream=new Hls({enableWorker:false,maxBufferLength:15});
   stream.on(Hls.Events.ERROR,(_,data)=>{if(data.fatal)setError('Steam trailer failed to load: '+data.details)});
   stream.loadSource(item.url);stream.attachMedia(el);
  }else el.src=item.url;
  return()=>{el.pause();stream?.destroy();el.removeAttribute('src');el.load()};
 },[item?.url,item?.video]);
 if(!item)return null;
 const button=(label:string,fn:()=>void)=><StoreAction noFocusRing className="cs-control" focusClassName="cs-focus" onActivate={fn}>{label}</StoreAction>;
 return <div className="cs-viewer" ref={root} role="dialog" aria-label={item.name}>
 {item.video?<video key={item.url} ref={video} controls poster={item.thumb}/>:<img src={item.url} alt={item.name}/>}
 {error&&<p role="alert">{error}</p>}<div className="cs-media-tools">{button('Previous',()=>select((index+items.length-1)%items.length))}
 {item.video&&<>{button('Play / pause',()=>{const v=video.current;if(v){if(v.paused)void v.play().catch(()=>{});else v.pause()}})}{button('Rewind 10s',()=>{if(video.current)video.current.currentTime=Math.max(0,video.current.currentTime-10)})}{button('Forward 10s',()=>{if(video.current&&Number.isFinite(video.current.duration))video.current.currentTime=Math.min(video.current.duration,video.current.currentTime+10)})}{button('Mute',()=>{if(video.current)video.current.muted=!video.current.muted})}</>}
 {button('Next',()=>select((index+1)%items.length))}{button('Close',close)}</div></div>;
}
