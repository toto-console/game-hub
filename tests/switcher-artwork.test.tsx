import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render} from '@testing-library/react';
import {switcherArtworkUrls} from '../src/library-art';
import {SwitcherArtwork} from '../src/SwitcherArtwork';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it.each(['https://steamloopback.host/custom/Steam%20Art/Mario%20(Recomp).PNG','https://steamloopback.host/custom/home/deck/Grid/Mario.webp'])('preserves Steam-provided shortcut artwork URL and case: %s',url=>{
 const app:any={appid:4294967000,app_type:1073741824};const custom=vi.fn(()=>[url]);
 vi.stubGlobal('appStore',{GetCustomVerticalCapsuleURLs:custom,GetIconURLForApp:()=> 'broken-icon'});
 expect(switcherArtworkUrls(app)).toEqual([url,'broken-icon']);expect(custom).toHaveBeenCalledWith(app);
 expect(switcherArtworkUrls(app).some(s=>s.includes('/assets/')||s.includes('steamstatic'))).toBe(false);
});
it('isolates a failing artwork getter and preserves official-game fallbacks',()=>{
 vi.stubGlobal('appStore',{GetIconURLForApp:()=>{throw Error('not ready');}});
 expect(switcherArtworkUrls({appid:42,app_type:1} as any)).toContain('/assets/42/library_600x900.jpg');
});
it('tries each candidate once then removes the broken image; new identity resets sources',()=>{
 const game:any={id:1,name:'Actual shortcut title',artwork:['bad','good','good']};
 const v=render(<SwitcherArtwork game={game}/>);
 fireEvent.error(v.container.querySelector('img')!);expect(v.container.querySelector('img')?.getAttribute('src')).toBe('good');
 fireEvent.error(v.container.querySelector('img')!);expect(v.container.querySelector('img')).toBeNull();expect(v.container.querySelector('.gs-art-fallback')).toBeTruthy();
 v.rerender(<SwitcherArtwork game={{...game,id:2,artwork:['new']}}/>);expect(v.container.querySelector('img')?.getAttribute('src')).toBe('new');
});
