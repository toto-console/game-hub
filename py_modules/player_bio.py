"""Bounded, read-only public Steam Community profile summaries; no credentials."""
import re
import time
import threading
import urllib.request
import urllib.error
def plain_text(value):
    value = re.sub(r'<(script|style)\b[^>]*>.*?</\1\s*>', '', value, flags=re.I | re.S)
    value = re.sub(r'<(?:br|/?p|/?div)\b[^>]*>', '\n', value, flags=re.I)
    value = re.sub(r'<[^>]*>', '', value)
    entities = {'amp': '&', 'lt': '<', 'gt': '>', 'quot': '"', 'apos': "'", 'nbsp': ' '}
    def decode(match):
        key = match.group(1)
        try:
            if key.startswith('#x') or key.startswith('#X'):
                return chr(int(key[2:], 16))
            if key.startswith('#'):
                return chr(int(key[1:]))
        except (ValueError, OverflowError):
            return ''
        return entities.get(key, match.group(0))
    return re.sub(r'&(#x[0-9a-fA-F]+|#X[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);', decode, value)


def parse_bio(data, steamid):
    if len(data) > 512000 or b'<!DOCTYPE' in data.upper() or b'<!ENTITY' in data.upper():
        return {'status': 'unavailable'}
    try:
        # Decky's frozen Windows Python omits xml.etree. Read only bounded,
        # known scalar fields from Steam's XML, never expand XML entities.
        xml = data.decode('utf-8-sig')
        if not re.search(r'<profile(?:\s[^>]*)?>', xml):
            return {'status': 'unavailable'}
        def field(name):
            match = re.search(r'<' + name + r'>(.*?)</' + name + r'>', xml, re.S)
            if not match:
                return None
            value = match.group(1).strip()
            if value.startswith('<![CDATA[') and value.endswith(']]>'):
                return value[9:-3]
            return value
        if field('steamID64') != steamid:
            return {'status': 'unavailable'}
        if field('privacyState') != 'public':
            return {'status': 'private'}
        raw = field('summary')
        if raw is None:
            return {'status': 'unavailable'}
        text = '\n'.join(line.strip() for line in plain_text(raw).splitlines() if line.strip())[:4000]
        return {'status': 'ready' if text else 'empty', 'text': text}
    except (UnicodeError, ValueError):
        return {'status': 'unavailable'}


_cache = {}
_lock = threading.Lock()


def read_bio(steamid):
    if not isinstance(steamid, str) or not re.fullmatch(r'7656119\d{10}', steamid):
        return {'status': 'unavailable'}
    # Serialize bounded requests and coalesce repeated opens of the same profile.
    with _lock:
        now = time.monotonic()
        if steamid in _cache and now - _cache[steamid][0] < (55 if _cache[steamid][1]['status'] not in ('unavailable', 'retry') else 10):
            return _cache[steamid][1]
        result = {'status': 'unavailable'}
        try:
            url = f'https://steamcommunity.com/profiles/{steamid}/?xml=1'
            request = urllib.request.Request(url, headers={'User-Agent': 'GameHub/1.0'})
            with urllib.request.urlopen(request, timeout=5) as response:
                result = parse_bio(response.read(512001), steamid)
        except urllib.error.HTTPError as exc:
            result = {'status': 'retry', 'retryAfter': 60 if exc.code in (429, 503) else 15}
        except Exception:
            result = {'status': 'retry', 'retryAfter': 15}
        if len(_cache) >= 40:
            _cache.pop(next(iter(_cache)))
        _cache[steamid] = (time.monotonic(), result)
        return result
