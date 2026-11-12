import {it,expect,vi} from 'vitest';
import {defaults} from '../src/home/welcome-layout';
it('retains wallpaper on remount, deduplicates loads, and ignores stale fetches after editing',async()=>{
 vi.resetModules();const cache=await import('../src/home/welcome-settings-cache');
 let resolve!:(v:any)=>void;const load=vi.fn(()=>new Promise<any>(r=>{resolve=r;}));
 const first=cache.loadWelcomeSettings(load),second=cache.loadWelcomeSettings(load);expect(first).toBe(second);expect(load).toHaveBeenCalledOnce();
 const changed={...defaults(),background:'existing' as const,wallpaperScope:'home' as const};cache.rememberWelcomeSettings(changed);
 resolve(defaults());await first;expect(cache.cachedWelcomeSettings()?.background).toBe('existing');
 await cache.loadWelcomeSettings(load);expect(load).toHaveBeenCalledOnce();
});
it('retries after a failed initial settings request',async()=>{
 vi.resetModules();const cache=await import('../src/home/welcome-settings-cache');
 await expect(cache.loadWelcomeSettings(()=>Promise.reject(Error('offline')))).rejects.toThrow('offline');
 expect(cache.cachedWelcomeSettings()).toBeUndefined();await cache.loadWelcomeSettings(()=>Promise.resolve(defaults()));expect(cache.cachedWelcomeSettings()).toBeDefined();
});
