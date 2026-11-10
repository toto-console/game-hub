import {beforeEach,afterEach,expect,it,vi} from 'vitest';
vi.mock('../src/store-content',()=>({boundedJSON:vi.fn()}));
import {boundedJSON} from '../src/store-content';
import {discoverNews,announcementRows,loadCenterNews,resetCenterNews,newsIsCached} from '../src/center-news';
const item={id:10,type:0,name:'Real Game',header_image:'https://shared.akamai.steamstatic.com/test.jpg'};
const feed={new_releases:{items:[item]},coming_soon:{items:[{...item,id:20}]}};
beforeEach(()=>{vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-07'));resetCenterNews();vi.mocked(boundedJSON).mockReset();});
afterEach(()=>vi.useRealTimers());
it('validates discovery and tolerates malformed optional fields',()=>{
 expect(discoverNews({...feed,top_sellers:{items:{}},new_releases:{items:[null,item,item,{...item,id:-1},{...item,id:30,type:1}]}})).toHaveLength(2);
 expect(discoverNews(null)).toEqual([]);
 expect(discoverNews({new_releases:{items:[{...item,header_image:'https://evil.example/x'}]}})[0].image).toBeUndefined();
 expect(discoverNews(feed).map(x=>x.category)).toEqual(['New Releases','Coming Soon']);
});
it('only admits recent verified official announcements and classifies actual trailer headlines',()=>{
 const n={title:'Launch Trailer',url:'https://steamcommunity.com/games/10/announcements/detail/123',feedname:'steam_community_announcements',feed_type:1,date:Date.now()/1000};
 const rows=announcementRows({appnews:{appid:10,newsitems:[n,{...n,feed_type:0},{...n,date:1}]}},{appid:10,game:'Real Game'});
 expect(rows).toHaveLength(1);expect(rows[0].category).toBe('New Trailers');expect(rows[0].url).toBe('https://store.steampowered.com/app/10/');
});
it('shares concurrent refreshes, caps requests, caches successes and retains offline stories',async()=>{
 vi.mocked(boundedJSON).mockImplementation(async url=>url.includes('featuredcategories')?feed:{});
 const a=loadCenterNews();const b=loadCenterNews();expect(a).toBe(b);
 expect(await a).toHaveLength(2);expect(boundedJSON).toHaveBeenCalledTimes(5);
 await loadCenterNews();expect(boundedJSON).toHaveBeenCalledTimes(5);
 vi.advanceTimersByTime(31*60*1000);vi.mocked(boundedJSON).mockRejectedValue(new Error('offline'));
 expect(await loadCenterNews()).toHaveLength(2);expect(newsIsCached()).toBe(true);
 const count=vi.mocked(boundedJSON).mock.calls.length;await loadCenterNews();expect(boundedJSON).toHaveBeenCalledTimes(count);
});
