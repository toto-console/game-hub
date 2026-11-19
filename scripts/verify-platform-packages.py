"""Validate both actual distribution archives independently, without installation."""
from pathlib import Path
import hashlib,json,sys,zipfile,io
root=Path.cwd();sys.path.insert(0,str(root/'py_modules'))
from gamehub_updates import validate_package
from package_platform import require_target
v=json.loads((root/'package.json').read_text())['version']
for label,target,wrong in [('Windows-x64','windows-x86_64','linux-x86_64'),('SteamOS-Bazzite-x64-EXPERIMENTAL','linux-x86_64','windows-x86_64')]:
 p=root.parent/f'Game-Hub-{v}-{label}.zip';data=p.read_bytes();digest=hashlib.sha256(data).hexdigest()
 validate_package(data,digest,v,target)
 try:validate_package(data,digest,v,wrong)
 except ValueError:pass
 else:raise AssertionError('Wrong-platform package was accepted')
 with zipfile.ZipFile(io.BytesIO(data)) as z:
  frontend=z.read('game-base-social/dist/index.js').decode()
  assert '__GAMEHUB_PACKAGE_TARGET__' not in frontend
  assert target in frontend
  assert 'Incompatible Game Hub package' in frontend
  assert json.loads(z.read('game-base-social/package.json'))['name']=='game-base-decky'
  assert json.loads(z.read('game-base-social/plugin.json'))['version']==v
  assert not any('settings/' in n or 'node_modules/' in n for n in z.namelist())
 print(label+': identity, checksum, frontend gate and wrong-platform refusal passed')
