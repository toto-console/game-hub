import {copyFileSync, cpSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';

// Decky CLI archives dist, defaults and py_modules, plus a few top-level files.
const target = 'linux-x86_64';
const bundle = readFileSync('dist/index.js','utf8');
if (!bundle.includes('__GAMEHUB_PACKAGE_TARGET__')) throw new Error('Missing platform marker');
writeFileSync('dist/index.js',bundle.replaceAll('__GAMEHUB_PACKAGE_TARGET__',target));
mkdirSync('defaults',{recursive:true});
writeFileSync('defaults/platform-target.json',JSON.stringify({schema:1,platform:target,steamChannel:'linux',automaticInstall:false,experimental:true}));
cpSync('store-theme','defaults/store-theme',{recursive:true});
cpSync('licenses','defaults/licenses',{recursive:true});
copyFileSync('THIRD-PARTY-NOTICES.md','defaults/THIRD-PARTY-NOTICES.md');
copyFileSync('node_modules/hls.js/LICENSE','defaults/licenses/hls.js-LICENSE');
const provider='third_party/playhub-notifications';
for (const name of ['NOTICE','LICENSE','third_party/Achievements-MIT-LICENSE.txt']) {
  copyFileSync(provider+'/'+name,'defaults/licenses/Playhub-'+name.split('/').pop());
}
mkdirSync('dist/assets/notifications',{recursive:true});
for (const cue of ['system','message','achievement']) {
  copyFileSync(provider+'/assets/sounds/playstation/'+cue+'.wav','dist/assets/notifications/'+cue+'.wav');
}
