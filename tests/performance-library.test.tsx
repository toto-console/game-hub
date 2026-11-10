import React from 'react';
import {writeFileSync} from 'node:fs';
import {librarySignature} from '../src/library-data';
import {it,expect,vi,afterEach} from 'vitest';
import {render,act,cleanup,waitFor} from '@testing-library/react';
const fixture=vi.hoisted(()=>({apps:[] as any[],revision:0,renders:0}));
vi.mock('@decky/ui',async()=>{const React=await import('react');return {Navigation:{Navigate:vi.fn()},GamepadButton:{BUMPER_LEFT:4,BUMPER_RIGHT:5},Focusable:React.forwardRef(({children,focusClassName,noFocusRing,onActivate,onCancelButton,'flow-children':flow,...props}:any,ref:any)=><div {...props} ref={ref} tabIndex={0} onClick={onActivate}>{children}</div>)};});
vi.mock('../src/home/GameDetail',()=>({GameDetail:()=>null}));
vi.mock('../src/themedeck-adapter',()=>({useSoundtrackScope:vi.fn()}));
vi.mock('../src/library-live',()=>({useLibraryRevision:()=>fixture.revision}));
vi.mock('../src/home/upstream/components',()=>({FOCUSED_CLASS:'ghd-focused',GameTile:({app,onActivate}:any)=>{fixture.renders++;return <button className="ghd-tile" onClick={onActivate}>{app.display_name}</button>;}}));

import {LibraryTab} from '../src/home/upstream/Library';

afterEach(()=>{cleanup();sessionStorage.clear();});
it('records synthetic library mount and single-download update work',async()=>{
 const results=[];
 for(const count of [20,100,500,1000]){
  fixture.apps=Array.from({length:count},(_,i)=>({appid:i+1,display_name:`Game ${String(i+1).padStart(4,'0')}`,app_type:1,installed:true}));
  let callback=()=>{};const item={appid:1,active:true,overall_percent_complete:1};
  Object.assign(window,{appStore:{allApps:[],GetAppOverviewByAppID:(id:number)=>fixture.apps[id-1]},collectionStore:{GetCollection:(id:string)=>({visibleApps:id==='type-games'?fixture.apps:[]}),userCollections:[]},downloadsStore:{m_DownloadItems:new Map([['0',[item]]]),RegisterForDownloadItemsUpdate:(fn:()=>void)=>{callback=fn;return {Unregister:()=>{}};}}});
  const host=window as any,times=[];for(let i=0;i<30;i++){const start=performance.now();librarySignature(host);times.push(performance.now()-start);}times.sort((a,b)=>a-b);
  fixture.renders=0;fixture.revision++;const start=performance.now();const ui=render(<LibraryTab back={()=>{}}/>);await waitFor(()=>expect(document.querySelectorAll('.ghd-tile')).toHaveLength(count));const mountMs=performance.now()-start,initialRenders=fixture.renders;
  const before=librarySignature(host);item.overall_percent_complete=2;const changed=before!==librarySignature(host);if(changed)fixture.revision++;
  const updateStart=performance.now();act(()=>{callback();ui.rerender(<LibraryTab back={()=>{}}/>);});
  results.push({count,signatureMedianMs:times[15],mountMs,progressUpdateMs:performance.now()-updateStart,initialRenders,progressTileRenders:fixture.renders-initialRenders,progressInvalidatesLibrary:changed});ui.unmount();
 }
 writeFileSync(`../optimization-${process.env.AUDIT_PHASE??'validation'}-library.json`,JSON.stringify(results,null,2));
},20000);
