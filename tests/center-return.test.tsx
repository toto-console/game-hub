import React from 'react';
import {render,cleanup,fireEvent,act} from '@testing-library/react';
import {it,expect,vi,afterEach} from 'vitest';
import {connectProfileReturn,clearProfileReturn,useProfileState,returningFromProfile} from '../src/profile-return';
vi.mock('@decky/ui',()=>({Navigation:{Navigate:vi.fn()}}));
import {returnFromGameHubLibrary} from '../src/home/native-library';
afterEach(()=>{cleanup();clearProfileReturn();});
function Panel(){const [open,set]=useProfileState('test-switcher',false);return <button onClick={()=>set(true)}>{open?'Switcher':'Dock'}</button>;}
it('does not restore a pending Switcher snapshot on an ordinary Control Center reopen',()=>{
 let history:(location:{pathname:string},action:string)=>void=()=>{};
 const connection=connectProfileReturn({LocationPathName:'/library/home',m_history:{listen:(fn:any)=>{history=fn;return()=>{};}}},vi.fn(),()=>true);
 const first=render(<Panel/>);fireEvent.click(first.getByText('Dock'));connection.begin();first.unmount();
 const next=render(<Panel/>);expect(next.getByText('Dock')).toBeTruthy();next.unmount();
 history({pathname:'/game-hub/home/library'},'PUSH');expect(returningFromProfile()).toBe(false);
 expect(render(<Panel/>).getByText('Dock')).toBeTruthy();connection.dispose();
});
it('still restores a genuine profile Back return',()=>{
 let history:any;const reopen=vi.fn();
 const connection=connectProfileReturn({LocationPathName:'/library/home',m_history:{listen:(fn:any)=>{history=fn;return()=>{};}}},reopen,()=>true);
 const first=render(<Panel/>);fireEvent.click(first.getByText('Dock'));connection.begin();first.unmount();
 history({pathname:'/steamweb'},'PUSH');history({pathname:'/library/home'},'POP');
 expect(render(<Panel/>).getByText('Switcher')).toBeTruthy();connection.dispose();
});
it('leaving the standalone Library records Home as the next screen history returns to',()=>{
 const navigate=vi.fn(),select=vi.fn();returnFromGameHubLibrary('library',navigate,select);
 expect(select).toHaveBeenCalledOnce();expect(navigate).toHaveBeenCalledWith('/library/home');
 navigate.mockClear();returnFromGameHubLibrary('games',navigate,select);expect(navigate).not.toHaveBeenCalled();
});
