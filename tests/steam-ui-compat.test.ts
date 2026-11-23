import {describe,it,expect} from 'vitest';
import {classSelector,resolveSteamUI,steamUIReport} from '../src/steam-ui-compat';
import {fullscreenCSS} from '../src/fullscreen';
import {footerSelector} from '../src/center-footer';
import local from './fixtures/steam-ui-local.json';
describe('Steam CSS capability adapter',()=>{
 it('resolves the captured local exports without stored hashes in runtime code',()=>{
  expect(resolveSteamUI(local.modules,'header')?.Header).toBe(local.modules[0].Header);
  expect(fullscreenCSS(local.modules)).toContain('.'+local.modules[0].DashboardBar);
  expect(footerSelector(local.modules)).toBe('.'+local.modules[2].BasicFooter);
 });
 it('survives synthetic hash renaming while semantic export keys remain intact (not Beta evidence)',()=>{
  const renamed=local.modules.map(m=>Object.fromEntries(Object.keys(m).map((k,i)=>[k,`synthetic_${k}_${i}`])));
  const css=fullscreenCSS(renamed);expect(css).toContain('.synthetic_DashboardBar_');expect(css).not.toContain(local.modules[0].Header);
  expect(resolveSteamUI(renamed,'browser')).toBeDefined();expect(steamUIReport(renamed).footer.status).toBe('resolved');
 });
 it('handles composed class exports and digit prefixes without broadening the selector',()=>{
  expect(classSelector('one two one')).toBe('.one.two');
  expect(classSelector('1test')).toBe('[class~="1test"]');
  const el=document.createElement('div');el.className='1test';document.body.append(el);expect(document.querySelector(classSelector('1test'))).toBe(el);el.remove();
 });
 it.each(['', 'body, *', 'foo > bar', 'ok;display:none', '-', null])('rejects malformed classes %s',value=>expect(classSelector(value)).toBe(''));
 it('rejects an ambiguous header and never falls back to a broad guessed selector',()=>{
  expect(resolveSteamUI([...local.modules,{...local.modules[0],Header:'different'}],'header')).toBeUndefined();
  expect(fullscreenCSS([{Header:'guess'}])).toBe('');
 });
 it('accepts duplicate identical module exports',()=>expect(resolveSteamUI([...local.modules,local.modules[0]],'header')).toBeDefined());
 it('reports missing exports without claiming a client version',()=>{
  expect(steamUIReport([])).toEqual({header:{status:'unresolved',selectors:{}},browser:{status:'unresolved',selectors:{}},footer:{status:'unresolved',selectors:{}}});
 });
});
