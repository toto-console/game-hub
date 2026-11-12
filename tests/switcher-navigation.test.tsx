import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,fireEvent,cleanup} from '@testing-library/react';
vi.mock('@decky/ui',()=>({Navigation:{Navigate:vi.fn()}}));
vi.mock('../src/game-adapter',()=>({recentGames:()=>[],gameById:()=>undefined,loadGame:vi.fn(),playGame:vi.fn()}));
vi.mock('../src/themedeck-adapter',()=>({useSoundtrackScope:()=>{}}));
vi.mock('../src/GameMusicSettings',()=>({openGameMusic:vi.fn()}));
vi.mock('../src/downloads-live',()=>({useDownloadTick:()=>{}}));
import {GameSwitcher} from '../src/GameSwitcher';
import {openGameHubLibrary,OPEN_GAME_HUB_LIBRARY,GAME_HUB_LIBRARY} from '../src/home/native-library';
afterEach(cleanup);
it('makes Back reachable with Down and Library with Up, and activates both actions',()=>{
 HTMLElement.prototype.scrollIntoView=vi.fn();
 const close=vi.fn(),library=vi.fn();
 const controls:any={Button:({children,...p}:any)=><button {...p}>{children}</button>,Group:({children,...p}:any)=><div {...p}>{children}</div>};
 const v=render(<GameSwitcher controls={controls} close={close} leave={()=>{}} external={()=>{}} library={library}/>);
 const lib=v.getByRole('button',{name:'Game Library'}),back=v.getByRole('button',{name:'Back'});
 lib.focus();fireEvent.keyDown(lib,{key:'ArrowDown'});expect(document.activeElement).toBe(back);
 fireEvent.keyDown(back,{key:'ArrowUp'});expect(document.activeElement).toBe(lib);
 fireEvent.click(lib);expect(library).toHaveBeenCalledOnce();fireEvent.click(back);expect(close).toHaveBeenCalledOnce();
});
it('reselects Library even when Steam ignores navigation to the current route',()=>{
 const navigate=vi.fn(),open=vi.fn();window.addEventListener(OPEN_GAME_HUB_LIBRARY,open);
 openGameHubLibrary(navigate);openGameHubLibrary(navigate);
 expect(navigate).toHaveBeenCalledWith(GAME_HUB_LIBRARY);expect(open).toHaveBeenCalledTimes(2);
 window.removeEventListener(OPEN_GAME_HUB_LIBRARY,open);
});
