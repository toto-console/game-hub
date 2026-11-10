type PointerSample={currentTarget:{ownerDocument:Document};clientX:number;clientY:number};
const positions=new WeakMap<Document,{x:number;y:number}>();
/** Layout/row animation can emit enter/move events beneath a stationary cursor.
 * Share the last coordinate across tiles, so a newly entered tile cannot reset it. */
export function movedPointer(event:PointerSample):boolean {
 const doc=event.currentTarget.ownerDocument,previous=positions.get(doc);
 const next={x:event.clientX,y:event.clientY};positions.set(doc,next);
 return !!previous&&(next.x!==previous.x||next.y!==previous.y);
}
