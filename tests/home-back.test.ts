import {afterEach,it,expect,vi} from 'vitest';
import {connectHomeBackBoundary} from '../src/home/home-back';
afterEach(()=>{document.body.innerHTML='';});
it('keeps final Home Back from reaching Steam history and cleans up',()=>{
 const root=document.createElement('div'),tile=document.createElement('button');root.append(tile);document.body.append(root);
 const native=vi.fn(),restore=vi.fn();document.body.addEventListener('vgp_oncancel',native);
 let home=true;const stop=connectHomeBackBoundary(root,()=>home,restore);
 const press=()=>tile.dispatchEvent(new CustomEvent('vgp_oncancel',{bubbles:true,cancelable:true}));
 press();expect(native).not.toHaveBeenCalled();expect(restore).toHaveBeenCalledOnce();
 home=false;press();expect(native).toHaveBeenCalledOnce();
 home=true;stop();press();expect(native).toHaveBeenCalledTimes(2);document.body.removeEventListener('vgp_oncancel',native);
});
it('allows child modals to consume Back first and ignores repeated focus restoration',()=>{
 const root=document.createElement('div'),child=document.createElement('button');root.append(child);document.body.append(root);
 const restore=vi.fn(),stop=connectHomeBackBoundary(root,()=>true,restore);
 const childBack=(e:Event)=>{e.preventDefault();e.stopPropagation();};child.addEventListener('keydown',childBack);
 child.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));expect(restore).not.toHaveBeenCalled();
 child.removeEventListener('keydown',childBack);
 const event=new KeyboardEvent('keydown',{key:'Escape',repeat:true,bubbles:true,cancelable:true});child.dispatchEvent(event);expect(event.defaultPrevented).toBe(true);expect(restore).not.toHaveBeenCalled();stop();
});
