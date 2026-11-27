import {describe,it,expect} from 'vitest';
import {resolveBetaCSS} from '../src/steam-beta-css';
import captured from './fixtures/steam-beta-esm.json';
// Construct captured functions but never invoke them. Production uses Decky's
// existing functions directly; no evaluation or mutation of Steam code.
const scope=()=>({...captured.classes,...Object.fromEntries(Object.entries(captured.sources).map(([key,text])=>[key,new Function(`return (${text})`)()]))});
describe('actual Steam Beta ES-module CSS adapter',()=>{
 it('resolves all three roles from the installed 1795048523 capture',()=>{
  expect(resolveBetaCSS([scope()])).toEqual({
   header:{DashboardBar:captured.classes.r9i,Header:captured.classes.r9i},
   footer:{BasicFooter:captured.classes.kDi,FooterLegend:captured.classes.ADi},
   browser:{MainBrowserContainer:captured.classes.$nn,BrowserContainer:'aC4buUcp-PM-',URLBar:captured.classes.ern},
  });
 });
 it('accepts duplicate scope exports but rejects conflicting mappings',()=>{
  expect(resolveBetaCSS([scope(),scope()]).header).toBeDefined();
  expect(resolveBetaCSS([scope(),{...scope(),r9i:'different'}]).header).toBeUndefined();
 });
 it('requires component signatures, not arbitrary matching class strings',()=>{
  expect(resolveBetaCSS([captured.classes])).toEqual({header:undefined,footer:undefined,browser:undefined});
  expect(resolveBetaCSS([{...scope(),$nn:'body > *'}]).browser).toBeUndefined();
 });
 it('follows renamed scope variables and hashes without a stored hash table',()=>{
  const s=scope();s.r9i='renamed-header';s.kDi='renamed-footer';
  expect(resolveBetaCSS([s]).header?.Header).toBe('renamed-header');
  expect(resolveBetaCSS([s]).footer?.BasicFooter).toBe('renamed-footer');
 });
});
