import {afterEach,describe,expect,it,vi} from 'vitest';
import {createElement} from 'react';
import {createNotificationStore} from '../src/notification-store';
import {pluginInventory,beginPluginHost,pluginStillCurrent} from '../src/decky-adapter';
import {readTray} from '../src/system-adapters';
import {defaults} from '../src/settings';
import type {Friend,SocialBridge} from '../src/model';

afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
function fixture(){
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-31T20:00:00Z'));
 let groups:any[]=[],active=true,account='1';
 const friends:Friend[]=[{id:'76561197960265740',name:'Test friend',state:'offline'}];
 const conversations:any[]=[];
 const settings={...defaults,liveFriends:true,notificationToasts:true};
 vi.stubGlobal('NotificationStore',{GetNotificationsInTray:()=>[groups,{}],RemoveGroupFromTray:(g:unknown)=>{groups=groups.filter(x=>x!==g);}});
 vi.stubGlobal('DeckyPluginLoader',{deckyState:{publicState:()=>({updates:new Map()})}});
 const bridge={readFriends:()=>({kind:'ready',friends,detail:''}),messages:{inbox:()=>({connected:true,account,conversations})},voice:{read:()=>({incoming:[]})}} as unknown as SocialBridge;
 const store=createNotificationStore(bridge,()=>settings),stop=store.start(()=>active);
 return {store,settings,friends,conversations,setGroups:(v:any[])=>groups=v,setActive:(v:boolean)=>active=v,setAccount:(v:string)=>account=v,stop};
}
describe('system integration adapters',()=>{
 it('announces only observed presence transitions, deduplicates refreshes, expires popups and resets account baselines',()=>{
  const f=fixture();expect(f.store.getSnapshot().rows).toHaveLength(0);
  f.friends[0].state='online';f.store.refresh();expect(f.store.getSnapshot().rows[0].kind).toBe('Friend online');expect(f.store.getSnapshot().toast).toBeDefined();
  f.store.refresh();expect(f.store.getSnapshot().rows).toHaveLength(1);
  vi.advanceTimersByTime(4000);expect(f.store.getSnapshot().toast).toBeUndefined();
  f.settings.friendOnlineAlerts=false;f.store.refresh();expect(f.store.getSnapshot().rows).toHaveLength(0);
  f.setActive(false);f.store.refresh();f.friends[0].state='playing';f.friends[0].game='Example game';f.setActive(true);f.store.refresh();expect(f.store.getSnapshot().rows).toHaveLength(0);
  f.setAccount('2');f.store.refresh();f.settings.friendOnlineAlerts=true;f.store.refresh();expect(f.store.getSnapshot().rows).toHaveLength(0);
  f.stop();expect(vi.getTimerCount()).toBe(0);
 });
 it('unifies real tray and inbox conversations; dismissing an event allows a later message',()=>{
  const f=fixture();vi.stubGlobal('g_FriendsUIApp',{FriendStore:{GetFriendIfCached:()=>({is_friend:true,persona:{m_strPlayerName:'Test friend'}})}});
  f.conversations.push({id:'friend:12',kind:'friend',name:'Test friend',unread:1,time:123});
  f.setGroups([{notifications:[{notificationID:'a',eType:8,rtCreated:123,data:{getClassName:()=> 'CClientNotificationFriendChatMessage',steamid_sender:()=> '76561197960265740'}}]}]);
  f.store.refresh();expect(f.store.getSnapshot().rows).toHaveLength(1);expect(f.store.getSnapshot().rows[0].clear).toBeTypeOf('function');
  f.store.dismiss('chat:friend:12');expect(f.store.getSnapshot().rows).toHaveLength(0);
  f.conversations[0].time=124;f.store.refresh();expect(f.store.getSnapshot().rows).toHaveLength(1);f.stop();
 });
 it('does not route Steamcord synthetic plugin alerts as private messages and clears refreshed groups by their stable ID',()=>{
  const f=fixture();vi.stubGlobal('DeckyPluginLoader',{toaster:{__steamcordSafe:2},deckyState:{publicState:()=>({updates:new Map()})}});
  vi.stubGlobal('friendStore',{GetFriendState:()=>({m_persona:{m_strPlayerName:'Plugin test'}})});
  const notice={notificationID:'plugin-alert',eType:9,rtCreated:Date.now(),data:{getClassName:()=> 'CClientNotificationGroupChatMessage',steamid_sender:()=>String(76561197960265728n+0xde000001n),body:()=> 'Update reported by plugin'}};
  f.setGroups([{notifications:[notice]}]);const row=readTray()[0];expect(row.kind).toBe('Plugin alert');expect(row.title).toBe('Plugin test');expect(row.detail).toBe('Update reported by plugin');expect(row.conversation).toBeUndefined();expect(row.time).toBe(Date.now());
  f.setGroups([{notifications:[{...notice}]}]);row.clear!();expect(readTray()).toHaveLength(0);f.stop();
 });
 it('reports source failures as partial data',()=>{
  const f=fixture();vi.stubGlobal('NotificationStore',undefined);f.store.refresh();expect(f.store.getSnapshot().status).toContain('Partial data');f.stop();
 });
 it('lists disabled plugins and gates hosting by reviewed version, lifecycle and current registration without initializing plugins',()=>{
  const plugin={name:'Glance Library',version:'1.0.0',content:createElement('div'),onDismount:vi.fn()},disabled={name:'Offline plugin',version:'2'};
  const state={installedPlugins:[plugin,disabled],disabledPlugins:[disabled],updates:new Map([['Offline plugin',{}]]),activePlugin:undefined};
  const loader={plugins:[plugin],deckyState:{publicState:()=>state,closeActivePlugin:vi.fn()}};vi.stubGlobal('DeckyPluginLoader',loader);
  const entries=pluginInventory();expect(entries[1]).toMatchObject({disabled:true,loaded:false,update:true,compatible:false});expect(entries[0].compatible).toBe(true);
  beginPluginHost(entries[0]);expect(loader.deckyState.closeActivePlugin).toHaveBeenCalledOnce();expect(plugin.onDismount).not.toHaveBeenCalled();
  plugin.content=createElement('section');expect(pluginStillCurrent(entries[0])).toBe(false);expect(()=>beginPluginHost(entries[0])).toThrow();
  plugin.version='9.0.0';expect(pluginInventory()[0].compatible).toBe(false);
 });
});

it('keeps tray previews and avatars when merging a real unread conversation',()=>{
 const f=fixture();f.conversations.push({id:'friend:12',name:'Alex',kind:'friend',unread:1,time:123});
 vi.stubGlobal('g_FriendsUIApp',{FriendStore:{GetFriendIfCached:()=>({is_friend:true,persona:{m_strPlayerName:'Alex'}})}});
 f.setGroups([{notifications:[{notificationID:'preview',eType:8,rtCreated:123,data:{getClassName:()=> 'CClientNotificationFriendMessage',steamid:()=> '76561197960265740',icon:()=> 'https://avatars.steamstatic.com/test.jpg',body:()=> 'Existing tray preview'}}]}]);
 f.store.refresh();expect(f.store.getSnapshot().rows).toHaveLength(1);expect(f.store.getSnapshot().rows[0]).toMatchObject({detail:'Existing tray preview',avatar:'https://avatars.steamstatic.com/test.jpg',conversation:'friend:12'});f.stop();
});
