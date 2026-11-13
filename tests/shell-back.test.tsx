import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render} from '@testing-library/react';
const handlers=vi.hoisted(()=>({cancel:undefined as any,navigate:vi.fn()}));
vi.mock('@decky/ui',()=>({Navigation:{Navigate:handlers.navigate},GamepadButton:{BUMPER_LEFT:4,BUMPER_RIGHT:5},Focusable:({children,className,onCancelButton}:any)=>{if(className==='ghd-content')handlers.cancel=onCancelButton;return <div className={className}>{children}</div>;}}));
vi.mock('../src/i18n',async original=>({...await original<any>(),T:({text}:any)=>text,useLanguage:()=>{}}));
vi.mock('../src/presence',()=>({readDockPresence:()=>({profile:'online'}),OnlineStatusDot:()=>null}));
vi.mock('../src/home/upstream/steam',()=>({ROUTES:{},openStore:vi.fn(),persona:()=>({})}));
vi.mock('../src/home/upstream/components',()=>({Card:()=>null,IconButton:()=>null,useFocusReveal:()=>{}}));
vi.mock('../src/home/upstream/MediaHome',()=>({MediaHome:()=>null}));
vi.mock('../src/home/upstream/Library',()=>({LibraryTab:({back}:any)=><button onClick={back}>Library Back</button>}));
vi.mock('../src/home/upstream/Ps5Home',()=>({HomeTab:({goTab}:any)=><div className="ghd-scroller"><button className="ghd-selected" onClick={()=>goTab('library')}>Home Library</button></div>}));
import {Ps5Shell} from '../src/home/upstream/Shell';
afterEach(()=>{cleanup();vi.clearAllMocks();vi.unstubAllGlobals();});
function setup(tab:'games'|'library'){
 vi.stubGlobal('requestAnimationFrame',()=>0);vi.stubGlobal('cancelAnimationFrame',()=>{});
 return render(<Ps5Shell initialTab={tab}/>);
}
function back(){const e={preventDefault:vi.fn(),stopPropagation:vi.fn()};act(()=>handlers.cancel(e));expect(e.preventDefault).toHaveBeenCalledOnce();expect(e.stopPropagation).toHaveBeenCalledOnce();}
it('consumes repeated controller Back at Home instead of invoking native Steam history',()=>{
 const v=setup('games');for(let i=0;i<5;i++)back();
 expect(handlers.navigate).not.toHaveBeenCalled();expect(v.container.querySelector('.ghd-tab-games')).toBeTruthy();
});
it('returns an embedded Library to Home and keeps subsequent Back there',()=>{
 const v=setup('games');fireEvent.click(v.getByText('Home Library'));expect(v.getByText('Library Back')).toBeTruthy();
 back();expect(v.queryByText('Library Back')).toBeNull();back();
 expect(handlers.navigate).not.toHaveBeenCalled();expect(v.container.querySelector('.ghd-tab-games')).toBeTruthy();
});
it('routes standalone Library Back directly to registered Game Hub Home',()=>{
 const v=setup('library');back();expect(handlers.navigate).toHaveBeenCalledExactlyOnceWith('/game-hub/home');
 v.rerender(<Ps5Shell initialTab="games"/>);back();back();
 expect(v.queryByText('Library Back')).toBeNull();expect(handlers.navigate).toHaveBeenCalledTimes(1);
});
