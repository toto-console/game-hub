import {afterEach,expect,it,vi} from 'vitest';
import {bindWhenReady,loadWhenReady} from '../src/startup-ready';
afterEach(()=>vi.useRealTimers());

it('restores saved dashboard preferences when the backend becomes ready after startup',async()=>{
 vi.useFakeTimers();
 const saved={active:true,dashboard:{enabled:true,ps5Home:true}};
 const load=vi.fn().mockRejectedValueOnce(Error('backend starting')).mockRejectedValueOnce(Error('backend starting')).mockResolvedValue(saved);
 const apply=vi.fn(),failed=vi.fn();
 const stop=loadWhenReady(load,apply,failed);
 await vi.advanceTimersByTimeAsync(2000);
 expect(apply).toHaveBeenCalledExactlyOnceWith(saved);
 expect(failed).toHaveBeenCalledTimes(2);
 await vi.advanceTimersByTimeAsync(10000);
 expect(load).toHaveBeenCalledTimes(3);stop();
});

it('does not restore a stale dashboard after the plugin unloads',async()=>{
 let resolve!:(v:object)=>void;const apply=vi.fn();
 const stop=loadWhenReady(()=>new Promise<object>(r=>{resolve=r;}),apply,vi.fn());
 stop();resolve({active:true});await Promise.resolve();
 expect(apply).not.toHaveBeenCalled();
});

it('binds the Control Center when Steam publishes the window after component mount',()=>{
 vi.useFakeTimers();let owner:object|undefined;const release=vi.fn(),bind=vi.fn(()=>release);
 const stop=bindWhenReady(()=>owner,bind);
 vi.advanceTimersByTime(1000);expect(bind).not.toHaveBeenCalled();
 owner={};vi.advanceTimersByTime(250);expect(bind).toHaveBeenCalledExactlyOnceWith(owner);
 vi.advanceTimersByTime(2000);expect(bind).toHaveBeenCalledOnce();
 stop();expect(release).toHaveBeenCalledOnce();expect(vi.getTimerCount()).toBe(0);
});

it('cancels pending backend and window retries when unloaded',async()=>{
 vi.useFakeTimers();const load=vi.fn().mockRejectedValue(Error('starting')),bind=vi.fn();
 const stopLoad=loadWhenReady(load,vi.fn(),vi.fn());
 const stopBind=bindWhenReady(()=>undefined,bind);
 await vi.advanceTimersByTimeAsync(0);stopLoad();stopBind();
 await vi.advanceTimersByTimeAsync(10000);
 expect(load).toHaveBeenCalledOnce();expect(bind).not.toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);
});
