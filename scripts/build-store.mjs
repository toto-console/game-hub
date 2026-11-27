import {readFileSync,writeFileSync} from 'node:fs';
import ts from 'typescript';
// Use the same reflection implementation as Home and Control Center, without a new input system.
const source=readFileSync('src/focus-gloss.ts','utf8').replace('export function connectFocusGloss','function connectFocusGloss');
writeFileSync('store-theme/focus-gloss.js',ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.None}}).outputText);


// Share the exact rare-diamond and trophy-row visuals with the native profile panels.
const achievement=readFileSync('src/achievement-page-style.ts','utf8');
writeFileSync('store-theme/profile-achievements.css',achievement.slice(achievement.indexOf('`')+1,achievement.lastIndexOf('`')));

// The profile runs in Steam's separate Community document without a module loader.
const engine=readFileSync('src/home/scroll-engine.ts','utf8').replaceAll('export function','function');
const motion=readFileSync('src/home/console-motion.ts','utf8').split('export const homeSequence')[0].replace('export const','const');
writeFileSync('store-theme/scroll-engine.js',ts.transpileModule(motion+engine,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText);
