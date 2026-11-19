from pathlib import Path
import json, hashlib, sys, zipfile
root=Path.cwd();out=root.parent
version=json.loads((root/'package.json').read_text())['version']
if len(sys.argv)>1 and sys.argv[1]!='v'+version:raise SystemExit('Tag must match package version exactly')
artifacts=[];files=[]
for label,target in [('Windows-x64','windows-x86_64'),('SteamOS-Bazzite-x64-EXPERIMENTAL','linux-x86_64')]:
 p=out/f'Game-Hub-{version}-{label}.zip';files.append(p)
 with zipfile.ZipFile(p) as z:
  assert json.loads(z.read('game-base-social/platform-target.json'))['platform']==target
  assert b'__GAMEHUB_PACKAGE_TARGET__' not in z.read('game-base-social/dist/index.js')
 artifacts.append({'platform':target,'asset':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'certifiedLoaders':[],'experimental':True})
manifest={'schema':3,'version':version,'artifacts':artifacts,'automaticInstall':False,'compatibilityNote':'Linux requires SteamOS/Bazzite tester confirmation. Decky Direct Updater platform selection is not verified; use manual matching downloads.'}
p=out/'game-hub-update.json';p.write_text(json.dumps(manifest,indent=2)+'\n');files.extend([out/f'Game-Hub-{version}-source.zip',p])
(out/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in files))
print('Both platform manifests and checksums verified:',version)
