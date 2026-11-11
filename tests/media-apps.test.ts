import {describe,it,expect,beforeEach,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {normalizePins,moveMediaPin,saveMediaPins,loadMediaPins,artworkURL} from '../src/media-pins';
const mocks=vi.hoisted(()=>({shortcut:vi.fn(),play:vi.fn(),entries:[] as any[],stop:vi.fn()}));
vi.mock('@decky/ui',()=>({Router:{}}));
vi.mock('../src/home/shortcut-launch',()=>({launchShortcutFromLibrary:mocks.shortcut}));
vi.mock('../src/game-adapter',()=>({gameById:(id:number)=>({id}),playGame:mocks.play}));
vi.mock('../src/themedeck-adapter',()=>({stopSoundtrackForLaunch:mocks.stop}));
vi.mock('../src/library-data',()=>({SHORTCUT:1073741824,isInstalled:(a:any)=>a.installed,readLibrary:()=>({entries:mocks.entries})}));
import {launchMediaApp} from '../src/media-launch';
beforeEach(()=>{localStorage.clear();vi.clearAllMocks();mocks.entries=[];});
describe('Media pins',()=>{
 it('preserves unsigned shortcut identities and rejects invalid or duplicate entries',()=>{expect(normalizePins([{id:4000000000},{id:4000000000},{id:-1},{id:'123'}])).toEqual([{id:4000000000,label:undefined,icon:undefined,background:undefined}]);});
 it('persists pin order and appearance; unpin only changes Media preferences',()=>{const app={id:4000000000,label:'VacuumTube',icon:'https://example.com/icon.png'};saveMediaPins([app,{id:12}]);expect(loadMediaPins()[0]).toMatchObject(app);saveMediaPins(moveMediaPin(loadMediaPins(),app.id,1));expect(loadMediaPins().map(p=>p.id)).toEqual([12,app.id]);saveMediaPins(loadMediaPins().filter(p=>p.id!==app.id));expect(loadMediaPins().map(p=>p.id)).toEqual([12]);});
 it('rejects executable or credential-bearing artwork URLs',()=>{for(const s of ['javascript:alert(1)','file:///C:/secret','https://u:p@example.com/a'])expect(()=>artworkURL(s)).toThrow();expect(artworkURL('')).toBeUndefined();});
 it('keeps unavailable pins and handles malformed storage',()=>{saveMediaPins([{id:765}]);expect(loadMediaPins()).toHaveLength(1);localStorage.setItem('game-hub.media-pins.v1','bad');expect(loadMediaPins()).toEqual([]);});
});
describe('Media launching',()=>{
 it('uses exact non-Steam identity and coalesces concurrent activation',async()=>{mocks.entries=[{appid:4000000000,app_type:1073741824}];let finish!:()=>void;mocks.shortcut.mockReturnValueOnce(new Promise<void>(r=>finish=r));const a=launchMediaApp(4000000000),b=launchMediaApp(4000000000);expect(mocks.shortcut).toHaveBeenCalledTimes(1);expect(mocks.shortcut.mock.calls[0][2]).toBe(4000000000);finish();await Promise.all([a,b]);});
 it('reports unavailable and failed shortcuts without removing pins',async()=>{saveMediaPins([{id:30}]);await expect(launchMediaApp(30)).rejects.toThrow('unavailable');mocks.entries=[{appid:30,app_type:1073741824}];mocks.shortcut.mockRejectedValueOnce(Error('Steam rejected launch'));await expect(launchMediaApp(30)).rejects.toThrow('Steam rejected');expect(loadMediaPins()).toHaveLength(1);});
 it('uses Steam game launcher for installed software',async()=>{mocks.entries=[{appid:20,app_type:2,installed:true}];await launchMediaApp(20);expect(mocks.play).toHaveBeenCalledWith({id:20});});
});
it('registers ThemeDeck only in settings, not social Quick Menu',()=>{const source=(name:string)=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8');expect(source('QuickMenu.tsx')).not.toContain('openGameMusic');expect(source('CenterSettings.tsx')).toContain("'Integrations','Media'");expect(source('CenterSettings.tsx')).toContain('ThemeDeck Game Soundtracks');expect(source('index.tsx')).toContain('<summary><T text="Integrations"/></summary>');});
