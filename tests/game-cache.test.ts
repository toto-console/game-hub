import {it,expect,vi,afterEach} from 'vitest';
vi.mock('../src/store-content',()=>({boundedJSON:vi.fn(async()=>({}))}));
vi.mock('../src/themedeck-adapter',()=>({stopSoundtrackForLaunch:vi.fn()}));
import {loadGame,type Game} from '../src/game-adapter';
afterEach(()=>vi.useRealTimers());
it('coalesces simultaneous detail loads and clears the request deadline after completion',async()=>{
 vi.useFakeTimers();let finish!:(v:unknown)=>void;const RequestAppDetails=vi.fn(()=>new Promise(r=>{finish=r;}));Object.assign(window,{appDetailsStore:{RequestAppDetails},appStore:{GetAppOverviewByAppID:()=>undefined}});
 const g:Game={id:101,name:'Shortcut',last:0,minutes:0,installed:true,shortcut:true,gameid:'101'};
 const a=loadGame(g),b=loadGame(g);expect(a).toBe(b);expect(RequestAppDetails).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(1);finish(undefined);expect(await a).toBe(await b);expect(vi.getTimerCount()).toBe(0);await loadGame(g);expect(RequestAppDetails).toHaveBeenCalledTimes(1);
});
