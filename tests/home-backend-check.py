"""Isolated migration check; never reads the user's actual plugin settings."""
import asyncio
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import types

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / 'py_modules'))
with tempfile.TemporaryDirectory() as temp:
    folder = Path(temp)
    own = folder / 'game-base-social'
    original = folder / 'ps5-dashboard'
    original.mkdir()
    original_file = original / 'settings.json'
    original_file.write_text('{"radius":17,"hltb":false}')
    original_bytes = original_file.read_bytes()
    sys.modules['decky'] = types.SimpleNamespace(
        DECKY_PLUGIN_SETTINGS_DIR=str(own), DECKY_PLUGIN_RUNTIME_DIR=str(folder / 'runtime'),
        logger=types.SimpleNamespace(error=lambda *args: None, info=lambda *args: None))
    spec = importlib.util.spec_from_file_location('home_backend', root / 'main.py')
    backend = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(backend)
    plugin = backend.Plugin()
    async def check():
        seed = await plugin.get_settings()
        assert seed['active'] is False and seed['dashboard']['radius'] == 17
        assert not own.exists()
        assert await plugin.set_settings(seed)
        assert original_file.read_bytes() == original_bytes
        assert (own / 'ps5-dashboard-original-settings.json').read_bytes() == original_bytes
        assert await plugin.get_settings() == seed
    asyncio.run(check())
print('PASS: inactive migration, isolated persistence, original settings backup and preservation')
