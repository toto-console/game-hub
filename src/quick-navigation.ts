// Bounds apply to the complete visible panel, including its parent Back button.
export function boundedIndex(index:number,delta:number,count:number){return count?Math.max(0,Math.min(count-1,index<0?0:index+delta)):-1;}
export function scrollWithin(node:HTMLElement,container:HTMLElement){
 const a=node.getBoundingClientRect(),b=container.getBoundingClientRect();
 if(a.top<b.top)container.scrollTop-=b.top-a.top;
 else if(a.bottom>b.bottom)container.scrollTop+=a.bottom-b.bottom;
}
