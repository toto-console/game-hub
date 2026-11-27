import {act,render,cleanup} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {HomeBackdrop} from '../src/home/HomeBackdrop';
import type {App} from '../src/home/upstream/steam';

vi.mock('../src/home/upstream/steam',()=>({
 heroUrls:(app:App)=>['https://example.invalid/'+app.appid],
 landscapeUrls:()=>[],
}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();});

it('retains decoded art across slow, failed, and superseded selections',async()=>{
 const requests=new Map<string,{resolve:()=>void;reject:()=>void}>();
 vi.stubGlobal('Image',class {
  src='';naturalWidth=640;
  decode(){return new Promise<void>((resolve,reject)=>requests.set(this.src,{resolve,reject}));}
 });
 const scene=(id:number)=><div data-motion="false"><HomeBackdrop app={{appid:id} as App} dim={false} nearby={[]}/></div>;
 const tree=render(scene(1));
 const source=()=>tree.container.querySelector<HTMLElement>('.ghd-backdrop-wallpaper')?.dataset.wallpaper;
 const finish=(id:number,success=true)=>act(async()=>{
  const r=requests.get('https://example.invalid/'+id)!;
  if(success)r.resolve();else r.reject();
 });
 await finish(1);
 const original=tree.container.querySelector('.ghd-backdrop-wallpaper');
 await act(async()=>tree.rerender(scene(1)));
 expect(tree.container.querySelector('.ghd-backdrop-wallpaper')).toBe(original);
 tree.rerender(scene(2));tree.rerender(scene(3));
 expect(source()).toMatch(/1$/);
 await finish(3);await finish(2);
 expect(source()).toMatch(/3$/);
 tree.rerender(scene(4));await finish(4,false);
 expect(source()).toMatch(/3$/);
});
