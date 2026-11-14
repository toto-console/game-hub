"""Build distributable archives from explicit public-file allowlists."""
from pathlib import Path
import zipfile, json, hashlib, sys, re
root=Path.cwd();out=root.parent
sys.path.insert(0,str(root/'py_modules'))
from gamehub_updates import validate_package, version as semver
version=json.loads((root/'package.json').read_text(encoding='utf8'))['version'];semver(version)
docs=['README.md','CHANGELOG.md','RELEASE-NOTES.md','UPDATE-VALIDATION.md','LICENSE','THIRD-PARTY-NOTICES.md']
runtime=[root/n for n in ['dist/index.js','main.py','package.json','plugin.json',*docs]]
source=[root/n for n in ['dist/index.js','main.py','package.json','package-lock.json','plugin.json','rollup.config.js','tsconfig.json','vitest.config.ts','vite.config.ts','eslint.config.js','.gitignore','release-compatibility.json',*docs]]
for folder in ['py_modules','licenses','third_party','store-theme']:
 files=[p for p in (root/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts]
 runtime+=files;source+=files
for folder in ['src','tests','integrations','.github','docs']:
 source += [p for p in (root/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts]
source += [root/'preview'/n for n in ['controls.tsx','fixtures.ts','messages.ts','index.html','main.tsx','decky-stub.tsx']]
source += [root/'scripts'/n for n in ['build-store.mjs','package-public.py','release-manifest.py']]
for label,files in [('decky',runtime),('source',source)]:
 dest=out/f'Game-Hub-{version}-{label}.zip'
 with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED) as z:
  for p in sorted(set(files)):
   if p.is_symlink():raise ValueError('Symlinks not distributed')
   data=p.read_bytes()
   if p.suffix in ('.ts','.tsx','.js','.mjs','.py','.json','.md','.html','.yml'):
    text=data.decode('utf-8-sig')
    if re.search(r'[A-Z]:[\\/]+Users[\\/]+[a-zA-Z0-9_.-]+',text):raise ValueError('Private path in '+str(p))
   info=zipfile.ZipInfo('game-base-social/'+p.relative_to(root).as_posix(),(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
   z.writestr(info,data)
 with zipfile.ZipFile(dest) as z:assert z.testzip() is None
 digest=hashlib.sha256(dest.read_bytes()).hexdigest()
 validate_package(dest.read_bytes(),digest,version)
 print(dest.name,digest)

# Stable asset basename matches Decky identity without changing installed directories.
import shutil
shutil.copyfile(out/f"Game-Hub-{version}-decky.zip", out/"Game-Base-Social.zip")
