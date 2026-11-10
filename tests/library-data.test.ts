import {describe,it,expect} from 'vitest';
import {readLibrary,isInstalled,librarySignature,recentLibrary,lastPlayed,SHORTCUT,type LibraryApp} from '../src/library-data';
import {launchGameId} from '../src/home/launch-id';
const app=(id:number,extra:Partial<LibraryApp>={}):LibraryApp=>({appid:id,display_name:`Game ${id}`,app_type:1,installed:true,subscribed_to:true,...extra});
describe('shared Steam library',()=>{
 it('deduplicates Steam membership while retaining shared games and hiding hidden entries',()=>{
  const a=app(1),shared=app(2,{subscribed_to:false}),hidden=app(3),shortcut=app(4,{app_type:SHORTCUT}),unowned=app(5,{subscribed_to:false});
  const collections:any={'type-games':{visibleApps:[a,shared,hidden,shortcut]},hidden:{allApps:[hidden]},favorite:{visibleApps:[shared,hidden]}};
  const host={appStore:{allApps:[a,shared,hidden,shortcut,unowned]},collectionStore:{GetCollection:(id:string)=>collections[id],userCollections:[{id:'custom',displayName:'Mine',visibleApps:[shortcut,hidden]}]}};
  const result=readLibrary(host);expect(result.entries.map(a=>a.appid)).toEqual([1,2,4]);expect(result.favorites.map(a=>a.appid)).toEqual([2]);expect(result.collections[0].apps.map(a=>a.appid)).toEqual([4]);
  const before=librarySignature(host);collections.favorite.visibleApps=[a];expect(librarySignature(host)).not.toBe(before);
 });
 it('does not reject installed shortcuts with an empty local record',()=>{
  expect(isInstalled(app(1,{local_per_client_data:{}}))).toBe(true);
  expect(isInstalled(app(1,{local_per_client_data:{installed:false}}))).toBe(false);
  expect(isInstalled(app(1,{installed:false,per_client_data:[{clientid:'0',installed:true}]}))).toBe(true);
 });
 it('does not use a route-patched short app ID to launch a shortcut',()=>{
  expect(launchGameId({...app(4143890367,{app_type:SHORTCUT,m_gameid:'17797873604507992064'}),GetGameID:()=> '4143890367'})).toBe('17797873604507992064');
 });
 it('uses the same NBA shortcut identity on Home and native details',()=>{
  for(const [id,full] of [[2353963928,'10110198086757253120'],[3706888855,'15920966402165440512']] as const){
   const a=app(id,{app_type:SHORTCUT,m_gameid:full});
   expect(launchGameId({...a,GetGameID:()=>String(id)})).toBe(full);
   expect(launchGameId({...a,GetGameID:()=>full})).toBe(full);
   expect(launchGameId({...a,m_gameid:'17797873604507992064',GetGameID:()=>String(id)})).toBeUndefined();
  }
 });
 it('keeps LBP2 full launch identity without precision loss or short-ID fallback',()=>{
  expect(launchGameId(app(4143890367,{app_type:SHORTCUT,gameid:'4143890367',m_gameid:'17797873604507992064'}))).toBe('17797873604507992064');
  expect(launchGameId(app(4143890367,{app_type:SHORTCUT,gameid:'4143890367'}))).toBeUndefined();
  expect(launchGameId(app(750920))).toBe('750920');
 });
});

describe('recent play records',()=>{
 it('restores shortcut history without treating store installs as played',()=>{
  const shortcut=app(1,{app_type:SHORTCUT,rt_last_time_played:0,rt_last_time_played_or_installed:100});
  const local=app(2,{rt_last_time_played:50,rt_last_time_locally_played:200});
  const install=app(3,{rt_last_time_played_or_installed:300});
  const host={appStore:{allApps:[shortcut,local,install]}};
  expect(recentLibrary(host,10).map(a=>a.appid)).toEqual([2,1]);
  expect(lastPlayed(install)).toBe(0);
  const before=librarySignature(host);shortcut.rt_last_time_locally_played=400;
  expect(librarySignature(host)).not.toBe(before);
  expect(recentLibrary(host,10).map(a=>a.appid)).toEqual([1,2]);
 });
});
