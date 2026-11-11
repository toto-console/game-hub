import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,fireEvent,cleanup} from '@testing-library/react';
import {NoticeRow} from '../src/NoticeRow';
import {readTray,safeNoticeArtwork} from '../src/system-adapters';
import type {Controls} from '../src/Panel';
const controls={Button:({children,...props}:any)=><button {...props}>{children}</button>} as Controls;
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('reads the current Steam FriendMessage identity and avatar with its existing tray preview',()=>{
 const body=vi.fn(()=> 'Hello from the tray');
 vi.stubGlobal('NotificationStore',{GetNotificationsInTray:()=>[[{notifications:[{eType:8,rtCreated:123,data:{getClassName:()=> 'CClientNotificationFriendMessage',steamid:()=> '76561197960265740',icon:()=> 'https://avatars.steamstatic.com/test_medium.jpg',body}}]}]]});
 vi.stubGlobal('g_FriendsUIApp',{FriendStore:{GetFriendIfCached:()=>({is_friend:true,persona:{m_strPlayerName:'Alex'}})}});
 const n=readTray()[0];expect(n).toMatchObject({title:'Alex',kind:'Message',conversation:'friend:12',avatar:'https://avatars.steamstatic.com/test_medium.jpg'});expect(n.detail).toBe('Hello from the tray');expect(body).toHaveBeenCalledOnce();
});
it('renders artwork, description, unread state and preserves activation when an image fails',()=>{const open=vi.fn();const v=render(<NoticeRow controls={controls} open={open} notice={{id:'1',title:'Example game',detail:'Download complete',kind:'Download',source:'Steam',time:123000,unread:true,artwork:'https://cdn.akamai.steamstatic.com/steam/apps/10/header.jpg'}}/>);expect(v.getByText('Example game')).toBeTruthy();expect(v.getByText('Download complete')).toBeTruthy();expect(v.getByLabelText('Unread')).toBeTruthy();fireEvent.error(v.container.querySelector('img')!);expect(v.container.querySelector('img')).toBeNull();fireEvent.click(v.getByRole('button'));expect(open).toHaveBeenCalledOnce();});
it('rejects arbitrary or executable artwork URLs',()=>{for(const url of ['javascript:alert(1)','https://example.com/a.png','https://user:pass@cdn.akamai.steamstatic.com/a'])expect(safeNoticeArtwork(url)).toBeUndefined();});

it('resolves game title and artwork from a grouped Steam alert',()=>{vi.stubGlobal('NotificationStore',{GetNotificationsInTray:()=>[[{notifications:[{eType:20,rtCreated:123,data:{item:{body_data:JSON.stringify({app_id:10})}}}]}]]});vi.stubGlobal('appStore',{GetAppOverviewByAppID:()=>({appid:10,display_name:'Example game'})});expect(readTray()[0]).toMatchObject({title:'Example game',artwork:'https://cdn.akamai.steamstatic.com/steam/apps/10/header.jpg'});});

it('reads achievement-specific text and artwork instead of the game cover',()=>{
 vi.stubGlobal('NotificationStore',{GetNotificationsInTray:()=>[[{notifications:[{eType:5,rtCreated:123,data:{getClassName:()=> 'CClientNotificationAchievement',appid:()=>10,name:()=> 'Angel Knives',description:()=> 'Complete the challenge',image_url:()=> 'https://shared.steamstatic.com/community_assets/images/achievement.jpg'}}]}]]});
 vi.stubGlobal('appStore',{GetAppOverviewByAppID:()=>({appid:10,display_name:'Example game'})});
 expect(readTray()[0]).toMatchObject({title:'Angel Knives',detail:'Complete the challenge',artwork:'https://shared.steamstatic.com/community_assets/images/achievement.jpg',kind:'Achievement'});
});
it('uses Steam cached personas for bridged alerts without inventing a Steam conversation',()=>{
 vi.stubGlobal('NotificationStore',{GetNotificationsInTray:()=>[[{notifications:[{eType:8,rtCreated:123,data:{getClassName:()=> 'CClientNotificationFriendMessage',steamid:()=> '76561197960265740',title:()=>'',icon:()=>'',body:()=> 'Existing message preview'}}]}]]});
 vi.stubGlobal('friendStore',{GetFriendState:()=>({m_persona:{m_strPlayerName:'Channel sender',avatar_url_medium:'https://cdn.discordapp.com/avatars/example/icon.png'}})});
 expect(readTray()[0]).toMatchObject({title:'Channel sender',detail:'Existing message preview',avatar:'https://cdn.discordapp.com/avatars/example/icon.png'});
 expect(readTray()[0].conversation).toBeUndefined();
});
it('keeps the message preview and layout together even inside a wrapped Steam button',()=>{
 const wrapped={Button:({children,...props}:any)=><button {...props}><div>{children}</div></button>} as Controls;
 const v=render(<NoticeRow controls={wrapped} open={()=>{}} notice={{id:'m',title:'Friend',detail:'Hello there',kind:'Message',source:'Steam',time:0,conversation:'friend:12',avatar:'https://cdn.discordapp.com/avatars/test/icon.png'}}/>);
 expect(v.getByText('Hello there')).toBeTruthy();expect(v.container.querySelector('.gh-notice-layout')?.children).toHaveLength(3);expect(v.container.querySelector('img')?.src).toContain('cdn.discordapp.com');
});
