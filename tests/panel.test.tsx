import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,act} from '@testing-library/react';
import {useState} from 'react';
vi.mock('@decky/ui',()=>({findModuleExport:()=>undefined}));
import {Panel} from '../src/Panel';
import {defaults,type Settings} from '../src/settings';
import {browserControls} from '../preview/controls';
import type {SocialBridge} from '../src/model';
beforeEach(()=>{vi.stubGlobal('matchMedia',()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()}));});
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();});
function harness(initial:Partial<Settings>={},fail=false){
 const bridge:SocialBridge={readFriends:vi.fn<SocialBridge['readFriends']>(()=>({kind:'ready',detail:'Read from Steam',friends:[{id:'76561198000000001',name:'Real friend',state:'online'}]})),openNative:vi.fn(()=>{if(fail)throw Error();}),openProfile:vi.fn()};
 const back=vi.fn();
 function App(){const [settings,setSettings]=useState({...defaults,...initial});return <Panel controls={browserControls} bridge={bridge} settings={settings} setSettings={setSettings} onBack={back}/>;}
 return {bridge,back,...render(<App/>)};
}
describe('social panel',()=>{
 it('does not access friends until explicitly enabled',()=>{const {bridge}=harness();expect(bridge.readFriends).not.toHaveBeenCalled();fireEvent.click(screen.getByText('Enable Steam friends'));expect(bridge.readFriends).toHaveBeenCalledOnce();expect(screen.getAllByText('Real friend').length).toBeGreaterThan(0);});
 it('polls only while the friends view is enabled and cleans up on unmount',()=>{vi.useFakeTimers();const h=harness({liveFriends:true});act(()=>vi.advanceTimersByTime(5000));expect(h.bridge.readFriends).toHaveBeenCalledTimes(2);fireEvent.click(screen.getByText('Messages'));const calls=vi.mocked(h.bridge.readFriends).mock.calls.length;act(()=>vi.advanceTimersByTime(5000));expect(h.bridge.readFriends).toHaveBeenCalledTimes(calls);fireEvent.click(screen.getByText('Friends'));h.unmount();expect(vi.getTimerCount()).toBe(0);expect(document.querySelector('.gbs-root')).toBeNull();});
 it('never renders fictional messages or working voice buttons in live mode',()=>{harness();fireEvent.click(screen.getByText('Messages'));expect(screen.queryByRole('textbox')).toBeNull();expect(screen.queryByText('Same crew tonight?')).toBeNull();fireEvent.click(screen.getByText('Party'));expect(screen.getByText('Steam voice unavailable')).toBeTruthy();expect(screen.queryByRole('button',{name:/mute|leave|join/i})).toBeNull();});
 it('opens native chat and reports thrown navigation failures',()=>{const h=harness({},true);fireEvent.click(screen.getByText('Messages'));fireEvent.click(screen.getByRole('button',{name:'Open native chat'}));expect(h.bridge.openNative).toHaveBeenCalledOnce();expect(screen.getByRole('alert').textContent).toContain('unavailable');});
 it('supports feature toggles, disable/re-enable and Escape back',()=>{vi.useFakeTimers();const h=harness();fireEvent.click(screen.getByText('Settings'));fireEvent.click(screen.getByRole('button',{name:/Messages tab/}));expect(screen.queryByRole('button',{name:'Messages'})).toBeNull();fireEvent.click(screen.getByRole('button',{name:/Enable Game Hub Show/}));expect(screen.getByText('Game Hub is off')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Enable Game Hub'}));fireEvent.keyDown(document.querySelector('.gbs-root')!,{key:'Escape'});act(()=>vi.advanceTimersByTime(250));fireEvent.keyDown(document.querySelector('.gbs-root')!,{key:'Escape'});expect(h.back).toHaveBeenCalledOnce();});
});
