import {afterEach,expect,it,vi} from 'vitest';
import {personaPresence,readDockPresence} from '../src/presence';
import {parseDiscordState,parseMessages,parseGuilds,steamcordAvailable,sendDiscordMessage} from '../src/steamcord-adapter';
afterEach(()=>vi.unstubAllGlobals());
const session={loaded:true,logged_in:true,discord_enabled:true,me:{id:'123',username:'Test'},vc:null};
it('distinguishes actual presence and unavailable counts',()=>{
 expect([0,7,3,4,1].map(m_ePersonaState=>personaPresence({m_ePersonaState}))).toEqual(['offline','offline','away','away','online']);
 expect(readDockPresence({},undefined).count).toBeUndefined();
});
it('parses only display session fields and rejects changed schema',()=>{
 expect(parseDiscordState({...session,qr_login:'ignored'})).not.toHaveProperty('qr_login');
 expect(()=>parseDiscordState({})).toThrow();
});
it('keeps real message order and allows only Discord image hosts',()=>{
 const rows=parseMessages([{id:'12',content:'b',images:[{url:'https://evil.example/a.png'}]},{id:'2',content:'a'}]);
 expect(rows.map(r=>r.id)).toEqual(['2','12']);expect(rows[1].images).toEqual([]);
 expect(parseGuilds([{id:'1',name:'hidden',hidden:true,channels:[]}],[])).toEqual([]);
});
it('gates changed versions and blocks overlapping sends',async()=>{
 const p={name:'Steamcord',version:'1.43.1',onDismount:()=>{}};
 vi.stubGlobal('DeckyPluginLoader',{plugins:[p],deckyState:{publicState:()=>({disabledPlugins:[]})}});
 let finish!:(v:boolean)=>void;
 const call=vi.fn(async(_r:string,_p:string,m:string)=>m==='get_state'?session:new Promise<boolean>(r=>{finish=r;}));
 vi.stubGlobal('DeckyBackend',{call});
 const first=sendDiscordMessage('123','456','hello');
 await expect(sendDiscordMessage('123','456','hello')).rejects.toThrow('already');
 await vi.waitFor(()=>expect(finish).toBeTypeOf('function'));finish(true);await first;
 expect(call.mock.calls.filter(c=>c[2]==='send_message')).toHaveLength(1);
 p.version='2';expect(steamcordAvailable()).toBe(false);
});
