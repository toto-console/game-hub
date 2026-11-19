"""Capability-detected native Steam Store presentation. No catalog, account or process APIs."""
import asyncio
import json
import re
from pathlib import Path
from urllib.parse import urlsplit, unquote

import aiohttp


def allowed_url(raw):
    try:
        u = urlsplit(raw)
        if u.scheme == 'https' and u.netloc == 'steamcommunity.com':
            from urllib.parse import parse_qs
            if re.fullmatch(r'/(?:id/[a-zA-Z0-9_-]+|profiles/\d+)/?', u.path):
                return all(k in ('l','snr','insideModal') for k in parse_qs(u.query,keep_blank_values=True))
            return bool(re.fullmatch(r'/(?:my|id/[a-zA-Z0-9_-]+|profiles/\d+)/home/?', u.path)) and all(k in ('l', 'snr') for k in parse_qs(u.query, keep_blank_values=True))
        if u.scheme != 'https' or u.netloc != 'store.steampowered.com':
            return False
        path = unquote(u.path)
        if re.search(r'login|logout|checkout|account|payment|purchase|auth|token|agecheck|agegate|redirect|error|warning|steamguard', path + unquote(u.query), re.I):
            return False
        return bool(path in ('/', '/cart', '/cart/') or re.fullmatch(r'/(app|sub|bundle)/\d+(?:/[^/]*)?/?', path) or re.match(r'^/(search|category|genre|tags|specials|explore|wishlist)(/|$)', path))
    except (ValueError, TypeError):
        return False


def document_url(raw):
    # Profile tabs use replaceState/hash navigation, not a different document.
    try:
        return urlsplit(raw)._replace(fragment='').geturl()
    except (ValueError, TypeError):
        return ''


class StoreAppearance:
    def __init__(self, plugin_dir):
        assets = Path(plugin_dir) / 'store-theme'
        self.css = (assets / 'native.css').read_text(encoding='utf-8') + '\n' + (assets / 'activity.css').read_text(encoding='utf-8') + '\n' + (assets / 'profile-achievements.css').read_text(encoding='utf-8') + '\n' + (assets / 'profile.css').read_text(encoding='utf-8')
        self.script = '\n'.join((assets / name).read_text(encoding='utf-8') for name in ('focus-gloss.js','activity-navigation.js','profile-tabs.js','profile.js','document.js'))
        self.lock = asyncio.Lock()
        self.revisions = {}
        self.requests = {}
        self.owned = {}
        self.preloads = {}

    async def stop_preload(self, target_id):
        old = self.preloads.pop(target_id, None)
        if old:
            session, ws, task, _ = old
            task.cancel()
            await ws.close()
            await session.close()

    async def start_preload(self, target_id, endpoint, opts):
        fingerprint = json.dumps(opts, sort_keys=True)
        old = self.preloads.get(target_id)
        if old and old[3] == fingerprint and not old[1].closed:
            return
        await self.stop_preload(target_id)
        u = urlsplit(endpoint)
        if u.scheme != 'ws' or u.hostname not in ('127.0.0.1','localhost') or u.port != 8080:
            raise ValueError('Unsupported Steam debugger endpoint')
        # New-document scripts belong to the CDP session. Keep that session alive,
        # draining events without polling; closing it unregisters the bootstrap.
        session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=None, sock_connect=2))
        try:
            ws = await session.ws_connect(endpoint, timeout=2)
            await ws.send_json({'id':1,'method':'Page.addScriptToEvaluateOnNewDocument','params':{'source':self.profile_bootstrap(opts)}})
            async def registered():
                async for msg in ws:
                    if msg.type == aiohttp.WSMsgType.TEXT:
                        data=json.loads(msg.data)
                        if data.get('id')==1:
                            return bool(data.get('result',{}).get('identifier'))
                return False
            if not await asyncio.wait_for(registered(),3):
                raise RuntimeError('Profile preload unavailable')
            async def drain():
                try:
                    async for _ in ws:
                        pass
                finally:
                    await session.close()
            self.preloads[target_id]=(session,ws,asyncio.create_task(drain()),fingerprint)
        except BaseException:
            await session.close()
            raise

    async def command(self, session, endpoint, method, params):
        u = urlsplit(endpoint)
        if u.scheme != 'ws' or u.hostname not in ('127.0.0.1', 'localhost') or u.port != 8080:
            raise ValueError('Unsupported Steam debugger endpoint')
        async with session.ws_connect(endpoint, timeout=2) as ws:
            await ws.send_json({'id': 1, 'method': method, 'params': params})
            async def read():
                async for msg in ws:
                    if msg.type == aiohttp.WSMsgType.TEXT:
                        data = json.loads(msg.data)
                        if data.get('id') == 1:
                            return data.get('result', {})
                return {}
            return await asyncio.wait_for(read(), 3)

    def profile_bootstrap(self, opts):
        # Execute before paint on subsequent profile documents in this owned renderer.
        # Unknown/protected routes never get concealed. A bounded guard fails open.
        return '(()=>{\n' + self.script + '\n' + '''
if(!isGameHubProfileURL(location.href))return;
let done=false,observer,timer;
const release=()=>{done=true;observer?.disconnect();clearTimeout(timer);document.getElementById('ghp-loading-guard')?.remove();};
const attempt=()=>{if(done)return;if(!document.documentElement)return;
 if(!document.getElementById('ghp-loading-guard')){const s=document.createElement('style');s.id='ghp-loading-guard';s.textContent='html{background:#071326!important}body{visibility:hidden!important}html:after{content:"Loading profile…";position:fixed;inset:0;display:grid;place-items:center;color:#d9eaff;font:20px sans-serif;background:#071326;z-index:2147483647}';document.documentElement.append(s);}
 if(document.querySelector('.profile_header_content .actual_persona_name')&&document.readyState!=='loading'){
  try{const result=installGameHubProfile(''' + json.dumps(opts) + ',' + json.dumps(self.css) + ''');if(result.applied)release();}catch{release();}
 }
};
observer=new MutationObserver(attempt);observer.observe(document,{childList:true,subtree:true});timer=setTimeout(release,8000);document.addEventListener('DOMContentLoaded',attempt,{once:true});attempt();
})();'''

    async def evaluate(self, session, endpoint, expression):
        # Never follow a remote debugging endpoint outside Steam's loopback server.
        u = urlsplit(endpoint)
        if u.scheme != 'ws' or u.hostname not in ('127.0.0.1', 'localhost') or u.port != 8080:
            raise ValueError('Unsupported Steam debugger endpoint')
        async with session.ws_connect(endpoint, timeout=2) as ws:
            await ws.send_json({'id':1, 'method':'Runtime.evaluate', 'params':{'expression':expression, 'returnByValue':True}})
            async def read():
                async for msg in ws:
                    if msg.type == aiohttp.WSMsgType.TEXT:
                        data = json.loads(msg.data)
                        if data.get('id') == 1:
                            return data.get('result', {}).get('result', {}).get('value')
                return None
            return await asyncio.wait_for(read(), 3)

    async def update(self, url, options):
        owner = str(options.get('owner', 'main'))[:100]
        revision = self.revisions.get(owner, 0) + 1
        self.revisions[owner] = revision
        opts = {k: options.get(k) is True for k in ('enabled','backgrounds','motion','gloss','subtle')}
        active = opts['enabled'] and allowed_url(url)
        if active:
            self.requests[owner] = document_url(url)
        else:
            self.requests.pop(owner, None)
        async with self.lock:
            if revision != self.revisions.get(owner):
                return {'applied':False, 'reason':'Newer Store navigation pending'}
            try:
                async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                    targets = []
                    if active or self.requests:
                        async with session.get('http://127.0.0.1:8080/json', allow_redirects=False) as response:
                            targets = await response.json()
                    current_ids = {t.get('id') for t in targets if t.get('type') == 'page' and document_url(t.get('url', '')) in self.requests.values()}
                    # Keep the current document's style and shell alive across repeat events.
                    for target_id, endpoint in list(self.owned.items()):
                        if target_id in current_ids:
                            continue
                        try:
                            await self.stop_preload(target_id)
                            await self.evaluate(session, endpoint, 'window.__gameHubStoreAppearance?.dispose(); true')
                            self.owned.pop(target_id, None)
                        except Exception:
                            pass  # Retry cleanup on the next request if the renderer still exists.
                    if not active:
                        return {'applied':False, 'reason':'Native Steam presentation'}
                    live_ids = {t.get('id') for t in targets}
                    for target_id in list(self.preloads):
                        if target_id not in live_ids:
                            await self.stop_preload(target_id)
                    self.owned = {k:v for k,v in self.owned.items() if k in live_ids}
                    if revision != self.revisions.get(owner):
                        return {'applied':False, 'reason':'Newer Store navigation pending'}
                    result = {'applied':False, 'reason':'Store renderer not ready; reopen Store to retry'}
                    for target in targets:
                        if target.get('type') != 'page' or document_url(target.get('url', '')) != document_url(url):
                            continue
                        endpoint = target.get('webSocketDebuggerUrl', '')
                        # Recheck the actual renderer location; a target can navigate after enumeration.
                        expression = '(()=>{if(location.href.split("#")[0]!==' + json.dumps(document_url(url)) + ')return {applied:false,reason:"Store navigation changed"};\n' + self.script + '\nreturn installGameHubStore(' + json.dumps(opts) + ',' + json.dumps(self.css) + ');})()'
                        result = await self.evaluate(session, endpoint, expression) or result
                        if result.get('applied'):
                            self.owned[target['id']] = endpoint
                            if re.fullmatch(r'/(?:id/[a-zA-Z0-9_-]+|profiles/\d+)/?', urlsplit(url).path) and urlsplit(url).netloc == 'steamcommunity.com':
                                try:
                                    await self.start_preload(target['id'], endpoint, opts)
                                except Exception:
                                    pass  # Existing secure post-load presentation remains usable.
                    return result
            except Exception:
                return {'applied':False, 'reason':'Store appearance could not update; reopen Store to recover its native page'}

    async def close(self):
        self.requests.clear()
        return await self.update('', {})
