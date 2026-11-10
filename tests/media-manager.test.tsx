import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,fireEvent,cleanup} from '@testing-library/react';
vi.mock('@decky/ui',()=>({Focusable:React.forwardRef(({children,onCancelButton,className}:any,ref:any)=><div ref={ref} className={className} onKeyDown={e=>{if(e.key==='Escape')onCancelButton?.(e);}}>{children}</div>),DialogButton:({children,onClick}:any)=><button onClick={onClick}>{children}</button>,TextField:({label,value,onChange}:any)=><label>{label}<input value={value} onChange={onChange}/></label>,Navigation:{},ModalRoot:()=>null,showModal:vi.fn()}));
vi.mock('../src/home/upstream/steam',()=>({openGameMenu:vi.fn()}));
vi.mock('../src/library-live',()=>({useLibraryRevision:()=>0}));
vi.mock('../src/library-data',()=>({SHORTCUT:1073741824,isInstalled:()=>true,readLibrary:()=>({entries:[{appid:4000000000,app_type:1073741824,display_name:'VacuumTube'}]})}));
import {MediaManager} from '../src/MediaManager';
import {loadMediaPins} from '../src/media-pins';
afterEach(()=>{cleanup();localStorage.clear();});
it('adds through explicit confirmation, edits the Media label, then safely unpins',()=>{
 const view=render(<MediaManager close={()=>{}}/>);
 fireEvent.click(view.getByText('+ Add App'));fireEvent.click(view.getByText('Choose from Steam Library'));
 fireEvent.change(view.getByLabelText('Search apps and shortcuts'),{target:{value:'Vacuum'}});
 fireEvent.click(view.getByText('VacuumTube · Non-Steam'));expect(loadMediaPins()).toEqual([]);
 fireEvent.click(view.getByRole('button',{name:'Add to Media Home'}));expect(loadMediaPins()[0].id).toBe(4000000000);
 fireEvent.click(view.getByText('VacuumTube'));fireEvent.change(view.getByLabelText('Display label (blank uses Steam name)'),{target:{value:'YouTube TV'}});fireEvent.click(view.getByText('Save appearance'));
 expect(loadMediaPins()[0].label).toBe('YouTube TV');fireEvent.click(view.getByText('YouTube TV'));fireEvent.click(view.getByText('Remove from Media Home'));expect(loadMediaPins()).toEqual([]);
});
