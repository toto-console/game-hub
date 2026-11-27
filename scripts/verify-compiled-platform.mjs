import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
// Check Rollup output, not source: constant folding previously removed both
// production branches before the packager substituted the target marker.
const bundle=readFileSync(process.argv[2]??'dist/index.js','utf8');
const gate=bundle.match(/function packagePlatformAllowed\([^]*?\n\}/)?.[0];
const argument=bundle.match(/!packagePlatformAllowed\(([^]*?), navigator\.platform\)/)?.[1];
assert(gate&&argument,'Compiled platform guard missing or changed; review the emitted bundle');
for(const [target,platform,allowed] of [
 ['windows-x86_64','Win32',true],['windows-x86_64','Linux x86_64',false],
 ['linux-x86_64','Linux x86_64',true],['linux-x86_64','Win32',false],
 ['linux-x86_64','Linux aarch64',false],['unknown','Win32',false],
]) {
 const expression=argument.replaceAll('__GAMEHUB_PACKAGE_TARGET__',target);
 assert.equal(runInNewContext(`${gate}; packagePlatformAllowed(${expression}, platform)`,{platform},{timeout:1000}),allowed,`${target} on ${platform}`);
}
console.log('Compiled frontend platform guard: all six allow/refuse checks passed');
