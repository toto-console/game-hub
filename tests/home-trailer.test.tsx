import {act,cleanup,render} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {HomeTrailer} from '../src/home/HomeTrailer';

const fetchMovies=vi.hoisted(()=>vi.fn());
vi.mock('@decky/ui',()=>({}));
vi.mock('../src/store-content',()=>({boundedJSON:fetchMovies}));
vi.mock('../src/home/StoreMedia',()=>({mediaItems:(data:any)=>data.movies}));
vi.mock('../src/focus-motion',()=>({motionAllowed:()=>true}));
beforeEach(()=>{
 vi.useFakeTimers();
 (window as any).DeckyPluginLoader={plugins:[],deckyState:{publicState:()=>({installedPlugins:[],disabledPlugins:[]})}};
 for(const method of ['play','pause','load'] as const)vi.spyOn(HTMLMediaElement.prototype,method).mockImplementation(()=>Promise.resolve());
 fetchMovies.mockResolvedValue({42:{data:{movies:[{video:true,url:'https://example.org/trailer.mp4'}]}}});
});
afterEach(()=>{cleanup();delete (window as any).DeckyPluginLoader;vi.useRealTimers();vi.restoreAllMocks();fetchMovies.mockClear();});
it('starts a muted Steam preview after settling on a game without a companion',async()=>{
 const {container}=render(<HomeTrailer appid={42}/>);
 await act(()=>vi.advanceTimersByTimeAsync(3001));
 expect(container.querySelector('video')?.src).toBe('https://example.org/trailer.mp4');
 expect(container.querySelector('video')?.muted).toBe(true);
 expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
});
it('leaves playback to an installed TrailerHero player',async()=>{
 (window as any).DeckyPluginLoader.plugins.push({name:'TrailerHero'});
 const {container}=render(<HomeTrailer appid={42}/>);
 await act(()=>vi.advanceTimersByTimeAsync(3500));
 expect(container.querySelector('video')).toBeNull();
 expect(fetchMovies).not.toHaveBeenCalled();
});
