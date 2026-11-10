import {it,expect} from 'vitest';
import {friendsPlaying} from '../src/home/home-hub-data';
const friend=(appid:number,id='76561198000000001')=>({steamid64:id,is_ready:true,persona:{m_strPlayerName:'Friend',is_online:true,is_ingame:true,is_awayOrSnooze:false,m_unGamePlayedAppID:appid,m_strGameExtraInfo:'Same title'}});
it('matches exact playing app IDs, not coincidentally matching names or ownership',()=>{
 const result=friendsPlaying({friendStore:{allFriends:[friend(42),friend(99,'76561198000000002')]}},42);expect(result.available).toBe(true);expect(result.friends.map(f=>f.id)).toEqual(['76561198000000001']);
});
it('does not report a zero count when identity or presence is unavailable',()=>{expect(friendsPlaying({},42).available).toBe(false);expect(friendsPlaying({friendStore:{allFriends:[{...friend(42),is_ready:false}]}},42).available).toBe(false);});
