import {playSound} from '../native-navigation-audio';
import {scrollAxis} from './scroll-axis';
import {focusNavigation} from '../navigation';

const arrows:Record<string,number>={ArrowUp:9,ArrowDown:10,ArrowLeft:11,ArrowRight:12};

export function bindStoreDirections(root:HTMLElement){
 const x=scrollAxis('x'),y=scrollAxis('y');
 const stop=()=>{x.stop();y.stop();};
 let lastBoundary=0;
 const boundary=()=>{const now=performance.now();if(now-lastBoundary>180){playSound('FailedNav');lastBoundary=now;}};
 const move=(event:Event)=>{
  const button=event.type==='keydown'?arrows[(event as KeyboardEvent).key]:(event as CustomEvent).detail?.button;
  if(![9,10,11,12].includes(button))return;
  const selector='.cs-control,input:not([disabled])';
  const current=(event.target as HTMLElement).closest<HTMLElement>(selector);
  if(current?.matches('input')&&button>=11&&event.type==='keydown')return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const scope=root.querySelector('.cs-viewer')??root;
  const nodes=Array.from(scope.querySelectorAll<HTMLElement>(selector)).filter(node=>node.offsetWidth&&node.offsetHeight);
  const scroll=root.querySelector<HTMLElement>('.cs-scroll');
  if(!current){focusNavigation(nodes[0]);return;}
  const vertical=button<=10,forward=button===10||button===12;
  // Compare positions in the scrolling document, including tiles outside the viewport.
  const box=(node:HTMLElement)=>{
   const r=node.getBoundingClientRect(),scroll=node.closest('.cs-scroll');
   const x=r.left+(node.closest('.strip')?.scrollLeft??0),y=r.top+(scroll?.scrollTop??0);
   return vertical?[y,y+r.height,x,x+r.width]:[x,x+r.width,y,y+r.height];
  };
  const [start,end,left,right]=box(current);
  let best:HTMLElement|undefined,score=Infinity;
  for(const node of nodes){
   if(node===current)continue;
   const [a,b,c,d]=box(node),distance=forward?a-end:start-b;
   if(distance< -1)continue;
   const overlap=Math.min(right,d)-Math.max(left,c);
   if(!vertical&&overlap<=0)continue;
   const cost=distance+Math.abs((left+right-c-d)/2)*0.25+Math.max(0,-overlap)*4;
   if(cost<score){score=cost;best=node;}
  }
  if(best){
   const strip=best.closest<HTMLElement>('.strip');
   const top=scroll?.scrollTop??0,left=strip?.scrollLeft??0;
   const r=best.getBoundingClientRect();
   const align=(start:number,end:number,low:number,high:number,offset:number,destination:number)=>{
    // Project the tile into the final viewport while a previous move is settling.
    const a=start+offset-destination,b=end+offset-destination;
    if(a<low)return start+offset-low;
    if(b>high)return end+offset-high;
    return destination;
   };
   let rowTarget:number|undefined,horizontal:number|undefined;
   if(scroll&&scroll.contains(best)){
    const viewport=scroll.getBoundingClientRect(),pad=Math.min(42,scroll.clientHeight*.055);
    rowTarget=align(r.top,r.bottom,viewport.top+pad,viewport.bottom-pad,top,y.destination(scroll));
   }
   if(scroll&&button===9&&(best.closest('nav')||best===scroll.querySelector(selector)))rowTarget=0;
   if(strip){
    const viewport=strip.getBoundingClientRect();
    horizontal=align(r.left,r.right,viewport.left+5,viewport.right-5,left,x.destination(strip));
   }
   focusNavigation(best);
   if(scroll&&rowTarget!==undefined){
    if(scroll.scrollTop!==top)scroll.scrollTo({top,behavior:'instant'});
    y.to(scroll,rowTarget);
   }
   if(strip&&horizontal!==undefined){
    if(strip.scrollLeft!==left)strip.scrollTo({left,behavior:'instant'});
    x.to(strip,horizontal);
   }
  }else if(vertical&&scroll&&scope===root){
   const destination=y.destination(scroll);
   if(button===9?destination<=0:destination>=scroll.scrollHeight-scroll.clientHeight-1)boundary();
   else y.to(scroll,button===9?0:destination+scroll.clientHeight*.8);
  }else boundary();
 };
 // Steam can keep a controller target in an inactive browser surface.
 const markFocus=(event:FocusEvent)=>{
  const row=(event.target as HTMLElement).closest<HTMLElement>('.cs-story');
  if(row)row.toggleAttribute('data-story-focus',event.type==='focusin');
 };
 root.addEventListener('wheel',stop,{passive:true});
 root.addEventListener('pointerdown',stop,true);
 root.addEventListener('gh-store-view-change',stop);
 root.addEventListener('focusin',markFocus);
 root.addEventListener('focusout',markFocus);
 root.addEventListener('vgp_ondirection',move,true);
 root.addEventListener('keydown',move,true);
 return()=>{stop();root.removeEventListener('wheel',stop);root.removeEventListener('pointerdown',stop,true);root.removeEventListener('gh-store-view-change',stop);root.removeEventListener('focusin',markFocus);root.removeEventListener('focusout',markFocus);root.removeEventListener('vgp_ondirection',move,true);root.removeEventListener('keydown',move,true);};
}
