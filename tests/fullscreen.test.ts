import {describe,it,expect} from 'vitest';
import {fullscreenCSS,homeHeaderCSS} from '../src/fullscreen';
describe('route-only header suppression',()=>{
 it('only targets verified header classes while the Game Base room exists',()=>{const css=fullscreenCSS([{DashboardBar:'bar',Header:'head',CurrentUserAvatar:'avatar',Clock:'clock'}]);expect(css).toBe('body:has(.gbs-root.gbs-room) .bar{visibility:hidden!important;pointer-events:none!important;}\nbody:has(.gbs-root.gbs-room) .head{visibility:hidden!important;pointer-events:none!important;}');});
 it('rejects unrelated/malformed modules',()=>{expect(fullscreenCSS([{DashboardBar:'body, *',CurrentUserAvatar:'a',Clock:'b'},{Header:'any'}])).toBe('');expect(fullscreenCSS(undefined)).toBe('');});
});


it('hides the native bar only while integrated Home or Library is mounted',()=>{const css=homeHeaderCSS([{DashboardBar:'native-bar',Header:'native-head',CurrentUserAvatar:'avatar',Clock:'clock'}]);expect(css).toContain('body:has(.gh-home-module) .native-bar{display:none!important');expect(css).toContain('body:has(.gh-home-module) .native-head{display:none!important');expect(css).not.toContain('.ghd-topicons');expect(homeHeaderCSS([{Header:'unverified'}])).toBe('');});
