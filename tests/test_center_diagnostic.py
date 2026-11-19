import sys,unittest,tempfile,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'py_modules'))
from center_diagnostic import sanitize,home_preferences
class DiagnosticTests(unittest.TestCase):
 def test_drops_identifiers_and_untrusted_text(self):
  clean=sanitize({'cookies':'secret','steamVersion':'token','contexts':[{'context':'in-game','reason':'private message','lastAction':'native-menu-request','mounted':True,'appid':123,'steamid':'76561190000000000'}]})
  self.assertNotIn('secret',str(clean));self.assertNotIn('private message',str(clean));self.assertNotIn('7656119',str(clean));self.assertEqual(clean['steamVersion'],'unknown')
  self.assertEqual(clean['contexts'][0]['reason'],'unknown');self.assertTrue(clean['contexts'][0]['mounted'])
 def test_retains_useful_capability_reason(self):
  clean=sanitize({'inGameIntegration':'unavailable','contexts':[{'context':'in-game','reason':'overlay-activation-unavailable','lastAction':'native-menu-request','lastResult':'overlay-activation-unavailable'}]})
  self.assertEqual(clean['contexts'][0]['lastResult'],'overlay-activation-unavailable')
 def test_home_flags_are_read_only_and_distinguish_missing_or_invalid_settings(self):
  with tempfile.TemporaryDirectory() as folder:
   self.assertEqual(home_preferences(folder),{'status':'missing'})
   path=Path(folder)/'home-dashboard.json'
   path.write_text(json.dumps({'active':True,'dashboard':{'enabled':True,'ps5Home':True},'private':'omit'}))
   before=path.read_bytes()
   self.assertEqual(home_preferences(folder),{'status':'loaded','active':True,'enabled':True,'ps5Home':True})
   self.assertEqual(path.read_bytes(),before)
   path.write_text('[]');self.assertEqual(home_preferences(folder),{'status':'read-error'})
if __name__=='__main__':unittest.main()
