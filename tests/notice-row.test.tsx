import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,fireEvent,cleanup} from '@testing-library/react';
import {NoticeRow} from '../src/NoticeRow';
import {readTray,safeNoticeArtwork} from '../src/system-adapters';
import type {Controls} from '../src/Panel';
const controls={Button:({children,...props}:any)=><button {...props}>{children}</button>} as Controls;
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('reads the current Steam FriendMessage identity and avatar without reading private bodies',()=>{
 const body=vi.fn(()=>{throw Error('must not read');});
 vi.stubGlobal('NotificationStore',{GetNotificationsInTray:()=>[[{notifications:[{eType:8,rtCreated:123,data:{getClassName:()=> 'CClientNotificationFriendMessage',steamid:()=> '76561197960265740',icon:()=> 'https://avatars.steamstatic.com/test_medium.jpg',body}}]}]]});
 vi.stubGlobal('g_FriendsUIApp',{FriendStore:{GetFriendIfCached:()=>({is_friend:true,persona:{m_strPlayerName:'Alex'}})}});
 const n=readTray()[0];expect(n).toMatchObject({title:'Alex',kind:'Message',conversation:'friend:12',avatar:'https://avatars.steamstatic.com/test_medium.jpg'});expect(body).not.toHaveBeenCalled();
});
it('renders artwork, description, unread state and preserves activation when an image fails',()=>{const open=vi.fn();const v=render(<NoticeRow controls={controls} open={open} notice={{id:'1',title:'Example game',detail:'Download complete',kind:'Download',source:'Steam',time:123000,unread:true,artwork:'https://cdn.akamai.steamstatic.com/steam/apps/10/header.jpg'}}/>);expect(v.getByText('Example game')).toBeTruthy();expect(v.getByText('Download complete')).toBeTruthy();expect(v.getByLabelText('Unread')).toBeTruthy();fireEvent.error(v.container.querySelector('img')!);expect(v.container.querySelector('img')).toBeNull();fireEvent.click(v.getByRole('button'));expect(open).toHaveBeenCalledOnce();});
it('rejects arbitrary or executable artwork URLs',()=>{for(const url of ['javascript:alert(1)','https://example.com/a.png','https://user:pass@cdn.akamai.steamstatic.com/a'])expect(safeNoticeArtwork(url)).toBeUndefined();});

it('resolves game title and artwork from a grouped Steam alert',()=>{vi.stubGlobal('NotificationStore',{GetNotificationsInTray:()=>[[{notifications:[{eType:20,rtCreated:123,data:{item:{body_data:JSON.stringify({app_id:10})}}}]}]]});vi.stubGlobal('appStore',{GetAppOverviewByAppID:()=>({appid:10,display_name:'Example game'})});expect(readTray()[0]).toMatchObject({title:'Example game',artwork:'https://cdn.akamai.steamstatic.com/steam/apps/10/header.jpg'});});
