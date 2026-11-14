import {rememberWelcome,welcomeReturn} from '../src/home/welcome-layout';
const welcomeSettings=vi.hoisted(()=>vi.fn(async()=>({})));
vi.mock('@decky/api',()=>({callable:()=>welcomeSettings}));
import React from 'react';
import {it,expect,vi,beforeAll,afterEach} from 'vitest';
import {render,fireEvent,cleanup,act,waitFor} from '@testing-library/react';
const app={appid:42,display_name:'Selected game',installed:true,app_type:1};
const launch=vi.hoisted(()=>vi.fn());
vi.mock('@decky/ui',async()=>{const React=await import('react');return {Navigation:{Navigate:vi.fn()},Focusable:React.forwardRef(({children,'flow-children':flow,...p}:any,ref:any)=><div {...p} ref={ref}>{children}</div>)};});
vi.mock('../src/library-live',()=>({useLibraryRevision:()=>0}));
vi.mock('../src/themedeck-adapter',()=>({useSoundtrackScope:vi.fn(),highlightSoundtrack:vi.fn()}));
vi.mock('../src/home/WelcomeHub',()=>({WelcomeIcon:()=>null,WelcomeHub:({back,onContentFocus}:any)=><div className="gh-welcome"><button className="ghw-widget" data-welcome-entry="true" onFocus={onContentFocus} onKeyDown={e=>{if(e.key==='Escape'||e.key==='ArrowUp')back();}}>Welcome achievements</button></div>}));
vi.mock('../src/home/StorePreview',()=>({StorePreview:()=>null}));
vi.mock('../src/home/upstream/InfoCards',()=>({ActionCards:()=>null,GameCards:()=>null}));
vi.mock('../src/home/GameDetail',()=>({GameDetail:({back}:any)=><div className="gh-home-details"><div className="gh-home-summary"><button className="gh-detail-control" onKeyDown={e=>{if(e.key==='ArrowUp')back();}}>Achievements</button></div></div>}));
vi.mock('../src/GameAction',()=>({GameAction:({onFocus}:any)=><div className="gh-primary-action"><button className="ghd-button" onFocus={onFocus} onClick={launch}>Play</button></div>}));
vi.mock('../src/home/upstream/components',()=>({Art:()=>null,Button:({onActivate,onFocus,children}:any)=><button className="ghd-button" onFocus={onFocus} onClick={onActivate}>{children}</button>,Row:({children,className}:any)=><div className={`ghd-section ${className??''}`}><div className="ghd-row-anchor">{children}</div></div>,ActionTile:({label,onFocus}:any)=><button className="ghd-tile" onFocus={e=>onFocus?.(e.currentTarget)}>{label}</button>,GameTile:({app,onFocus}:any)=><button className="ghd-tile" onFocus={e=>onFocus?.(app,e.currentTarget)}>{app.display_name}</button>}));
vi.mock('../src/home/upstream/steam',()=>({APP_TYPE_SHORTCUT:1073741824,recentApps:()=>[{appid:42,display_name:'Selected game',installed:true,app_type:1}],favoriteApps:()=>[{appid:99,display_name:'Favorite app regression',installed:true,app_type:1}],installedApps:()=>[],softwareApps:()=>[],gameApps:()=>[],byRecent:()=>0,heroUrls:()=>[],landscapeUrls:()=>[],portraitUrls:()=>[],logoUrls:()=>[],lastPlayedText:()=>'',playtimeText:()=>'',runningAppId:()=>0,openGameMenu:vi.fn(),openStore:vi.fn(),ROUTES:{}}));
import {rememberWelcomeSettings} from '../src/home/welcome-settings-cache';
import {defaults} from '../src/home/welcome-layout';
import {HomeTab} from '../src/home/upstream/Ps5Home';
import {highlightSoundtrack} from '../src/themedeck-adapter';
beforeAll(()=>{window.matchMedia=vi.fn().mockReturnValue({matches:false});HTMLElement.prototype.scrollTo=vi.fn();});
afterEach(()=>{cleanup();rememberWelcome(undefined);rememberWelcomeSettings(defaults());launch.mockClear();welcomeSettings.mockResolvedValue({});});
it.each(['keyboard','controller'])('Down enters Play and summaries without launching or reselecting music: %s',mode=>{
 const v=render(<HomeTab goTab={()=>{}}/>);const tile=v.getAllByText('Selected game').find(e=>e.classList.contains('ghd-tile'))!;act(()=>tile.focus());vi.mocked(highlightSoundtrack).mockClear();
 const down=()=>mode==='keyboard'?fireEvent.keyDown(document.activeElement!,{key:'ArrowDown'}):fireEvent(document.activeElement!,new CustomEvent('vgp_ondirection',{bubbles:true,cancelable:true,detail:{button:10}}));
 expect(v.queryByText('Favorite app regression')).toBeNull();
 down();expect(document.activeElement).toBe(v.getByText('Play'));expect(v.container.querySelector('.ghd-scroller')?.getAttribute('data-expanded')).toBe('true');expect(launch).not.toHaveBeenCalled();expect(v.container.querySelector('.gh-home-game-heading')?.getAttribute('data-visible')).toBe('true');
 down();expect(document.activeElement).toBe(v.getByText('Achievements'));expect(highlightSoundtrack).not.toHaveBeenCalled();
 fireEvent.keyDown(document.activeElement!,{key:'ArrowUp'});expect(document.activeElement).toBe(v.getByText('Play'));fireEvent.keyDown(document.activeElement!,{key:'Escape'});expect(document.activeElement).toBe(tile);expect(v.queryByText('Favorite app regression')).toBeNull();expect(v.container.querySelector('.gh-home-game-heading')?.getAttribute('data-visible')).toBe('false');expect(launch).not.toHaveBeenCalled();
 down();fireEvent.click(v.getByText('Play'));expect(launch).toHaveBeenCalledOnce();
});

it('Welcome receives Down and returns to its own tile without exposing game controls',()=>{
 const v=render(<HomeTab goTab={()=>{}}/>);const tile=v.getByRole('button',{name:'Welcome'});fireEvent.focus(tile);
 expect(v.queryByText('Play')).toBeNull();expect(v.queryByText('Favorite app regression')).toBeNull();
 fireEvent.keyDown(tile,{key:'ArrowDown'});expect(document.activeElement).toBe(v.getByText('Welcome achievements'));expect(v.container.querySelector('.gh-home-game-heading')?.getAttribute('data-visible')).toBe('true');
 fireEvent.keyDown(document.activeElement!,{key:'Escape'});expect(document.activeElement).toBe(tile);
 const game=v.getAllByText('Selected game').find(e=>e.classList.contains('ghd-tile'))!;fireEvent.focus(game);expect(v.queryByText('Welcome achievements')).toBeNull();expect(v.getByText('Play')).toBeTruthy();
});
it('starts a fresh Home on Welcome instead of recent games',()=>{const v=render(<HomeTab goTab={()=>{}}/>);expect(v.getByText('Welcome achievements')).toBeTruthy();expect(v.queryByText('Play')).toBeNull();expect(v.getByRole('button',{name:'Welcome'}).classList.contains('ghd-selected')).toBe(true);});


it('keeps an opted-in Welcome wallpaper when selecting a game',async()=>{rememberWelcomeSettings({...defaults(),wallpaperScope:'home',background:'local',image:'data:image/png;base64,AAAA'});const v=render(<HomeTab goTab={()=>{}}/>);await waitFor(()=>expect(v.container.querySelector('.ghd-backdrop')).toBeNull());const game=v.getAllByText('Selected game').find(e=>e.classList.contains('ghd-tile'))!;act(()=>game.focus());expect(v.container.querySelector('.ghw-background img')?.getAttribute('src')).toBe('data:image/png;base64,AAAA');expect(v.getByText('Play')).toBeTruthy();});
it('keeps the same saved wallpaper node while leaving and returning to Welcome',async()=>{rememberWelcomeSettings({...defaults(),wallpaperScope:'welcome',background:'local',image:'data:image/png;base64,AAAA'});const v=render(<HomeTab goTab={()=>{}}/>);await waitFor(()=>expect(v.container.querySelector('.ghw-background img')).toBeTruthy());const image=v.container.querySelector('.ghw-background img')!;const game=v.getAllByText('Selected game').find(e=>e.classList.contains('ghd-tile'))!;act(()=>game.focus());expect(v.container.querySelector('.ghw-background img')).toBe(image);expect(image.parentElement?.hidden).toBe(true);act(()=>v.getByRole('button',{name:'Welcome'}).focus());expect(v.container.querySelector('.ghw-background img')).toBe(image);expect(image.parentElement?.hidden).toBe(false);});

it('restores Welcome expanded before paint and rejects stale top-row focus until intentional Up',()=>{
 rememberWelcome('achievements',{top:220,left:400});
 const v=render(<HomeTab goTab={()=>{}}/>);
 expect(v.container.querySelector('.ghd-scroller')?.getAttribute('data-expanded')).toBe('true');
 const game=v.getAllByText('Selected game').find(e=>e.classList.contains('ghd-tile'))!;
 act(()=>game.focus());expect(v.queryByText('Play')).toBeNull();
 expect(v.container.querySelector('.ghd-scroller')?.getAttribute('data-expanded')).toBe('true');
 fireEvent.keyDown(v.getByText('Welcome achievements'),{key:'ArrowUp'});
 expect(v.container.querySelector('.ghd-scroller')?.getAttribute('data-expanded')).toBe('false');expect(welcomeReturn).toBeUndefined();
 act(()=>game.focus());expect(v.getByText('Play')).toBeTruthy();
});

it('releases header focus ownership when Welcome becomes inactive',()=>{
 rememberWelcome('achievements');
 const tree=(active:boolean)=><div className="ghd-root"><div className="ghd-topicons"/><HomeTab goTab={()=>{}} active={active}/></div>;
 const v=render(tree(true));const header=v.container.querySelector<HTMLElement>('.ghd-topicons')!;
 expect(header.inert).toBe(true);v.rerender(tree(false));expect(header.inert).not.toBe(true);
 v.rerender(tree(true));expect(header.inert).toBe(true);
});
