import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,fireEvent,cleanup,act} from '@testing-library/react';
vi.mock('../src/game-adapter',()=>({recentGames:()=>[]}));
vi.mock('../src/store-content',()=>({boundedJSON:vi.fn()}));
import {boundedJSON} from '../src/store-content';
import {resetCenterNews} from '../src/center-news';
import {GameNewsCard} from '../src/GameNewsCard';
import type {Controls} from '../src/Panel';
const controls={Button:({children,...props}:any)=><button {...props}>{children}</button>} as Controls;
afterEach(()=>{cleanup();resetCenterNews();});
it('loads even while focused, opens the real listing and cycles with controller Menu',async()=>{
 vi.mocked(boundedJSON).mockImplementation(async url=>url.includes('featuredcategories')?{new_releases:{items:[{id:10,type:0,name:'One'},{id:20,type:0,name:'Two'}]}}:{});
 const open=vi.fn();const v=render(<GameNewsCard controls={controls} active open={open}/>);
 v.getByRole('button').focus();
 await act(async()=>{await new Promise(resolve=>setTimeout(resolve,0));});
 expect(v.getByText('One')).toBeTruthy();fireEvent.click(v.getByRole('button'));expect(open).toHaveBeenCalledWith('https://store.steampowered.com/app/10/');
 fireEvent(v.getByRole('button'),new CustomEvent('vgp_onmenu',{bubbles:true,cancelable:true,detail:{}}));expect(v.getByText('One')).toBeTruthy();expect(v.getByRole('button').parentElement?.getAttribute('data-news-expanded')).toBe('true');
 fireEvent(v.getByRole('button'),new CustomEvent('vgp_onmenu',{bubbles:true,cancelable:true,detail:{}}));expect(v.getByText('Two')).toBeTruthy();
 fireEvent(v.getByRole('button').parentElement!,new Event('gcc_news_collapse'));expect(v.getByRole('button').parentElement?.getAttribute('data-news-expanded')).toBe('false');
});
it('does not request news while the social preview is inactive',()=>{
 vi.mocked(boundedJSON).mockClear();render(<GameNewsCard controls={controls} active={false} open={()=>{}}/>);expect(boundedJSON).not.toHaveBeenCalled();
});
