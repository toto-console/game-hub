import {describe,it,expect} from 'vitest';
import {packagePlatformAllowed as allowed} from '../src/package-platform';
describe('packaged frontend gate',()=>{
 it('allows only the matching Steam browser OS',()=>{
 expect(allowed('windows-x86_64','Win32')).toBe(true);
 expect(allowed('linux-x86_64','Linux x86_64')).toBe(true);
 for(const [target,host] of [['windows-x86_64','Linux x86_64'],['linux-x86_64','Win32'],['linux-x86_64','Linux aarch64'],['invalid','Win32'],['windows-x86_64','']])expect(allowed(target,host)).toBe(false);
 });
});
