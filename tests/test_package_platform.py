import json,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'py_modules'))
import package_platform as p
class PlatformTest(unittest.TestCase):
 def test_host_aliases(self):
  for osname,arch,result in [('Windows','AMD64','windows-x86_64'),('Linux','x86_64','linux-x86_64'),('Linux','aarch64','unsupported'),('Darwin','x86_64','unsupported')]:
   with patch.object(p.platform,'system',return_value=osname),patch.object(p.platform,'machine',return_value=arch):self.assertEqual(p.host_target(),result)
 def test_wrong_package_does_not_modify_settings(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);prefs=root/'home-dashboard.json';prefs.write_text('{"active":true}')
   for target in ['windows-x86_64','linux-x86_64']:
    (root/'platform-target.json').write_text(json.dumps({'platform':target}))
    with patch.object(p,'host_target',return_value=target):p.require_package(root)
    with patch.object(p,'host_target',return_value='unsupported'):self.assertRaises(ValueError,p.require_package,root)
    self.assertEqual(prefs.read_text(),'{"active":true}')
 def test_missing_target_rejected(self):
  with tempfile.TemporaryDirectory() as d:self.assertRaises(ValueError,p.require_package,d)
