import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,act,cleanup,waitFor} from '@testing-library/react';
const fixture=vi.hoisted(()=>({apps:Array.from({length:12},(_,i)=>({appid:i+1,display_name:`Game ${i+1}`,app_type:1,installed:true}))}));
vi.mock('@decky/ui',async()=>{const React=await import('react');return {Navigation:{Navigate:vi.fn()},GamepadButton:{BUMPER_LEFT:4,BUMPER_RIGHT:5},Focusable:React.forwardRef(({children,focusClassName,noFocusRing,onActivate,onCancelButton,'flow-children':flow,...props}:any,ref:any)=><div {...props} ref={ref} tabIndex={0} onClick={onActivate}>{children}</div>)};});
vi.mock('../src/home/GameDetail',()=>({GameDetail:()=>null}));
vi.mock('../src/themedeck-adapter',()=>({useSoundtrackScope:vi.fn()}));
vi.mock('../src/library-live',()=>({useLibraryRevision:()=>0}));
vi.mock('../src/home/upstream/components',()=>({FOCUSED_CLASS:'ghd-focused',GameTile:({app,onActivate}:any)=><button className="ghd-tile" onClick={onActivate}>{app.display_name}</button>}));
vi.mock('../src/library-data',()=>({SHORTCUT:1073741824,lastPlayed:()=>0,isInstalled:(a:any)=>a.installed,readLibrary:()=>({ready:true,entries:fixture.apps,collections:[],favorites:[]})}));
import {LibraryTab} from '../src/home/upstream/Library';
const direction=(button:number)=>{let accepted=true;act(()=>{accepted=document.activeElement!.dispatchEvent(new CustomEvent('vgp_ondirection',{bubbles:true,cancelable:true,detail:{button,is_repeat:true}}));});return accepted;};
afterEach(()=>{cleanup();sessionStorage.clear();});
it('contains held Up at the tabs and all tab edges without losing focus to Steam',async()=>{
 const back=vi.fn(),escaped=vi.fn();render(<LibraryTab back={back}/>);const grid=document.querySelectorAll<HTMLElement>('.ghd-tile');await waitFor(()=>expect(document.activeElement).toBe(grid[0]));grid[11].focus();document.addEventListener('vgp_ondirection',escaped);
 for(let i=0;i<60;i++)expect(direction(9)).toBe(false);
 const tabs=document.querySelectorAll<HTMLElement>('.ghl-tabs .ghl-control');expect(document.activeElement).toBe(tabs[0]);
 for(let i=0;i<12;i++)direction(11);expect(document.activeElement).toBe(tabs[0]);direction(12);expect(document.activeElement).toBe(tabs[1]);for(let i=0;i<12;i++)direction(12);expect(document.activeElement).toBe(tabs[1]);
 expect(escaped).not.toHaveBeenCalled();expect(back).not.toHaveBeenCalled();direction(10);expect(document.activeElement?.closest('.ghl-grid')).toBeTruthy();document.removeEventListener('vgp_ondirection',escaped);
});
it('contains held arrows on Sort and keyboard Up at the header',async()=>{render(<LibraryTab back={vi.fn()}/>);await waitFor(()=>expect(document.activeElement?.classList.contains('ghd-tile')).toBe(true));const sort=document.querySelector<HTMLElement>('.ghl-sort')!;sort.focus();for(let i=0;i<20;i++)expect(direction(11)).toBe(false);expect(document.activeElement).toBe(sort);direction(9);const tab=document.activeElement;for(let i=0;i<20;i++){let accepted=true;act(()=>{accepted=tab!.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',repeat:true,bubbles:true,cancelable:true}));});expect(accepted).toBe(false);}expect(document.activeElement).toBe(tab);});

 it('plays confirmation when opening a Library game',async()=>{const {setSelectionSound}=await import('../src/navigation');const sound=vi.fn();setSelectionSound(sound);try{render(<LibraryTab back={vi.fn()}/>);await waitFor(()=>expect(document.activeElement?.classList.contains('ghd-tile')).toBe(true));act(()=>document.querySelector<HTMLElement>('.ghd-tile')!.click());expect(sound).toHaveBeenCalledOnce();}finally{setSelectionSound(()=>{});}});
