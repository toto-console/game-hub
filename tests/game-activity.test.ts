import {expect,it,vi} from 'vitest';
vi.mock('@decky/api',()=>({fetchNoCors:vi.fn()}));
import {normalizeAchievements,suspendCapability} from '../src/game-activity-adapter';
it('keeps every unique achievement while concealing locked hidden metadata',()=>{
 const raw=Array.from({length:99},(_,i)=>({strID:String(i),strName:'Secret '+i,strDescription:'Spoiler',bHidden:true,bAchieved:i===0,strImage:'https://example.com/icon.jpg',rtUnlocked:123,flAchieved:4,flMaxProgress:10,flCurrentProgress:2}));
 const rows=normalizeAchievements([...raw,raw[0]]);expect(rows).toHaveLength(99);expect(rows[0].name).toBe('Secret 0');expect(rows[0].unlocked).toBe(123);expect(rows[1]).toMatchObject({name:'Hidden achievement',image:undefined,current:undefined,max:undefined,rarity:undefined,unlocked:0});expect(JSON.stringify(rows[1])).not.toContain('Spoiler');
});
it('does not invent progress, percentages or a suspend capability',()=>{
 const [a]=normalizeAchievements([{strID:'one',strName:'One',bAchieved:false,strImage:'javascript:bad',flMaxProgress:0}]);expect(a.image).toBeUndefined();expect(a.current).toBeUndefined();expect(a.max).toBeUndefined();expect(a.rarity).toBeUndefined();expect(suspendCapability.supported).toBe(false);expect(()=>normalizeAchievements(undefined)).toThrow();
});
