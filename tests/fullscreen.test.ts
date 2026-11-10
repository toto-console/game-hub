import {describe,it,expect} from 'vitest';
import {fullscreenCSS} from '../src/fullscreen';
describe('route-only header suppression',()=>{
 it('only targets verified header classes while the Game Base room exists',()=>{const css=fullscreenCSS([{DashboardBar:'bar',Header:'head',CurrentUserAvatar:'avatar',Clock:'clock'}]);expect(css).toBe('body:has(.gbs-root.gbs-room) .bar{visibility:hidden!important;pointer-events:none!important;}\nbody:has(.gbs-root.gbs-room) .head{visibility:hidden!important;pointer-events:none!important;}');});
 it('rejects unrelated/malformed modules',()=>{expect(fullscreenCSS([{DashboardBar:'body, *',CurrentUserAvatar:'a',Clock:'b'},{Header:'any'}])).toBe('');expect(fullscreenCSS(undefined)).toBe('');});
});
