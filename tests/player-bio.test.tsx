import {it,expect,vi,afterEach} from 'vitest';
import {render,act,cleanup} from '@testing-library/react';
const {read}=vi.hoisted(()=>({read:vi.fn()}));
vi.mock('@decky/api',()=>({callable:()=>read}));
import {PlayerBio} from '../src/PlayerBio';
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();read.mockReset();});
it('refreshes the visible friend, pauses offscreen and cleans up',async()=>{
 vi.useFakeTimers();let visibility:(entries:any[])=>void=()=>{};const disconnect=vi.fn();
 vi.stubGlobal('IntersectionObserver',class{constructor(cb:any){visibility=cb;}observe(){}disconnect=disconnect;});
 read.mockResolvedValueOnce({status:'ready',text:'First bio'}).mockResolvedValue({status:'ready',text:'New bio'});
 const v=render(<PlayerBio id="76561198000000001"/>);
 await act(async()=>{visibility([{isIntersecting:true}]);await vi.advanceTimersByTimeAsync(250);});expect(v.getByText('First bio')).toBeTruthy();
 await act(async()=>{await vi.advanceTimersByTimeAsync(60000);});expect(v.getByText('New bio')).toBeTruthy();
 visibility([{isIntersecting:false}]);const count=read.mock.calls.length;
 await act(async()=>{await vi.advanceTimersByTimeAsync(120000);});expect(read).toHaveBeenCalledTimes(count);
 v.unmount();expect(disconnect).toHaveBeenCalledOnce();expect(vi.getTimerCount()).toBe(0);
});
it('ignores the old friend response after selection changes',async()=>{
 vi.useFakeTimers();let visibility:(entries:any[])=>void=()=>{},resolve:(v:any)=>void=()=>{};
 vi.stubGlobal('IntersectionObserver',class{constructor(cb:any){visibility=cb;}observe(){}disconnect(){}});
 read.mockImplementationOnce(()=>new Promise(r=>{resolve=r;})).mockResolvedValue({status:'ready',text:'Second friend'});
 const v=render(<PlayerBio id="76561198000000001"/>);
 await act(async()=>{visibility([{isIntersecting:true}]);await vi.advanceTimersByTimeAsync(250);});
 v.rerender(<PlayerBio id="76561198000000002"/>);
 await act(async()=>{visibility([{isIntersecting:true}]);await vi.advanceTimersByTimeAsync(250);resolve({status:'ready',text:'Stale bio'});});
 expect(v.getByText('Second friend')).toBeTruthy();expect(v.queryByText('Stale bio')).toBeNull();
});
it('retries transient Steam failures and keeps an existing bio during an outage',async()=>{
 vi.useFakeTimers();let visibility:(entries:any[])=>void=()=>{};
 vi.stubGlobal('IntersectionObserver',class{constructor(cb:any){visibility=cb;}observe(){}disconnect(){}});
 read.mockResolvedValueOnce({status:'retry',retryAfter:15}).mockResolvedValueOnce({status:'ready',text:'Recovered bio'}).mockResolvedValue({status:'retry',retryAfter:60});
 const v=render(<PlayerBio id="76561198000000003"/>);
 await act(async()=>{visibility([{isIntersecting:true}]);await vi.advanceTimersByTimeAsync(250);});
 expect(v.getByText('Waiting for Steam… Retrying automatically.')).toBeTruthy();
 await act(async()=>{await vi.advanceTimersByTimeAsync(15000);});expect(v.getByText('Recovered bio')).toBeTruthy();
 await act(async()=>{await vi.advanceTimersByTimeAsync(60000);});expect(v.getByText('Recovered bio')).toBeTruthy();
 v.unmount();expect(vi.getTimerCount()).toBe(0);
});
it('stops after three failures instead of promising endless automatic retries',async()=>{
 vi.useFakeTimers();let visibility:(entries:any[])=>void=()=>{};
 vi.stubGlobal('IntersectionObserver',class{constructor(cb:any){visibility=cb;}observe(){}disconnect(){}});
 read.mockResolvedValue({status:'retry',retryAfter:15});
 const v=render(<PlayerBio id="76561198000000004"/>);
 await act(async()=>{visibility([{isIntersecting:true}]);await vi.advanceTimersByTimeAsync(180000);});
 expect(read).toHaveBeenCalledTimes(3);expect(v.getByText('Retry bio')).toBeTruthy();expect(v.queryByText('Waiting for Steam… Retrying automatically.')).toBeNull();
});
