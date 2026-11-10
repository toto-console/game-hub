"""Windows native Store presentation. No catalog, account or process APIs."""
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
            return bool(re.fullmatch(r'/(?:my|id/[a-zA-Z0-9_-]+|profiles/\d+)/home/?', u.path)) and all(k in ('l', 'snr') for k in parse_qs(u.query, keep_blank_values=True))
        if u.scheme != 'https' or u.netloc != 'store.steampowered.com':
            return False
        path = unquote(u.path)
        if re.search(r'login|logout|checkout|account|payment|purchase|auth|token|agecheck|agegate|redirect|error|warning|steamguard', path + unquote(u.query), re.I):
            return False
        return bool(path in ('/', '/cart', '/cart/') or re.fullmatch(r'/(app|sub|bundle)/\d+(?:/[^/]*)?/?', path) or re.match(r'^/(search|category|genre|tags|specials|explore|wishlist)(/|$)', path))
    except (ValueError, TypeError):
        return False


class StoreAppearance:
    def __init__(self, plugin_dir):
        assets = Path(plugin_dir) / 'store-theme'
        self.css = (assets / 'native.css').read_text(encoding='utf-8') + '\n' + (assets / 'activity.css').read_text(encoding='utf-8')
        self.script = '\n'.join((assets / name).read_text(encoding='utf-8') for name in ('focus-gloss.js','activity-navigation.js','document.js'))
        self.lock = asyncio.Lock()
        self.revision = 0
        self.owned = {}

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
        self.revision += 1
        revision = self.revision
        opts = {k: options.get(k) is True for k in ('enabled','backgrounds','motion','gloss','subtle')}
        active = opts['enabled'] and allowed_url(url)
        async with self.lock:
            if revision != self.revision:
                return {'applied':False, 'reason':'Newer Store navigation pending'}
            try:
                async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                    targets = []
                    if active:
                        async with session.get('http://127.0.0.1:8080/json', allow_redirects=False) as response:
                            targets = await response.json()
                    current_ids = {t.get('id') for t in targets if t.get('type') == 'page' and t.get('url') == url}
                    # Keep the current document's style and shell alive across repeat events.
                    for target_id, endpoint in list(self.owned.items()):
                        if target_id in current_ids:
                            continue
                        try:
                            await self.evaluate(session, endpoint, 'window.__gameHubStoreAppearance?.dispose(); true')
                            self.owned.pop(target_id, None)
                        except Exception:
                            pass  # Retry cleanup on the next request if the renderer still exists.
                    if not active:
                        return {'applied':False, 'reason':'Native Steam presentation'}
                    live_ids = {t.get('id') for t in targets}
                    self.owned = {k:v for k,v in self.owned.items() if k in live_ids}
                    if revision != self.revision:
                        return {'applied':False, 'reason':'Newer Store navigation pending'}
                    result = {'applied':False, 'reason':'Store renderer not ready; reopen Store to retry'}
                    for target in targets:
                        if target.get('type') != 'page' or target.get('url') != url:
                            continue
                        endpoint = target.get('webSocketDebuggerUrl', '')
                        # Recheck the actual renderer location; a target can navigate after enumeration.
                        expression = '(()=>{if(location.href!==' + json.dumps(url) + ')return {applied:false,reason:"Store navigation changed"};\n' + self.script + '\nreturn installGameHubStore(' + json.dumps(opts) + ',' + json.dumps(self.css) + ');})()'
                        result = await self.evaluate(session, endpoint, expression) or result
                        if result.get('applied'):
                            self.owned[target['id']] = endpoint
                    return result
            except Exception:
                return {'applied':False, 'reason':'Store appearance could not update; reopen Store to recover its native page'}

    async def close(self):
        return await self.update('', {})
