import {readFileSync,writeFileSync} from 'node:fs';
import ts from 'typescript';
// Use the same reflection implementation as Home and Control Center, without a new input system.
const source=readFileSync('src/focus-gloss.ts','utf8').replace('export function connectFocusGloss','function connectFocusGloss');
writeFileSync('store-theme/focus-gloss.js',ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.None}}).outputText);

