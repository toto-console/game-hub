import {describe,it,expect} from 'vitest';
import {readSteamFriends,safeAvatar,sortFriends} from '../src/model';
import {defaults,loadSettings,saveSettings} from '../src/settings';
const ready={is_ready:true,steamid64:'76561198000000001',persona:{m_strPlayerName:'Nova',is_online:true,is_ingame:true,is_awayOrSnooze:false,m_strGameExtraInfo:'A game',avatar_url_medium:'https://avatars.steamstatic.com/example.jpg'}};
describe('Steam read adapter',()=>{
 it('validates loaded friend data and derives status',()=>{const s=readSteamFriends({friendStore:{allFriends:[ready]}});expect(s.kind).toBe('ready');expect(s.friends[0]).toMatchObject({name:'Nova',state:'playing',game:'A game'});});
 it('fails closed for missing, throwing and changed stores',()=>{for(const host of [null,{}, {friendStore:{allFriends:{}}},{friendStore:{allFriends:[{...ready,persona:{}}]}}])expect(readSteamFriends(host).kind).toBe('unavailable');expect(readSteamFriends({get friendStore(){throw Error();}}).kind).toBe('unavailable');});
 it('does not read lazy persona getters for unready profiles',()=>{expect(readSteamFriends({friendStore:{allFriends:[{is_ready:false,get persona(){throw Error('must not read');}}]}}).kind).toBe('loading');});
 it('treats empty data as unknown, not zero online friends',()=>expect(readSteamFriends({friendStore:{allFriends:[]}}).kind).toBe('loading'));
 it('deduplicates identities and drops offline stale activity',()=>{const s=readSteamFriends({friendStore:{allFriends:[{...ready,persona:{...ready.persona,is_online:false}},ready]}});expect(s.friends).toHaveLength(1);expect(s.friends[0]).toMatchObject({state:'offline',game:undefined});});
 it('rejects changed identities and hostile avatar URLs',()=>{expect(readSteamFriends({friendStore:{allFriends:[{...ready,steamid64:'javascript:alert(1)'}]}}).kind).toBe('unavailable');for(const value of ['javascript:alert(1)','https://avatars.steamstatic.com.evil.test/a','https://a:b@avatars.steamstatic.com/a','data:image/png;base64,a','http://avatars.steamstatic.com/a'])expect(safeAvatar(value)).toBeUndefined();});
 it('sorts without mutating caller data',()=>{const input=[{id:'2',name:'Z',state:'offline' as const},{id:'1',name:'A',state:'online' as const}];expect(sortFriends(input)[0].id).toBe('1');expect(input[0].id).toBe('2');});
});
describe('preferences',()=>{
 it('defaults to experimental access off and validates stored types',()=>{expect(defaults.liveFriends).toBe(false);expect(loadSettings({getItem:()=>'{"liveFriends":"true","enabled":false}'})).toEqual({...defaults,enabled:false});});
 it('survives malformed and unavailable storage',()=>{expect(loadSettings({getItem:()=>'{'})).toEqual(defaults);expect(loadSettings({getItem:()=>{throw Error();}})).toEqual(defaults);expect(saveSettings(defaults,{setItem:()=>{throw Error();}})).toBe(false);});
});
