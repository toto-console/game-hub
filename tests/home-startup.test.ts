import {afterEach,expect,it,vi} from 'vitest';
const api=vi.hoisted(()=>({load:vi.fn(),addRoute:vi.fn(),removeRoute:vi.fn(),addPatch:vi.fn((_path,patch)=>patch),removePatch:vi.fn()}));
vi.mock('@decky/api',()=>({callable:()=>api.load,routerHook:api}));
vi.mock('@decky/ui',()=>({Navigation:{},Router:{}}));
vi.mock('../src/home/upstream/Shell',()=>({Ps5Shell:()=>null}));
vi.mock('../src/home/upstream/components',()=>({Fallback:()=>null}));
import {startHomeModule} from '../src/home/module';
afterEach(()=>vi.useRealTimers());
it('installs the saved Home replacement after a failed first backend request without reloading the plugin',async()=>{
 vi.useFakeTimers();
 api.load.mockRejectedValueOnce(Error('backend not ready')).mockResolvedValue({active:true,dashboard:{enabled:true,ps5Home:true}});
 const stop=startHomeModule();
 await vi.advanceTimersByTimeAsync(0);expect(api.addPatch).not.toHaveBeenCalled();
 await vi.advanceTimersByTimeAsync(500);
 expect(api.addPatch).toHaveBeenCalledWith('/library/home',expect.any(Function));
 expect(api.addPatch).toHaveBeenCalledWith('/library',expect.any(Function));
 const apply=api.addPatch.mock.calls.find(c=>c[0]==='/library')![1];
 // Registration happens while Home is current; that must not skip the Library definition.
 const library={path:'/library',location:{pathname:'/library/home'},children:'native library'};
 expect(apply(library).children).not.toBe('native library');
 expect(api.addPatch.mock.calls.map(c=>c[0])).toEqual(['/library/home','/library']);

 stop();expect(api.removePatch).toHaveBeenCalledWith('/library/home',expect.any(Function));expect(api.removePatch).toHaveBeenCalledWith('/library',expect.any(Function));
 expect(vi.getTimerCount()).toBe(0);
});
