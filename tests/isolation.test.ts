import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
import {css} from '../src/styles';
describe('visual isolation',()=>{
 it('anchors every CSS selector to the plugin root',()=>{postcss.parse(css).walkRules(rule=>{if(rule.parent?.type==='atrule'&&/keyframes$/.test((rule.parent as any).name))return;for(const selector of rule.selectors)expect(selector.trim()).toMatch(/^(?:\.gbs-root|#game-hub-control-center)(?:[\s.[:]|$)/);});expect(css).not.toMatch(/:root|@font-face/);});
 it('uses paired route/global lifecycle registration without cross-target script injection',()=>{const source=readFileSync('src/index.tsx','utf8');expect(source).not.toMatch(/injectCssIntoTab|executeInTab/);expect(source).toContain('routerHook.removeRoute(ROUTE)');expect(source).toContain("routerHook.removeGlobalComponent('GameBaseControlCenter')");const home=readFileSync('src/home/module.tsx','utf8');expect(home).toContain("routerHook.removePatch('/library'");});
});
