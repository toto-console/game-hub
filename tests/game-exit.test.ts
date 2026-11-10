import {it,expect,vi,afterEach} from 'vitest';
import {requestGameExit,exitGameAndConfirm} from '../src/game-exit';
it('uses Steam GetGameID when there is no public gameid field',async()=>{const TerminateApp=vi.fn();await requestGameExit({RunningApps:[{appid:42,app_type:1,GetGameID:()=> '42'}]},{Apps:{TerminateApp}},42);expect(TerminateApp).toHaveBeenCalledExactlyOnceWith('42',false);});
it('preserves the full shortcut identity instead of truncating it to appid',async()=>{const appid=3706888855,gameid=((BigInt(appid)<<32n)|0x02000000n).toString(),TerminateApp=vi.fn();await requestGameExit({RunningApps:[{appid,app_type:1073741824,m_gameid:gameid,GetGameID:()=>String(appid)}]},{Apps:{TerminateApp}},appid);expect(TerminateApp).toHaveBeenCalledWith(gameid,false);});
it('never exits a different game or a stale overlay target',async()=>{const TerminateApp=vi.fn();await expect(requestGameExit({RunningApps:[{appid:41,app_type:1}]},{Apps:{TerminateApp}},42)).rejects.toThrow('no longer');expect(TerminateApp).not.toHaveBeenCalled();});
it('rejects incomplete shortcut identities',async()=>{const TerminateApp=vi.fn();await expect(requestGameExit({RunningApps:[{appid:3706888855,app_type:1073741824}]},{Apps:{TerminateApp}},3706888855)).rejects.toThrow('unavailable');expect(TerminateApp).not.toHaveBeenCalled();});
it('propagates asynchronous Steam errors and allows a subsequent retry',async()=>{const TerminateApp=vi.fn().mockRejectedValueOnce(Error('Steam rejected')).mockResolvedValueOnce(undefined),router={RunningApps:[{appid:42,app_type:1}]},client={Apps:{TerminateApp}};await expect(requestGameExit(router,client,42)).rejects.toThrow('Steam rejected');await expect(requestGameExit(router,client,42)).resolves.toBeUndefined();expect(TerminateApp).toHaveBeenCalledTimes(2);});
it('waits for the Steam request before reporting success',async()=>{let finish!:(value:unknown)=>void;const TerminateApp=vi.fn(()=>new Promise(r=>{finish=r;}));let done=false;const request=requestGameExit({RunningApps:[{appid:42,app_type:1}]},{Apps:{TerminateApp}},42).then(()=>{done=true;});await Promise.resolve();expect(done).toBe(false);finish(undefined);await request;expect(done).toBe(true);});

it('resolves sparse running records using the same app’s library metadata',async()=>{const TerminateApp=vi.fn();await requestGameExit({RunningApps:[{appid:42,GetGameID:()=> '42'}]},{Apps:{TerminateApp}},42,id=>({appid:id,app_type:1}));expect(TerminateApp).toHaveBeenCalledWith('42',false);});
it('reports a rejected native result rather than treating it as a successful exit',async()=>{await expect(requestGameExit({RunningApps:[{appid:42,app_type:1}]},{Apps:{TerminateApp:()=>false}},42)).rejects.toThrow('did not accept');});

it('accepts Steam’s string app IDs without mistaking the running game for a stale target',async()=>{const TerminateApp=vi.fn();await requestGameExit({RunningApps:[{appid:'42',app_type:1,GetGameID:()=> '42'}]},{Apps:{TerminateApp}},'42');expect(TerminateApp).toHaveBeenCalledWith('42',false);});

afterEach(()=>vi.useRealTimers());
it('requires confirmed removal and clears polling after success',async()=>{
 vi.useFakeTimers();const router={RunningApps:[{appid:42,app_type:1}]};let done=false;
 const request=exitGameAndConfirm(router,{Apps:{TerminateApp:vi.fn()}},42).then(()=>{done=true;});
 await vi.advanceTimersByTimeAsync(500);expect(done).toBe(false);
 router.RunningApps=[];await vi.advanceTimersByTimeAsync(250);await request;
 expect(done).toBe(true);expect(vi.getTimerCount()).toBe(0);
});
it.each(['running','unavailable','hung'] as const)('bounds an unconfirmed %s exit and cleans timers',async mode=>{
 vi.useFakeTimers();const router:{RunningApps?:{appid:number;app_type:number}[]}={RunningApps:[{appid:42,app_type:1}]};
 const request=exitGameAndConfirm(router,{Apps:{TerminateApp:()=>mode==='hung'?new Promise(()=>{}):undefined}},42);
 const assertion=expect(request).rejects.toThrow('not confirmed');
 if(mode==='unavailable')router.RunningApps=undefined;
 if(mode==='hung')router.RunningApps=[];
 await vi.advanceTimersByTimeAsync(10000);await assertion;expect(vi.getTimerCount()).toBe(0);
});
it('rejects duplicate requests and permits retry after rejection',async()=>{
 vi.useFakeTimers();const router={RunningApps:[{appid:42,app_type:1}]},TerminateApp=vi.fn();
 const first=exitGameAndConfirm(router,{Apps:{TerminateApp}},42);
 const assertion=expect(first).rejects.toThrow('not confirmed');
 await expect(exitGameAndConfirm(router,{Apps:{TerminateApp}},'42')).rejects.toThrow('already pending');
 expect(TerminateApp).toHaveBeenCalledTimes(1);
 await vi.advanceTimersByTimeAsync(10000);await assertion;
 TerminateApp.mockReturnValue(false);await expect(exitGameAndConfirm(router,{Apps:{TerminateApp}},42)).rejects.toThrow('did not accept');
 expect(vi.getTimerCount()).toBe(0);
});

it('avoids the confirmed Endfield external-exit hang without terminating it',async()=>{const TerminateApp=vi.fn();await expect(requestGameExit({RunningApps:[{appid:4732690,app_type:1}]},{Apps:{TerminateApp}},4732690)).rejects.toThrow('own Quit');expect(TerminateApp).not.toHaveBeenCalled();});
