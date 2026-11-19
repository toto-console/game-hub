"""Isolated backend tests; no Steam connection, games, saves or account operations."""
import asyncio
import importlib.util
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch

# Decky supplies aiohttp in production. These tests replace transport, not install dependencies.
if importlib.util.find_spec('aiohttp') is None:
    sys.modules['aiohttp'] = types.SimpleNamespace(ClientTimeout=lambda **kw:None)
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'py_modules'))
import store_appearance as module

class Response:
    async def __aenter__(self): return self
    async def __aexit__(self,*args): pass
    async def json(self): return [dict(id='store',type='page',url='https://store.steampowered.com/',webSocketDebuggerUrl='ws://127.0.0.1:8080/devtools/page/store'),dict(id='desktop',type='page',url='https://checkout.steampowered.com/',webSocketDebuggerUrl='ws://127.0.0.1:8080/devtools/page/desktop')]
class Session:
    async def __aenter__(self): return self
    async def __aexit__(self,*args): pass
    def get(self,url,**kwargs):
        assert url=='http://127.0.0.1:8080/json' and kwargs['allow_redirects'] is False
        return Response()

class Tests(unittest.IsolatedAsyncioTestCase):
    def test_boundaries(self):
        for path in ['/','/app/620/Portal_2/','/search/?term=puzzle','/wishlist/']:
            self.assertTrue(module.allowed_url('https://store.steampowered.com'+path))
        for url in ['http://store.steampowered.com/','https://store.steampowered.com.evil/','https://user@store.steampowered.com/','https://store.steampowered.com:444/','https://store.steampowered.com/agecheck/app/620/','https://store.steampowered.com/account/','https://store.steampowered.com/?token=secret','https://store.steampowered.com/app/620/%6cogin','https://checkout.steampowered.com/','https://store.steampowered.com/unknown/']:
            self.assertFalse(module.allowed_url(url),url)
    def test_profile_overview_boundaries(self):
        for url in ['https://steamcommunity.com/id/example','https://steamcommunity.com/profiles/76561190000000000/?insideModal=0']:
            self.assertTrue(module.allowed_url(url))
        for url in ['https://steamcommunity.com/id/example/edit','https://steamcommunity.com/id/example/inventory','https://steamcommunity.com/login','https://steamcommunity.com/id/example?token=x']:
            self.assertFalse(module.allowed_url(url))
    async def test_endpoint_boundary(self):
        a=module.StoreAppearance(Path(__file__).resolve().parents[1])
        for endpoint in ['ws://example.com:8080/','ws://127.0.0.1:9999/','http://127.0.0.1:8080/']:
            with self.assertRaises(ValueError): await a.evaluate(None,endpoint,'true')
    async def test_inject_cleanup_and_no_account_request(self):
        a=module.StoreAppearance(Path(__file__).resolve().parents[1]);calls=[]
        async def evaluate(session,endpoint,script):
            calls.append((endpoint,script));return {'applied':True,'reason':'ok'}
        a.evaluate=evaluate
        with patch.object(module.aiohttp,'ClientSession',lambda **kw:Session(),create=True):
            result=await a.update('https://store.steampowered.com/',dict(enabled=True,gloss=True))
            self.assertTrue(result['applied']);self.assertEqual(len(calls),1)
            self.assertIn('location.href.split',calls[0][1]);self.assertEqual(list(a.owned),['store'])
            await a.update('https://store.steampowered.com/',dict(enabled=True,gloss=True));self.assertEqual(len(calls),2);self.assertNotIn('window.__gameHubStoreAppearance?.dispose(); true',calls[1][1]);await a.close();self.assertEqual(len(calls),3);self.assertIn('dispose()',calls[2][1]);self.assertEqual(a.owned,{})
    async def test_stale_requests_do_not_apply(self):
        a=module.StoreAppearance(Path(__file__).resolve().parents[1]);calls=[]
        async def evaluate(*args): calls.append(args);return {'applied':True}
        a.evaluate=evaluate
        with patch.object(module.aiohttp,'ClientSession',lambda **kw:Session(),create=True):
            async with a.lock:
                old=asyncio.create_task(a.update('https://store.steampowered.com/',dict(enabled=True)))
                await asyncio.sleep(0)
                new=asyncio.create_task(a.update('',{}));await asyncio.sleep(0)
            await asyncio.gather(old,new)
        self.assertEqual(calls,[])
    async def test_foreign_url_no_transport(self):
        a=module.StoreAppearance(Path(__file__).resolve().parents[1])
        with patch.object(module.aiohttp,'ClientSession',lambda **kw:Session(),create=True):
            self.assertFalse((await a.update('https://checkout.steampowered.com/',dict(enabled=True)))['applied'])

    async def test_profile_hash_tabs_match_without_disposing_the_document(self):
        a=module.StoreAppearance(Path(__file__).resolve().parents[1]);calls=[]
        url='https://steamcommunity.com/id/example/'
        async def targets(_): return [dict(id='profile',type='page',url=url+'#ghp-inventory',webSocketDebuggerUrl='ws://127.0.0.1:8080/devtools/page/profile')]
        async def evaluate(session,endpoint,script): calls.append(script);return {'applied':True}
        async def preload(*args): pass
        a.evaluate=evaluate;a.start_preload=preload
        with patch.object(module.aiohttp,'ClientSession',lambda **kw:Session(),create=True),patch.object(Response,'json',targets):
            self.assertTrue((await a.update(url,dict(enabled=True)))['applied'])
            self.assertTrue((await a.update(url+'#ghp-games',dict(enabled=True)))['applied'])
        self.assertEqual(len(calls),2);self.assertTrue(all('dispose(); true' not in s for s in calls))

    async def test_one_window_does_not_dispose_another_windows_theme(self):
        a=module.StoreAppearance(Path(__file__).resolve().parents[1]);calls=[]
        async def evaluate(session,endpoint,script): calls.append(script);return {'applied':True}
        a.evaluate=evaluate
        with patch.object(module.aiohttp,'ClientSession',lambda **kw:Session(),create=True):
            await a.update('https://store.steampowered.com/',dict(enabled=True,owner='main'))
            await a.update('',dict(owner='overlay'))
            self.assertEqual(len(calls),1);self.assertIn('store',a.owned)
            await a.update('',dict(owner='main'))
            self.assertEqual(len(calls),2);self.assertFalse(a.owned)

if __name__=='__main__': unittest.main()
