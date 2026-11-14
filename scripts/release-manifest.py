from pathlib import Path
import json, hashlib, sys, zipfile
root=Path.cwd();out=root.parent
version=json.loads((root/'package.json').read_text())['version']
if len(sys.argv)>1 and sys.argv[1]!='v'+version:raise SystemExit('Tag must match package version exactly')
name=f'Game-Hub-{version}-decky.zip';digest=hashlib.sha256((out/name).read_bytes()).hexdigest()
compat=json.loads((root/'release-compatibility.json').read_text())
manifest={'schema':2,'version':version,'asset':name,'sha256':digest,'targets':compat['targets'],'automaticInstall':False,'compatibilityNote':compat['reason']}
(out/'game-hub-update.json').write_text(json.dumps(manifest,indent=2)+'\n')
source=out/f'Game-Hub-{version}-source.zip'
with zipfile.ZipFile(source) as z:
    assert z.testzip() is None
    for required in ('src/index.tsx','package-lock.json','.github/workflows/release.yml','scripts/release-manifest.py'):z.getinfo('game-base-social/'+required)
files=[out/'Game-Base-Social.zip',out/name,out/f'Game-Hub-{version}-source.zip',out/'game-hub-update.json']
(out/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in files))
print('Release manifest and checksums verified for',version)
