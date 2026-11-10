import React from 'react';
import {it,expect,vi,afterEach,beforeAll} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
vi.mock('@decky/ui',async()=>{const React=await import('react');return {Navigation:{NavigateToSteamWeb:vi.fn()},GamepadButton:{SELECT:3},Focusable:React.forwardRef(({children,onActivate,focusClassName,noFocusRing,preferredFocus,onOKActionDescription,onOptionsButton,onOptionsActionDescription,onMenuButton,onMenuActionDescription,onButtonDown,actionDescriptionMap,'flow-children':flow,...props}:any,ref:any)=><div {...props} ref={ref} tabIndex={0} onClick={onActivate}>{children}</div>)};});
vi.mock('../src/themedeck-adapter',()=>({useSoundtrackScope:vi.fn(),highlightSoundtrack:vi.fn()}));
vi.mock('../src/GameAction',()=>({GameAction:()=> <button className="ghd-button">Play</button>}));
vi.mock('../src/home/upstream/steam',()=>({heroUrls:()=>[],landscapeUrls:()=>[],portraitUrls:()=>[],logoUrls:()=>[],openGameMenu:vi.fn()}));
vi.mock('../src/game-adapter',()=>({gameById:()=>({id:42}),loadGame:async()=>({achievements:[{id:'a',name:'Real achievement',description:'Genuine description',done:false}],total:99,done:8,news:[{title:'Patch notes',url:'https://steamcommunity.com/games/42/announcements/detail/1',date:1,author:'Developer',contents:'Real changes',official:true}],shots:[],movies:[]})}));
import {GameDetail} from '../src/home/GameDetail';
beforeAll(()=>{HTMLElement.prototype.scrollIntoView=vi.fn();window.matchMedia=vi.fn().mockReturnValue({matches:false});});
afterEach(cleanup);
it('shows real summary and returns one level to the same activity focus target before leaving Library detail',async()=>{
 const back=vi.fn();render(<GameDetail app={{appid:42,display_name:'Game',app_type:1,installed:true}} back={back}/>);
 const title=await screen.findByText('Real achievement');expect(screen.getByText('8%')).toBeTruthy();expect(screen.getByText('8/99')).toBeTruthy();const card=title.closest<HTMLElement>('.gh-detail-control')!;card.focus();fireEvent.click(card);
 expect(screen.getByRole('dialog')).toBeTruthy();fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape'});await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());await waitFor(()=>expect(document.activeElement).toBe(card));expect(back).not.toHaveBeenCalled();
 fireEvent.keyDown(card,{key:'Escape'});expect(back).toHaveBeenCalledOnce();
});
it('opens sanitized news in-page without leaving the selected game',async()=>{const back=vi.fn();render(<GameDetail app={{appid:42,display_name:'Game',app_type:1,installed:true}} back={back}/>);fireEvent.click((await screen.findByText('Patch notes')).closest('.gh-detail-control')!);expect(screen.getByRole('dialog').textContent).toContain('Real changes');expect(back).not.toHaveBeenCalled();});

it.each(['keyboard','controller'])('restores the full hero when navigating up from content with %s',async input=>{
 render(<GameDetail app={{appid:42,display_name:'Game',app_type:1,installed:true}} back={vi.fn()}/>);
 const activity=(await screen.findByText('Real achievement')).closest<HTMLElement>('.gh-detail-control')!;
 const main=document.querySelector<HTMLElement>('.gh-detail-main')!;
 const play=screen.getByText('Play');await waitFor(()=>expect(document.activeElement).toBe(play));
 main.scrollTop=650;activity.focus();
 const up=()=>input==='keyboard'?fireEvent.keyDown(document.activeElement!,{key:'ArrowUp',repeat:true}):fireEvent(document.activeElement!,new CustomEvent('vgp_ondirection',{bubbles:true,cancelable:true,detail:{button:9,is_repeat:true}}));
 up();expect(document.activeElement?.closest('.gh-achievement-filters')).toBeTruthy();up();expect(document.activeElement).toBe(play);expect(main.scrollTop).toBe(0);
 // Even when manual scrolling leaves focus on Play, another Up restores the hero.
 main.scrollTop=400;up();expect(main.scrollTop).toBe(0);expect(document.activeElement).toBe(play);
});

it('embeds the same achievements and official news without a second hero or soundtrack scope',async()=>{
 const back=vi.fn();render(<GameDetail app={{appid:42,display_name:'Game',app_type:1,installed:true}} homeMode back={back}/>);
 expect(document.querySelector('.gh-detail-hero')).toBeNull();expect(document.querySelector('.gh-detail-background')).toBeNull();
 await screen.findByText('8 / 99 earned · 8%');expect(screen.getByText('Friends Playing')).toBeTruthy();expect(screen.getByText('Activities')).toBeTruthy();
 const summary=document.querySelector<HTMLElement>('.gh-home-trophy')!;summary.focus();fireEvent.keyDown(summary,{key:'ArrowDown'});expect(document.activeElement?.closest('.gh-achievement-filters')).toBeTruthy();
 fireEvent.keyDown(document.activeElement!,{key:'Escape'});expect(document.activeElement).toBe(summary);expect(back).not.toHaveBeenCalled();
 fireEvent.keyDown(summary,{key:'ArrowUp'});expect(back).toHaveBeenCalledOnce();
 const card=(await screen.findByText('Real achievement')).closest<HTMLElement>('.gh-detail-control')!;card.focus();fireEvent.click(card);fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape'});await waitFor(()=>expect(document.activeElement).toBe(card));
});
