import {it,expect,vi} from 'vitest';
import {launchShortcutFromLibrary} from '../src/home/shortcut-launch';

function fixture(status=11){
 const events:string[]=[];
 const app={appid:3706888855,app_type:1073741824,m_gameid:'15920966402165440512',GetGameID:()=> '3706888855',local_per_client_data:{display_status:status}};
 let listener=()=>{};
 const history={location:{pathname:'/game-hub/home/library'},listen:(fn:()=>void)=>{listener=fn;return ()=>{listener=()=>{}}}};
 const instance={m_history:history,Navigate:(path:string)=>{events.push('details');history.location.pathname=path;listener();}};
 const host={appStore:{GetAppOverviewByAppID:()=>app},appDetailsStore:{BHasRecentlyLaunched:()=>{events.push('recent-check');return false},MarkAppAsRecentlyLaunched:()=>events.push('mark')},SteamClient:{Apps:{RunGame:vi.fn(()=>{events.push('run')})}},requestAnimationFrame:(fn:()=>void)=>setTimeout(fn,0),cancelAnimationFrame:clearTimeout};
 return {events,host,router:{WindowStore:{GamepadUIMainWindowInstance:instance}}};
}
it('opens native launch context and uses full shortcut ID once for repeated activation',async()=>{
 const f=fixture();await Promise.all([launchShortcutFromLibrary(f.host,f.router,3706888855),launchShortcutFromLibrary(f.host,f.router,3706888855)]);
 expect(f.events).toEqual(['details','recent-check','mark','run']);
 expect(f.host.SteamClient.Apps.RunGame).toHaveBeenCalledExactlyOnceWith('15920966402165440512','',-1,100);
});
it('keeps an existing Steam launch visible without submitting another request',async()=>{
 const f=fixture(1);await launchShortcutFromLibrary(f.host,f.router,3706888855);
 expect(f.events).toEqual(['details']);expect(f.host.SteamClient.Apps.RunGame).not.toHaveBeenCalled();
});
