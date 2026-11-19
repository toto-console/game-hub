import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,act,cleanup} from '@testing-library/react';
const api=vi.hoisted(()=>({load:vi.fn(),addRoute:vi.fn(),removeRoute:vi.fn(),addGlobalComponent:vi.fn(),removeGlobalComponent:vi.fn(),addPatch:vi.fn((_path,patch)=>patch),removePatch:vi.fn()}));
vi.mock('@decky/api',()=>({callable:()=>api.load,routerHook:api}));
vi.mock('@decky/ui',()=>({Navigation:{},Router:{},classMap:{}}));
vi.mock('../src/home/upstream/Shell',()=>({Ps5Shell:()=> <div>Game Hub dashboard</div>}));
vi.mock('../src/home/upstream/components',()=>({Fallback:({children}:any)=>children}));
import {startHomeModule} from '../src/home/module';
afterEach(cleanup);
it('updates an already-mounted native Home when saved preferences arrive, including a new plugin instance',async()=>{
 for(let restart=0;restart<2;restart++){
  let resolve!:(value:any)=>void;api.load.mockImplementation(()=>new Promise(r=>{resolve=r;}));
  const stop=startHomeModule();const patch=api.addPatch.mock.calls.filter(c=>c[0]==='/library/home').at(-1)![1];
  const v=render(patch({children:<div>Native recovery</div>}).children);
  expect(v.getByText('Native recovery')).toBeTruthy();
  await act(async()=>{resolve({active:true,dashboard:{enabled:true,ps5Home:true}});});
  expect(v.getByText('Game Hub dashboard')).toBeTruthy();expect(v.queryByText('Native recovery')).toBeNull();
  v.unmount();stop();
 }
});
it('retains native Home when the saved preference is disabled',async()=>{
 api.load.mockResolvedValue({active:false});const stop=startHomeModule();
 const patch=api.addPatch.mock.calls.filter(c=>c[0]==='/library/home').at(-1)![1];const v=render(patch({children:<div>Native recovery</div>}).children);
 await act(async()=>{});expect(v.getByText('Native recovery')).toBeTruthy();expect(v.queryByText('Game Hub dashboard')).toBeNull();v.unmount();stop();
});
