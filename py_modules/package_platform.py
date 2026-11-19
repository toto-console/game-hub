"""Immutable distribution target; never infer hardware from a game or setting."""
import json, platform
from pathlib import Path

def host_target():
    osname=platform.system().lower()
    arch=platform.machine().lower()
    return osname+'-x86_64' if osname in ('windows','linux') and arch in ('amd64','x86_64') else 'unsupported'

def require_target(target, host=None):
    if target not in ('windows-x86_64','linux-x86_64') or target != (host or host_target()):
        raise ValueError('Incompatible Game Hub package. Install the matching platform download; native Steam and saved settings remain available.')

def require_package(root):
    path=Path(root)/'platform-target.json'
    if path.exists():
        require_target(json.loads(path.read_text(encoding='utf8'))['platform'])
    elif not (Path(root)/'src/index.tsx').is_file():
        raise ValueError('Missing Game Hub package target; reinstall a verified platform package.')
