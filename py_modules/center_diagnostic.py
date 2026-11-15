"""Explicitly requested local report; allowlisted fields, no user/game identifiers."""
import json
import platform
import re
from pathlib import Path

REASONS = {'ready','disposed','disabled','ui-not-mounted','window-unavailable','navigation-unavailable','vr-unsupported','overlay-activation-unavailable','overlay-app-context-unavailable','overlay-composition-unavailable','overlay-route-unsupported','game-running-in-main-window','another-modal-active','steam-menu-suppressed','steam-interface-unavailable','open-failed','opened','none'}
def sanitize(report):
    result = {'inputMethod':'Steam MenuStore request (not raw controller input)'}
    result['inGameIntegration'] = report.get('inGameIntegration') if report.get('inGameIntegration') in ('available','unavailable','unknown') else 'unknown'
    for field in ('controllerModel','steamInputConfiguration','launchMethod','displayMode','steamVersion','deckyVersion','playHubVersion'):
        result[field]='unknown'
    result['deckyUI']=report.get('deckyUI') if report.get('deckyUI') in ('present','unknown') else 'unknown'
    result['playHubPlugin']=report.get('playHubPlugin') if report.get('playHubPlugin') in ('loaded','not-observed','unknown') else 'unknown'
    result['contexts']=[]
    for item in report.get('contexts',[])[:8]:
        if not isinstance(item,dict): continue
        clean={'context':item.get('context') if item.get('context') in ('home','in-game') else 'unknown'}
        for key in ('mounted','hooked','enabled','open','activationSubscribed'):
            clean[key]=item.get(key) if isinstance(item.get(key),bool) else None
        for key in ('reason','lastResult'):
            clean[key]=item.get(key) if item.get(key) in REASONS else 'unknown'
        clean['lastAction']=item.get('lastAction') if item.get('lastAction') in ('none','open','desktop-handoff','native-menu-request') else 'unknown'
        result['contexts'].append(clean)
    return result

def metadata_version(path):
    try:
        value=json.loads(path.read_text(encoding='utf-8')).get('version','')
        return value if isinstance(value,str) and re.fullmatch(r'[0-9][0-9A-Za-z.+-]{0,47}',value) else 'unknown'
    except (OSError,ValueError):return 'unknown'

def export_report(report, plugin_dir):
    result=sanitize(report)
    root=Path(plugin_dir)
    result['gameHubVersion']=metadata_version(root/'package.json')
    result['platform']=platform.system() if platform.system() in ('Windows','Linux','Darwin') else 'unknown'
    result['osVersion']=platform.version() if re.fullmatch(r'[0-9.]{1,40}',platform.version()) else 'unknown'
    result['playHubPluginVersion']=metadata_version(root.parent/'gaming-mode'/'package.json')
    result['note']='PlayHub plugin version is not the PlayHub distribution version. Unknown fields require tester confirmation. No physical controller or game test is implied.'
    downloads=Path.home()/'Downloads'
    if not downloads.is_dir(): raise ValueError('Downloads folder unavailable')
    # Exclusive create: never overwrite a user file, even on repeated exports.
    for number in range(1,1001):
        path=downloads/f'Game-Hub-Control-Center-report-{number}.json'
        try:
            with path.open('x',encoding='utf-8') as handle:json.dump(result,handle,indent=2)
            return {'path':str(path)}
        except FileExistsError:continue
    raise ValueError('Report limit reached')
