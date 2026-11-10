import {it,expect,vi,afterEach} from 'vitest';
import {createDownloadSource} from '../src/downloads-live';
afterEach(()=>vi.useRealTimers());
it('shares one clock/subscription, keeps unchanged snapshots stable, and releases on last unmount',()=>{
 vi.useFakeTimers();const Unregister=vi.fn(),RegisterForDownloadItemsUpdate=vi.fn(()=>({Unregister}));
 const item={appid:1,active:true,overall_percent_complete:10};const source=createDownloadSource(()=>({downloadsStore:{m_DownloadItems:new Map([['0',[item]]]),RegisterForDownloadItemsUpdate}}));
 // A stable native store is shared across all mounted surfaces.
 const store={m_DownloadItems:new Map([['0',[item]]]),RegisterForDownloadItemsUpdate};const shared=createDownloadSource(()=>({downloadsStore:store}));
 const a=vi.fn(),b=vi.fn(),offA=shared.subscribe(a),offB=shared.subscribe(b),offTick=shared.tick(()=>{});
 expect(RegisterForDownloadItemsUpdate).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(1);const first=shared.getSnapshot();
 vi.advanceTimersByTime(3000);expect(shared.getSnapshot()).toBe(first);expect(a).toHaveBeenCalledTimes(1);expect(b).not.toHaveBeenCalled();
 item.overall_percent_complete=11;shared.refresh();expect(shared.getSnapshot().rows[0].percent).toBe(11);expect(a).toHaveBeenCalledTimes(2);expect(b).toHaveBeenCalledOnce();
 offA();offB();expect(Unregister).not.toHaveBeenCalled();offTick();expect(Unregister).toHaveBeenCalledOnce();expect(vi.getTimerCount()).toBe(0);
});
it('survives a missing source and reconnects when Steam becomes ready',()=>{vi.useFakeTimers();let host:any={};const source=createDownloadSource(()=>host),stop=source.subscribe(()=>{});expect(source.getSnapshot().ready).toBe(false);host={downloadsStore:{m_DownloadItems:new Map([['0',[]]])}};vi.advanceTimersByTime(1000);expect(source.getSnapshot().ready).toBe(true);stop();expect(vi.getTimerCount()).toBe(0);});
