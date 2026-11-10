// Scroll only the history viewport, and notify its pin-to-bottom observer immediately.
export function nextHistoryTop(top:number,height:number,viewport:number,direction:-1|1){
 return Math.max(0,Math.min(Math.max(0,height-viewport),top+direction*Math.max(40,viewport*.35)));
}
export function stepHistory(history:HTMLElement,direction:-1|1){
 history.scrollTop=nextHistoryTop(history.scrollTop,history.scrollHeight,history.clientHeight,direction);
 const EventClass=history.ownerDocument.defaultView?.Event;
 if(EventClass)history.dispatchEvent(new EventClass('scroll'));
}
