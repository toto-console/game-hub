import {it,expect,vi,afterEach} from 'vitest';
const native=vi.hoisted(()=>({PlayNavSound:vi.fn()}));
vi.mock('@decky/ui',()=>({findModuleChild:(find:any)=>find({audio:{GamepadUIAudio:native}})??find({sounds:{BasicNav:24,FailedNav:25,DefaultOk:1}})}));
import {startNavigationAudio} from '../src/native-navigation-audio';
import {focusControl,focusNavigation,playSelectionSound} from '../src/navigation';
afterEach(()=>{document.body.innerHTML='';native.PlayNavSound.mockReset();});
it('uses native navigation and confirmation sounds, keeps restoration silent, and releases callbacks',()=>{
 const stop=startNavigationAudio();const a=document.createElement('button'),b=document.createElement('button');document.body.append(a,b);
 focusControl(a);expect(native.PlayNavSound).not.toHaveBeenCalled();
 focusNavigation(b);focusNavigation(b);expect(native.PlayNavSound.mock.calls).toEqual([[24]]);
 playSelectionSound();expect(native.PlayNavSound.mock.calls).toEqual([[24],[1]]);
 stop();focusNavigation(a);playSelectionSound();expect(native.PlayNavSound).toHaveBeenCalledTimes(2);
});
it('a native audio failure cannot interrupt activation',()=>{const stop=startNavigationAudio();native.PlayNavSound.mockImplementationOnce(()=>{throw Error('unavailable');});expect(()=>playSelectionSound()).not.toThrow();stop();});
