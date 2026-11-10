// Steam sp.js pR enum (vgp events), not the raw controller/glyph enum.
export function bumperDirection(button:number): -1|0|1 {return button===5?-1:button===6?1:0;}
export function adjacentTab<T>(tabs:readonly T[],current:T,direction:-1|1):T {
 return tabs[Math.max(0,Math.min(tabs.length-1,tabs.indexOf(current)+direction))];
}
export class BumperLatch {
 private held=new Set<number>();
 press(button:number,repeat=false){if(!bumperDirection(button)||repeat||this.held.has(button))return false;this.held.add(button);return true;}
 release(button:number){this.held.delete(button);}
 clear(){this.held.clear();}
}
