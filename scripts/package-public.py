"""Build distributable archives from explicit public-file allowlists."""
from pathlib import Path
import zipfile, json, hashlib, sys, re
root=Path.cwd();out=root.parent
sys.path.insert(0,str(root/'py_modules'))
from gamehub_updates import validate_package, version as semver
sys.path.insert(0,str(root/'py_modules'))
from package_platform import DISTRIBUTIONS
version=json.loads((root/'package.json').read_text(encoding='utf8'))['version'];semver(version)
docs=['README.md','CHANGELOG.md','RELEASE-NOTES.md','UPDATE-VALIDATION.md','LICENSE','THIRD-PARTY-NOTICES.md']
runtime=[root/n for n in ['dist/index.js','main.py','package.json','plugin.json',*docs]]
source=[root/n for n in ['dist/index.js','main.py','package.json','package-lock.json','plugin.json','rollup.config.js','tsconfig.json','vitest.config.ts','vite.config.ts','eslint.config.js','.gitignore','release-compatibility.json',*docs]]
# Rollup emits content-hashed artwork referenced by the frontend bundle.
art_paths = re.findall(r'127\.0\.0\.1:1337/plugins/Game Base Social/assets/([\w.-]+\.png)',(root/'dist/index.js').read_text(encoding='utf8'))
for name in set(art_paths):
 asset=root/'dist/assets'/name
 runtime.append(asset);source.append(asset)
for folder in ['py_modules','licenses','third_party','store-theme']:
 files=[p for p in (root/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts]
 runtime+=files;source+=files
for folder in ['src','tests','integrations','.github','docs']:
 source += [p for p in (root/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts]
source += [root/'preview'/n for n in ['controls.tsx','fixtures.ts','messages.ts','index.html','main.tsx','decky-stub.tsx']]
source += [root/'scripts'/n for n in ['build-store.mjs','package-public.py','release-manifest.py','verify-platform-packages.py']]
for label,files in [(label,runtime) for label in DISTRIBUTIONS]+[('source',source)]:
 dest=out/f'Game-Hub-{version}-{label}.zip'
 with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED) as z:
  if label!='source':
   target,channel=DISTRIBUTIONS[label]
   z.writestr('game-base-social/platform-target.json',json.dumps({'schema':1,'platform':target,'steamChannel':channel,'automaticInstall':False,'experimental':True}))
  if label in DISTRIBUTIONS and channel=='linux':
   for cue in ('achievement','message','system'):
    z.write(root/f'third_party/playhub-notifications/assets/sounds/playstation/{cue}.wav',f'game-base-social/dist/assets/notifications/{cue}.wav')
  for p in sorted(set(files)):
   if label in DISTRIBUTIONS and channel=='linux' and p.parent.name=='helpers' and p.parent.parent.name=='playhub-notifications':continue
   if p.is_symlink():raise ValueError('Symlinks not distributed')
   data=p.read_bytes()
   if label!='source' and p==root/'dist/index.js':
    if b'__GAMEHUB_PACKAGE_TARGET__' not in data:raise ValueError('Missing frontend platform gate')
    data=data.replace(b'__GAMEHUB_PACKAGE_TARGET__',target.encode())
   if p.suffix in ('.ts','.tsx','.js','.mjs','.py','.json','.md','.html','.yml'):
    text=data.decode('utf-8-sig')
    if re.search(r'[A-Z]:[\\/]+Users[\\/]+[a-zA-Z0-9_.-]+',text):raise ValueError('Private path in '+str(p))
   info=zipfile.ZipInfo('game-base-social/'+p.relative_to(root).as_posix(),(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
   z.writestr(info,data)
 with zipfile.ZipFile(dest) as z:assert z.testzip() is None
 digest=hashlib.sha256(dest.read_bytes()).hexdigest()
 validate_package(dest.read_bytes(),digest,version)
 print(dest.name,digest)
