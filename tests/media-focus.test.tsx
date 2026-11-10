import React from 'react';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {render,fireEvent,cleanup,act} from '@testing-library/react';
vi.mock('@decky/ui',()=>({Focusable:React.forwardRef(({children,onCancelButton,...p}:any,ref:any)=><div ref={ref} className={p.className} onKeyDown={e=>{if(e.key==='Escape')onCancelButton?.(e);}}>{children}</div>)}));
vi.mock('../src/MediaManager',()=>({openMediaManager:vi.fn()}));
vi.mock('../src/media-launch',()=>({launchMediaApp:vi.fn()}));
vi.mock('../src/library-live',()=>({useLibraryRevision:()=>0}));
vi.mock('../src/home/upstream/components',()=>({Art:()=>null,Button:({children,onActivate}:any)=><button onClick={onActivate}>{children}</button>,Tile:({label,onActivate,className}:any)=><button className={className} onClick={onActivate}>{label}</button>}));
import {MediaHome} from '../src/home/upstream/MediaHome';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe('Media focus ownership',()=>{
 it('takes focus on entry, enters utilities, and restores the selected tile on Back',()=>{
  const frames=new Map<number,FrameRequestCallback>();let id=0;
  vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{frames.set(++id,cb);return id;});
  vi.stubGlobal('cancelAnimationFrame',(n:number)=>frames.delete(n));
  const flush=()=>act(()=>{const pending=[...frames.values()];frames.clear();pending.forEach(cb=>cb(0));});
  const view=render(<MediaHome utilities={[]} renderLibrary={()=><button className="ghd-card">Gallery</button>}/>);
  flush();expect(document.activeElement?.textContent).toBe('TV & Video');
  fireEvent.click(view.getAllByText('TV & Video')[0]);flush();expect(document.activeElement?.textContent).toBe('Gallery');
  fireEvent.keyDown(view.getByText('Gallery'),{key:'Escape'});flush();expect(document.activeElement?.textContent).toBe('TV & Video');
  view.unmount();expect(frames.size).toBe(0);
 });
});
