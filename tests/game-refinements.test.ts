import {describe,it,expect,vi} from 'vitest';
vi.mock('@decky/api',()=>({fetchNoCors:vi.fn()}));
import {gameAction,openGameDownloads} from '../src/game-action';
import {newsForApp,achievementPercent,plainText} from '../src/game-content';
import {parseStoreItems} from '../src/store-content';
const app={appid:42,display_name:'Game',app_type:1,installed:true};
const host=(state:string,percent=13,extra={})=>({downloadsStore:{m_DownloadItems:new Map([['0',[{appid:42,active:true,...extra}]]]),LocalDownloadOverview:{update_appid:42,update_state:state,overall_percent_complete:percent}}});
describe('authoritative primary game action',()=>{
 it.each(['Downloading','Installing','Verifying','Updating','Committing'])('keeps %s at 100 percent in Downloads, even if installed',state=>{expect(gameAction(host(state,100),app)).toEqual({kind:'downloads',label:(state==='Committing'?'Installing':state)+' — 100%',percent:100});});
 it('handles queue, pause, errors and ignores upload progress',()=>{
  expect(gameAction({downloadsStore:{m_DownloadItems:new Map([['0',[{appid:42}]]])}},app).label).toBe('Queued — View Downloads');
  expect(gameAction(host('Downloading',13,{paused:true}),app).label).toBe('Paused — 13%');
  expect(gameAction(host('Downloading',13,{update_error:'Disk full'}),app).label).toBe('Download error — View Downloads');
  const h=host('Downloading');Object.assign(h.downloadsStore.LocalDownloadOverview,{update_is_upload:true});expect(gameAction(h,app).kind).toBe('play');
 });
 it('requires installed metadata after completion and preserves shortcuts',()=>{
  const h=host('Downloading',100,{completed:true});expect(gameAction(h,{...app,installed:false}).kind).toBe('install');expect(gameAction(h,app).kind).toBe('play');
  expect(gameAction({}, {...app,installed:false,app_type:1073741824}).kind).toBe('play');expect(gameAction({},app,true).kind).toBe('running');
 });
 it('routes an explicit app and caller to Game Hub; never silently falls through to native Downloads',()=>{
  const origin=document.createElement('button');document.body.append(origin);let detail:any;
  const receive=(e:Event)=>{detail=(e as CustomEvent).detail;e.preventDefault();};document.addEventListener('game-hub:open-downloads',receive);
  openGameDownloads(42,origin);expect(detail).toEqual({appid:42,origin});document.removeEventListener('game-hub:open-downloads',receive);origin.remove();expect(()=>openGameDownloads(42)).toThrow('Enable Game Hub');
 });
});
describe('real game content',()=>{
 it('rejects wrong-app news and distinguishes announcements from external press',()=>{
  const item={title:'Update',url:'https://steamcommunity.com/games/42/announcements/detail/123',feedname:'steam_community_announcements',feed_type:1,is_external_url:false,date:123,contents:'<b>Real update</b>'};
  expect(newsForApp({appnews:{appid:41,newsitems:[item]}},42)).toEqual([]);
  const rows=newsForApp({appnews:{appid:42,newsitems:[item,{...item,url:'https://example.com/story',is_external_url:true},{...item,url:'javascript:alert(1)'}]}},42);
  expect(rows).toHaveLength(2);expect(rows[0].official).toBe(true);expect(rows[1].official).toBe(false);expect(rows[0].contents).toBe('Real update');
  const external=newsForApp({appnews:{appid:42,newsitems:[{...item,is_external_url:true,url:'https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/123'}]}},42);expect(external[0].official).toBe(true);
 });
 it('does not fabricate locked-achievement progress and strips active markup',()=>{expect(achievementPercent(undefined,100)).toBeUndefined();expect(achievementPercent(8,99)).toBe(8);expect(achievementPercent(100,0)).toBeUndefined();expect(plainText('<script>bad()</script><b>Update</b>')).toBe('Update');});
 it('only exposes real app identities and source-backed categories, with no inferred prices or rankings',()=>{
  const item={id:42,type:0,name:'Real title',header_image:'https://shared.steamstatic.com/test.jpg'};
  const list=parseStoreItems({featured_win:[item,{...item,type:1,id:43},{...item,id:-1}]},{coming_soon:{items:[item,{...item,id:44}]}});
  expect(list.map(i=>[i.id,i.category])).toEqual([[42,'Featured'],[44,'Coming soon']]);expect(list[0]).not.toHaveProperty('price');
 });
});
