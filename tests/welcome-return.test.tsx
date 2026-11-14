import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render} from '@testing-library/react';
const state=vi.hoisted(()=>({route:undefined as any,stop:vi.fn(),open:vi.fn()}));
vi.mock('@decky/api',()=>({callable:()=>vi.fn()}));
vi.mock('@decky/ui',()=>({Navigation:{Navigate:vi.fn()},Router:{WindowStore:{SteamUIWindows:[{BrowserWindow:window,LocationPathName:'/game-hub/home',m_history:{listen:(fn:any)=>{state.route=fn;return state.stop;}}}]}},Focusable:React.forwardRef(({children,flowChildren,focusClassName,noFocusRing,preferredFocus,onActivate,...props}:any,ref:any)=><div ref={ref} {...props}>{children}</div>)}));
vi.mock('../src/home/welcome-data',()=>({useWelcomeData:()=>({friends:{kind:'ready',friends:[]},inbox:{conversations:[]},controllers:[],system:{},news:[],store:[]})}));
vi.mock('../src/home/upstream/components',()=>({Art:()=>null,useFocusHook:()=>React.useRef(null)}));
vi.mock('../src/home/upstream/steam',()=>({openAchievements:state.open,openStore:vi.fn(),openDetails:vi.fn(),heroUrls:()=>[],portraitUrls:()=>[],landscapeUrls:()=>[]}));
import {WelcomeHub} from '../src/home/WelcomeHub';
import {defaults,rememberWelcome,welcomePosition,welcomeReturn} from '../src/home/welcome-layout';
afterEach(()=>{cleanup();rememberWelcome(undefined);vi.clearAllMocks();});
it('restores widget and both scroll axes on remount and retained-route POP, and detaches history',()=>{
 window.matchMedia=vi.fn().mockReturnValue({matches:false});HTMLElement.prototype.scrollBy=vi.fn();
 const back=vi.fn(),focused=vi.fn(),app:any={appid:42,display_name:'Test'};
 const tree=()=> <div className="ghd-scroller"><WelcomeHub active app={app} back={back} onContentFocus={focused} initialSettings={defaults()} backgroundManaged/></div>;
 const first=render(tree());const widget=first.getByRole('button',{name:'Achievements'});
 first.container.querySelector('.ghd-scroller')!.scrollTop=180;first.container.querySelector('.ghw-viewport')!.scrollLeft=260;
 fireEvent.click(widget);expect(state.open).toHaveBeenCalledWith(app);expect(welcomeReturn).toBe('achievements');expect(welcomePosition).toEqual({top:180,left:260});first.unmount();
 const second=render(tree());expect(document.activeElement).toBe(second.getByRole('button',{name:'Achievements'}));
 expect(second.container.querySelector('.ghd-scroller')!.scrollTop).toBe(180);expect(second.container.querySelector('.ghw-viewport')!.scrollLeft).toBe(260);
 for(let i=0;i<3;i++){second.container.querySelector('.ghd-scroller')!.scrollTop=0;act(()=>state.route({pathname:'/game-hub/home'},'POP'));expect(second.container.querySelector('.ghd-scroller')!.scrollTop).toBe(180);}
 fireEvent.keyDown(document.activeElement!,{key:'Escape'});expect(back).not.toHaveBeenCalled();
 for(let i=0;i<4&&!back.mock.calls.length;i++)fireEvent.keyDown(document.activeElement!,{key:'ArrowUp'});
 expect(back).toHaveBeenCalledOnce();
 second.unmount();expect(state.stop).toHaveBeenCalledTimes(2);
});
