import {expect,it,vi,afterEach} from 'vitest';
const {toast,play}=vi.hoisted(()=>({toast:vi.fn(),play:vi.fn(async()=>{})}));
vi.mock('@decky/api',()=>({toaster:{toast},callable:()=>vi.fn()}));
import {startBundledNotifications} from '../src/bundled-steam-notices';
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();delete (window as any).NotificationStore;});
it('shows one Linux popup for a Steam download and allows Decky to display the replacement',async()=>{
 const originalShow=vi.fn(()=>true);
 const originalSound=vi.fn(()=>6);
 const store={BShowToast:originalShow as Function,ChooseSound:originalSound as Function,ProcessNotification:vi.fn()};
 (window as any).NotificationStore=store;
 vi.spyOn(navigator,'platform','get').mockReturnValue('Linux x86_64');
 const cues:string[]=[];
 vi.stubGlobal('Audio',class {play=play;constructor(url:string){cues.push(url)}});
 toast.mockImplementation(()=>expect(store.BShowToast({}, {decky:true})).toBe(true));
 const stop=startBundledNotifications();
 try {
  await Promise.resolve();
  expect(store.BShowToast({strTest:'DownloadComplete'},{notificationID:'123',data:{title:'Download complete'}})).toBe(false);
  await vi.waitFor(()=>expect(toast).toHaveBeenCalledTimes(1));
  expect(cues[0]).toMatch(/notifications\/system\.wav$/);
  expect(store.ChooseSound({},{})).toBe(null);
  expect(store.ChooseSound({},{decky:true})).toBe(6);
 } finally {stop()}
 expect(store.BShowToast).toBe(originalShow);
 expect(store.ChooseSound).toBe(originalSound);
});
