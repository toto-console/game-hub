"""Release discovery and staging only. Decky owns installation; never extract packages here."""
import json, re, time, platform, hashlib, io, zipfile, stat
from pathlib import Path, PurePosixPath
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.parse import urlparse
from functools import cmp_to_key
REPO = 'toto-console/game-hub'
PREFIX = 'game-base-social/'

def version(value):
    m = re.fullmatch(r'(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?', value)
    if not m: raise ValueError('Invalid release version')
    pre = m[4].split('.') if m[4] else []
    if any(not p or (p.isdigit() and len(p)>1 and p[0]=='0') for p in pre): raise ValueError('Invalid prerelease')
    return tuple(map(int,m.group(1,2,3))), pre

def compare(a,b):
    ac,ap=version(a);bc,bp=version(b)
    if ac!=bc:return (ac>bc)-(ac<bc)
    if not ap or not bp:return (not ap)-(not bp)
    for x,y in zip(ap,bp):
        if x==y:continue
        if x.isdigit() and y.isdigit():return (int(x)>int(y))-(int(x)<int(y))
        if x.isdigit()!=y.isdigit():return -1 if x.isdigit() else 1
        return (x>y)-(x<y)
    return (len(ap)>len(bp))-(len(ap)<len(bp))

TRUSTED_HOSTS = ('api.github.com','github.com','release-assets.githubusercontent.com','objects.githubusercontent.com')
def trusted_url(url):
    u=urlparse(url)
    if u.scheme!='https' or u.hostname not in TRUSTED_HOSTS or u.username or u.password or u.port not in (None,443):
        raise ValueError('Untrusted download URL')
class TrustedRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        trusted_url(newurl)
        return super().redirect_request(req,fp,code,msg,headers,newurl)
def get(url,limit=1048576):
    trusted_url(url)
    u=urlparse(url)
    if u.scheme!='https' or u.hostname not in ('api.github.com','github.com') or u.username:raise ValueError('Untrusted release URL')
    with build_opener(TrustedRedirect()).open(Request(url,headers={'User-Agent':'GameHub-Updater','Accept':'application/vnd.github+json' if u.hostname=='api.github.com' else 'application/octet-stream'}),timeout=20) as r:
        final=urlparse(r.url)
        if final.scheme!='https' or final.hostname not in ('api.github.com','github.com','release-assets.githubusercontent.com','objects.githubusercontent.com'):raise ValueError('Untrusted download redirect')
        data=r.read(limit+1)
        if len(data)>limit:raise ValueError('Release file exceeds size limit')
        return data

def validate_package(data,digest,expected):
    if not re.fullmatch('[0-9a-f]{64}',digest) or hashlib.sha256(data).hexdigest()!=digest:raise ValueError('Package checksum mismatch')
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        seen=set();total=0
        for f in z.infolist():
            name=f.orig_filename;p=PurePosixPath(name);total+=f.file_size
            if any(ord(c)<32 for c in name) or not name.startswith(PREFIX) or any(x in ('', '.', '..') or x.endswith((' ', '.')) or x.split('.')[0].upper() in ('CON','PRN','AUX','NUL',*[f'COM{i}' for i in range(1,10)],*[f'LPT{i}' for i in range(1,10)]) for x in name.rstrip('/').split('/')) or '\\' in name or ':' in name or name.rstrip('/').lower() in seen or stat.S_ISLNK(f.external_attr>>16):raise ValueError('Unsafe package path')
            seen.add(name.rstrip('/').lower())
        if total>100_000_000 or len(seen)>2000 or z.testzip():raise ValueError('Invalid package archive')
        package=json.loads(z.read(PREFIX+'package.json'));plugin=json.loads(z.read(PREFIX+'plugin.json'))
        if package.get('version')!=expected or plugin.get('name')!='Game Base Social' or package.get('remote_binary') or plugin.get('flags'):raise ValueError('Unexpected package identity or privileges')
        for name in ('main.py','dist/index.js'):z.getinfo(PREFIX+name)

class Updates:
    def __init__(self,root,settings,runtime):
        self.root=Path(root);self.settings=Path(settings);self.runtime=Path(runtime)/'updates';self.runtime.mkdir(parents=True,exist_ok=True)
        self.current=json.loads((self.root/'package.json').read_text())['version']
        version(self.current)
        self.state=self.read();self.result=None;self.attempt=0;self.check_key=None;self.loader='' 
    def read(self):
        try:
            data=json.loads((self.settings/'updates.json').read_text())
            if not isinstance(data,dict):raise ValueError('Invalid preferences')
            if data.get('channel') not in ('stable','beta'):data['channel']='stable'
            if type(data.get('autoCheck')) is not bool:data['autoCheck']=True
            return data
        except (OSError,ValueError):return {'channel':'stable','autoCheck':True}
    def write(self):
        self.settings.mkdir(parents=True,exist_ok=True);p=self.settings/'updates.json';tmp=p.with_suffix('.tmp');tmp.write_text(json.dumps(self.state));tmp.replace(p)
    def preferences(self,channel,auto):
        if channel not in ('stable','beta') or type(auto)!=bool:raise ValueError('Invalid update preferences')
        self.state.update(channel=channel,autoCheck=auto);self.write();self.result=None;self.check_key=None
        return self.status()
    def status(self):
        return {'current':self.current,'platform':platform.system()+' '+platform.machine(),'repository':REPO,'channel':self.state.get('channel','stable'),'autoCheck':self.state.get('autoCheck',True),'loader':self.loader,'lastSuccess':None,'lastCheck':self.state.get('lastCheck'),'result':self.result,'automaticInstall':False,'recovery':self.state.get('recovery')}
    def check(self,loader,force=False):
        self.loader=loader
        key=(loader,self.state.get('channel'))
        if self.check_key==key and time.time()-self.attempt<(60 if force else 21600):return self.status()
        self.attempt=time.time();self.check_key=key
        try:
            if not isinstance(loader,str) or len(loader)>100:raise ValueError("Invalid loader version")
            releases=json.loads(get(f'https://api.github.com/repos/{REPO}/releases?per_page=30'))
            eligible=[]
            for r in releases:
                if r.get('draft') or (r.get('prerelease') and self.state.get('channel')!='beta'):continue
                v=r.get('tag_name','').removeprefix('v')
                try:
                    if self.state.get('channel')!='beta' and version(v)[1]:continue
                    if compare(v,self.current)>0:eligible.append((v,r))
                except ValueError:continue
            eligible.sort(key=cmp_to_key(lambda a,b:compare(a[0],b[0])),reverse=True)
            self.result={'status':'current','message':'No newer compatible release is available.'}
            for v,r in eligible:
                base=f'https://github.com/{REPO}/releases/download/v{v}/'
                meta=next((a for a in r.get('assets',[]) if a.get('name')=='game-hub-update.json' and a.get('browser_download_url')==base+'game-hub-update.json'),None)
                if not meta:continue
                manifest=json.loads(get(meta['browser_download_url']))
                if manifest.get('schema')!=2 or manifest.get('version')!=v:continue
                host=platform.system().lower()+'-'+platform.machine().lower()
                target=next((t for t in manifest.get('targets',[]) if t.get('platform')==host and t.get('loader')==loader),None)
                if not target:
                    self.result={'status':'incompatible','message':'A newer release exists, but this platform/Decky combination has not been validated. See official releases for experimental testing instructions.'}
                    continue
                asset=f'Game-Hub-{v}-decky.zip';digest=manifest.get('sha256','')
                if not re.fullmatch('[0-9a-f]{64}',digest) or manifest.get('asset')!=asset:continue
                if not any(a.get('browser_download_url')==base+asset for a in r.get('assets',[])):continue
                self.result={'status':'available','message':'A newer package is available for manual testing. Automatic installation is disabled.','version':v,'url':base+asset,'sha256':digest,'changelog':str(r.get('body') or 'No release notes supplied.')[:12000]};break
            self.state['lastCheck']=int(time.time());self.write()
        except Exception:
            self.result={'status':'unavailable','message':'Release check unavailable. The repository may not be published, the network may be offline, or the loader version could not be verified. Your installation is unchanged.'}
        return self.status()
    def prepare(self,loader):
        self.attempt=0;self.check(loader,True)
        r=self.result
        if not r or r.get('status')!='available':raise ValueError('No verified compatible update available')
        data=get(r['url'],32_000_000);validate_package(data,r['sha256'],r['version'])
        self.backup()
        staged=self.runtime/'verified-update.zip';tmp=staged.with_suffix('.tmp');tmp.write_bytes(data);tmp.replace(staged)
        return {'path':str(staged),'version':r['version'],'hash':r['sha256']}
    def backup(self):
        # Backups survive plugin unload and are never uploaded. No extraction or install here.
        destination=self.runtime/('backup-'+self.current)
        if destination.exists():
            self.state['recovery']=str(destination/'rollback.zip');self.write();return self.status()
        temporary=self.runtime/('backup-'+self.current+'.pending');temporary.mkdir(exist_ok=True)
        for base,name,prefix in [(self.root,'rollback.zip',PREFIX),(self.settings,'settings-backup.zip','settings/')]:
            tmp=temporary/(name+'.tmp')
            with zipfile.ZipFile(tmp,'w',zipfile.ZIP_DEFLATED) as z:
                for p in base.rglob('*'):
                    if p.is_file() and not p.is_symlink() and not any(x in p.parts for x in ('node_modules','.git','__pycache__')):z.write(p,prefix+p.relative_to(base).as_posix())
            tmp.replace(temporary/name)
        temporary.replace(destination)
        self.state['recovery']=str(destination/'rollback.zip');self.write()
        return self.status()
