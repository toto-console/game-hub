import hashlib, io, json, sys, tempfile, unittest, zipfile
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'py_modules'))
import gamehub_updates as u

def package(extra=None, version='1.1.0'):
    stream=io.BytesIO()
    with zipfile.ZipFile(stream,'w') as z:
        for name,data in {'package.json':json.dumps({'version':version}), 'plugin.json':json.dumps({'name':'Game Base Social','flags':[]}), 'main.py':'# backend', 'dist/index.js':'// plugin'}.items():z.writestr(u.PREFIX+name,data)
        if extra:
            info=zipfile.ZipInfo();info.filename=extra[0];z.writestr(info,extra[1])
    return stream.getvalue()

class UpdatesTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.base=Path(self.tmp.name);self.root=self.base/'plugin';self.root.mkdir();(self.root/'package.json').write_text('{"version":"1.0.0"}')
        self.settings=self.base/'settings';self.settings.mkdir();(self.settings/'preferences.json').write_text('{"keep":true}')
        self.service=u.Updates(self.root,self.settings,self.base/'runtime')
        self.data=package();self.digest=hashlib.sha256(self.data).hexdigest()
    def feed(self, version='1.1.0', prerelease=False, target=True):
        base=f'https://github.com/{u.REPO}/releases/download/v{version}/';asset=f'Game-Hub-{version}-decky.zip'
        release={'tag_name':'v'+version,'prerelease':prerelease,'body':'Changes','assets':[{'name':'game-hub-update.json','browser_download_url':base+'game-hub-update.json'},{'name':asset,'browser_download_url':base+asset}]}
        manifest={'schema':2,'version':version,'asset':asset,'sha256':self.digest,'targets':[{'platform':u.platform.system().lower()+'-'+u.platform.machine().lower(),'loader':'3.0.0'}] if target else []}
        return lambda url,*args: json.dumps([release]).encode() if 'api.github.com' in url else json.dumps(manifest).encode() if url.endswith('.json') else self.data
    def test_semver(self):
        for a,b in [('1.0.0','1.0.0-beta.9'),('1.0.0-beta.10','1.0.0-beta.2'),('2.0.0','1.99.0')]:self.assertGreater(u.compare(a,b),0)
        self.assertEqual(u.compare('1.0.0+one','1.0.0+two'),0)
        for invalid in ['1.0','01.0.0','1.0.0-beta.01','../evil']:self.assertRaises(ValueError,u.version,invalid)
    def test_valid_package(self):u.validate_package(self.data,self.digest,'1.1.0')
    def test_checksum_and_identity(self):
        self.assertRaises(ValueError,u.validate_package,self.data,'0'*64,'1.1.0')
        self.assertRaises(ValueError,u.validate_package,self.data,self.digest,'2.0.0')
    def test_unsafe_paths(self):
        for name in ['../escape','other-plugin/main.py',u.PREFIX+'../escape',u.PREFIX+'CON.txt',u.PREFIX+'a./b',u.PREFIX+'MAIN.PY',u.PREFIX+'a:b',u.PREFIX+'a\\b',u.PREFIX+'a\x00b']:
            with self.subTest(name=name):
                data=package((name,'bad'));self.assertRaises(ValueError,u.validate_package,data,hashlib.sha256(data).hexdigest(),'1.1.0')
    def test_redirect_rejected_before_fetch(self):
        from urllib.request import Request
        for url in ['http://github.com/a','https://evil.example/a','https://github.com:444/a','https://user@github.com/a']:
            self.assertRaises(ValueError,u.TrustedRedirect().redirect_request,Request('https://github.com'),None,302,'',{},url)
    def test_channels(self):
        for pre in (True,False):
            with patch.object(u,'get',side_effect=self.feed('1.1.0-beta.1',pre)):
                self.assertEqual(self.service.check('3.0.0')['result']['status'],'current')
                self.service.preferences('beta',True)
                self.assertEqual(self.service.check('3.0.0')['result']['status'],'available')
            self.service.preferences('stable',True)
    def test_incompatible(self):
        with patch.object(u,'get',side_effect=self.feed(target=False)):
            self.assertEqual(self.service.check('3.0.0')['result']['status'],'incompatible')
            self.assertRaises(ValueError,self.service.prepare,'3.0.0')
    def test_no_downgrade(self):
        with patch.object(u,'get',side_effect=self.feed('0.9.0')):self.assertEqual(self.service.check('3.0.0')['result']['status'],'current')
    def test_throttle_and_offline(self):
        with patch.object(u,'get',side_effect=OSError('offline')) as fetch:
            self.assertEqual(self.service.check('3.0.0')['result']['status'],'unavailable')
            self.service.check('3.0.0',True);self.assertEqual(fetch.call_count,1)
    def test_staging_preserves_files_and_backups(self):
        before=(self.settings/'preferences.json').read_bytes()
        with patch.object(u,'get',side_effect=self.feed()):result=self.service.prepare('3.0.0')
        self.assertEqual(Path(result['path']).read_bytes(),self.data)
        self.assertEqual((self.settings/'preferences.json').read_bytes(),before)
        self.assertEqual(json.loads((self.root/'package.json').read_text())['version'],'1.0.0')
        backup=Path(self.service.status()['recovery']);self.assertTrue(backup.exists())
        with zipfile.ZipFile(backup.with_name('settings-backup.zip')) as z:self.assertEqual(z.read('settings/preferences.json'),before)
        old=backup.read_bytes();self.service.backup();self.assertEqual(backup.read_bytes(),old)
    def test_invalid_download_never_stages(self):
        fetch=self.feed()
        with patch.object(u,'get',side_effect=lambda url,*args: b'partial' if url.endswith('.zip') else fetch(url,*args)):
            self.assertRaises(ValueError,self.service.prepare,'3.0.0')
        self.assertFalse((self.service.runtime/'verified-update.zip').exists())
        self.assertFalse((self.service.runtime/'backup-1.0.0').exists())
    def test_bad_preferences_recover(self):
        (self.settings/'updates.json').write_text('[]')
        service=u.Updates(self.root,self.settings,self.base/'runtime')
        self.assertEqual(service.status()['channel'],'stable')
        self.assertRaises(ValueError,service.preferences,'unknown',True)
if __name__=='__main__':unittest.main()
