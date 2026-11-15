import sys
from pathlib import Path
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'py_modules'))
from player_bio import parse_bio, read_bio

class BioTests(unittest.TestCase):
    sid = '76561198000000001'
    def xml(self, summary, privacy='public'):
        return f'<profile><steamID64>{self.sid}</steamID64><privacyState>{privacy}</privacyState><summary><![CDATA[{summary}]]></summary></profile>'.encode()
    def test_plain_bio(self):
        self.assertEqual(parse_bio(self.xml('Hello <b>world</b><br>Games &amp; friends'), self.sid)['text'], 'Hello world\nGames & friends')
    def test_empty_private_wrong_identity(self):
        self.assertEqual(parse_bio(self.xml(''), self.sid)['status'], 'empty')
        self.assertEqual(parse_bio(self.xml('Secret','private'), self.sid)['status'], 'private')
        self.assertEqual(parse_bio(self.xml('Hello'), '76561198000000002')['status'], 'unavailable')
    def test_unsafe_or_invalid(self):
        self.assertEqual(parse_bio(b'<!DOCTYPE profile><profile/>', self.sid)['status'], 'unavailable')
        self.assertEqual(parse_bio(self.xml('<script>bad()</script>Fine'), self.sid)['text'], 'Fine')
        self.assertEqual(read_bio('../../bad')['status'], 'unavailable')

    def test_frozen_runtime_without_xml_or_html(self):
        import builtins, runpy
        from unittest.mock import patch
        original = builtins.__import__
        def restricted(name, *args, **kwargs):
            if name.split('.')[0] in ('xml', 'html'):
                raise ModuleNotFoundError(name)
            return original(name, *args, **kwargs)
        with patch('builtins.__import__', side_effect=restricted):
            module = runpy.run_path(str(Path(__file__).resolve().parents[1] / 'py_modules/player_bio.py'))
            self.assertEqual(module['parse_bio'](self.xml('Real bio<br>Second line'), self.sid)['text'], 'Real bio\nSecond line')
