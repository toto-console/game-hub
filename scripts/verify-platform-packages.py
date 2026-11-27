"""Validate both actual distribution archives independently, without installation."""
from pathlib import Path
import hashlib,json,sys,zipfile,io,re
root=Path.cwd();sys.path.insert(0,str(root/'py_modules'))
from gamehub_updates import validate_package
from package_platform import require_target
sys.path.insert(0,str(root/'py_modules'))
from package_platform import DISTRIBUTIONS
v=json.loads((root/'package.json').read_text())['version']
for label,(target,channel) in DISTRIBUTIONS.items():
 wrong='linux-x86_64' if target=='windows-x86_64' else 'windows-x86_64'
 p=root.parent/f'Game-Hub-{v}-{label}.zip';data=p.read_bytes();digest=hashlib.sha256(data).hexdigest()
 validate_package(data,digest,v,target)
 try:validate_package(data,digest,v,wrong)
 except ValueError:pass
 else:raise AssertionError('Wrong-platform package was accepted')
 with zipfile.ZipFile(io.BytesIO(data)) as z:
  assert json.loads(z.read('game-base-social/platform-target.json'))['steamChannel']==channel
  if channel=='linux':
   for cue in ('achievement','message','system'):
    assert z.read(f'game-base-social/dist/assets/notifications/{cue}.wav')[:4]==b'RIFF'
  else:
   z.getinfo('game-base-social/third_party/playhub-notifications/helpers/PlayhubNotificationsWpf.ps1')
  frontend=z.read('game-base-social/dist/index.js').decode()
  for art in re.findall(r'127\.0\.0\.1:1337/plugins/Game Base Social/assets/([\w.-]+\.png)',frontend):
   assert z.read('game-base-social/dist/assets/'+art).startswith(b'\x89PNG')
  assert '__GAMEHUB_PACKAGE_TARGET__' not in frontend
  assert target in frontend
  assert 'Incompatible Game Hub package' in frontend
  assert json.loads(z.read('game-base-social/package.json'))['name']=='game-base-decky'
  assert json.loads(z.read('game-base-social/plugin.json'))['version']==v
  assert not any('settings/' in n or 'node_modules/' in n for n in z.namelist())
 print(label+': identity, checksum, frontend gate and wrong-platform refusal passed')
