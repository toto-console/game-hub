import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,fireEvent,cleanup} from '@testing-library/react';
vi.mock('@decky/ui',async()=>{const React=await import('react');return {GamepadButton:{SELECT:3},Focusable:React.forwardRef(({children,focusClassName,noFocusRing,preferredFocus,onActivate,onOKActionDescription,onOptionsButton,onOptionsActionDescription,onMenuButton,onMenuActionDescription,onButtonDown,actionDescriptionMap,...props}:any,ref:any)=><div {...props} ref={ref}>{children}</div>)};});
vi.mock('../src/themedeck-adapter',()=>({highlightSoundtrack:vi.fn()}));
vi.mock('../src/home/upstream/steam',()=>({}));
import {Tile,Art} from '../src/home/upstream/components';
import {movedPointer} from '../src/home/pointer-intent';
afterEach(cleanup);
it('does not move selection when animation exposes tiles under a stationary pointer',()=>{
 const select=vi.fn();const {container}=render(<><Tile label="One" onActivate={()=>{}} onFocus={select}>One</Tile><Tile label="Two" onActivate={()=>{}} onFocus={select}>Two</Tile></>);const tiles=container.querySelectorAll<HTMLElement>('.ghd-tile');
 fireEvent.mouseEnter(tiles[0],{clientX:500,clientY:120});fireEvent.mouseEnter(tiles[1],{clientX:500,clientY:120});expect(select).not.toHaveBeenCalled();
 fireEvent.mouseMove(tiles[0],{clientX:500,clientY:120});fireEvent.mouseMove(tiles[0],{clientX:504,clientY:120});expect(select).toHaveBeenCalledOnce();
 for(let i=0;i<30;i++){fireEvent.mouseEnter(tiles[i%2],{clientX:504,clientY:120});fireEvent.mouseMove(tiles[i%2],{clientX:504,clientY:120});}expect(select).toHaveBeenCalledOnce();
 fireEvent.mouseMove(tiles[1],{clientX:520,clientY:120});expect(select).toHaveBeenCalledTimes(2);
 // Steam's focus callback is independent of mouse intent.
 (tiles[0] as any).__psdFocus();expect(select).toHaveBeenCalledTimes(3);
});
it('keeps pointer baselines separate for Steam windows',()=>{const doc=document.implementation.createHTMLDocument(),other=document.implementation.createHTMLDocument();const event=(ownerDocument:Document,x:number)=>({currentTarget:{ownerDocument},clientX:x,clientY:100});expect(movedPointer(event(doc,100))).toBe(false);expect(movedPointer(event(doc,101))).toBe(true);expect(movedPointer(event(other,101))).toBe(false);expect(movedPointer(event(doc,101))).toBe(false);});

it('restarts artwork fallback at the first custom image without applying old-image errors',()=>{
 const ui=render(<Art sources={['/customimages/old','/assets/old']} fallback={<span>Missing</span>}/>);
 fireEvent.error(ui.container.querySelector('img')!);expect(ui.container.querySelector('img')!.getAttribute('src')).toBe('/assets/old');
 const old=ui.container.querySelector('img')!;ui.rerender(<Art sources={['/customimages/new','/assets/new']} fallback={<span>Missing</span>}/>);
 expect(ui.container.querySelector('img')!.getAttribute('src')).toBe('/customimages/new');fireEvent.error(old);
 expect(ui.container.querySelector('img')!.getAttribute('src')).toBe('/customimages/new');
});
