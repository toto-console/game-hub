import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,fireEvent,screen,waitFor,cleanup} from '@testing-library/react';
vi.mock('../src/downloads-live',()=>({downloadSource:{getSnapshot:()=>({rows:[]})},useDownloadTick:()=>{}}));
vi.mock('../src/game-action',()=>({gameAction:()=>({kind:'install',label:'Install'}),openGameDownloads:vi.fn()}));
vi.mock('../src/home/upstream/steam',()=>({runningAppId:()=>0,launch:vi.fn(),openDetails:vi.fn()}));
vi.mock('../src/home/upstream/components',()=>({Button:({children,onActivate}:any)=><button onClick={e=>onActivate(e.currentTarget)}>{children}</button>}));
import {GameAction} from '../src/GameAction';
afterEach(cleanup);
it('opens the local Steam install wizard for the selected Library game',async()=>{
 const OpenInstallWizard=vi.fn().mockResolvedValue(undefined);
 Object.assign(window,{SteamClient:{Installs:{OpenInstallWizard}}});
 render(<GameAction app={{appid:42,app_type:1,display_name:'Game',installed:false}}/>);
 fireEvent.click(screen.getByText('Install'));
 await waitFor(()=>expect(OpenInstallWizard).toHaveBeenCalledWith([42],'0'));
});
it('shows an install failure',async()=>{
 Object.assign(window,{SteamClient:{Installs:{OpenInstallWizard:vi.fn().mockRejectedValue(new Error('Install unavailable'))}}});
 render(<GameAction app={{appid:42,app_type:1,display_name:'Game',installed:false}}/>);
 fireEvent.click(screen.getByText('Install'));
 expect((await screen.findByRole('alert')).textContent).toContain('Install unavailable');
});
