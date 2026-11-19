import {afterEach,it,expect,vi} from 'vitest';
import {cleanup,fireEvent,render} from '@testing-library/react';
vi.mock('@decky/ui',()=>({findModuleExport:()=>undefined}));
vi.mock('@decky/api',()=>({callable:()=>vi.fn(async()=>({})),call:vi.fn()}));
import {Panel} from '../src/Panel';
import {defaults} from '../src/settings';
import {browserControls} from '../preview/controls';
import {clearProfileReturn} from '../src/profile-return';
afterEach(()=>{cleanup();clearProfileReturn();vi.unstubAllGlobals();});
it('Back from a profile-opened message returns to that profile before the message list',()=>{
 vi.stubGlobal('matchMedia',()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
 const returnToProfile=vi.fn(),onBack=vi.fn();
 const {container}=render(<Panel controls={browserControls} bridge={{readFriends:()=>({kind:'ready',friends:[],detail:'Test friends'}),openProfile:vi.fn(),openNative:vi.fn()}} settings={defaults} setSettings={vi.fn()} onBack={onBack} initialTab="Messages" entryRequest={{tab:'Messages',serial:1,conversation:'friend:123',returnToProfile}}/>);
 fireEvent.keyDown(container.querySelector('.gbs-root')!,{key:'Escape'});
 expect(returnToProfile).toHaveBeenCalledOnce();expect(onBack).not.toHaveBeenCalled();
});

