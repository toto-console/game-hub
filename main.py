import asyncio
import json
import os

import decky

from hltb_client import HltbClient

SETTINGS_FILE = os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "home-dashboard.json")
HLTB_CACHE_FILE = os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, "home-hltb-cache.json")


class Plugin:
    hltb: HltbClient | None = None
    store_appearance_adapter = None

    update_service = None
    update_lock = None

    async def software_update(self, action: str, loader: str = "", channel: str = "stable", auto: bool = True) -> dict:
        from gamehub_updates import Updates
        if self.update_lock is None:
            self.update_lock = asyncio.Lock()
        async with self.update_lock:
            if self.update_service is None:
                self.update_service = Updates(os.path.dirname(__file__), decky.DECKY_PLUGIN_SETTINGS_DIR, decky.DECKY_PLUGIN_RUNTIME_DIR)
            service = self.update_service
            if action == 'status': return service.status()
            if action == 'preferences': return service.preferences(channel, auto)
            if action == 'check': return await asyncio.to_thread(service.check, loader, True)
            if action == 'auto':
                if not service.state.get('autoCheck', True): return service.status()
                return await asyncio.to_thread(service.check, loader)
            if action == 'backup': return await asyncio.to_thread(service.backup)
            if action == 'prepare': return await asyncio.to_thread(service.prepare, loader)
            raise ValueError('Unknown update action')

    async def store_appearance(self, url: str, options: dict) -> dict:
        if os.name != 'nt':
            return {'applied': False, 'reason': 'Store appearance currently supports Windows only'}
        try:
            if self.store_appearance_adapter is None:
                from store_appearance import StoreAppearance
                self.store_appearance_adapter = StoreAppearance(os.path.dirname(__file__))
            return await self.store_appearance_adapter.update(str(url), options if isinstance(options, dict) else {})
        except Exception:
            return {'applied': False, 'reason': 'Store theme resources unavailable; native Steam remains available'}

    async def hltb_times(self, appid: int, name: str) -> dict | None:
        """HowLongToBeat times (in seconds) for a game, or None if it isn't found."""
        if self.hltb is None:
            self.hltb = HltbClient(HLTB_CACHE_FILE)
        # The lookup does blocking HTTP; keep it off the loader's event loop.
        return await asyncio.get_running_loop().run_in_executor(None, self.hltb.get, int(appid), str(name))

    async def get_settings(self) -> dict:
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            # Read-only migration seed: the original plugin and its settings remain untouched.
            original = os.path.join(os.path.dirname(decky.DECKY_PLUGIN_SETTINGS_DIR), "ps5-dashboard", "settings.json")
            try:
                with open(original, "r", encoding="utf-8") as f:
                    stored = json.load(f)
                return {"dashboard": stored, "active": False}
            except (OSError, ValueError):
                return {"active": False}
        except Exception as e:
            decky.logger.error(f"Could not read settings: {e}")
            return {}

    async def set_settings(self, settings: dict) -> bool:
        try:
            os.makedirs(decky.DECKY_PLUGIN_SETTINGS_DIR, exist_ok=True)
            original = os.path.join(os.path.dirname(decky.DECKY_PLUGIN_SETTINGS_DIR), "ps5-dashboard", "settings.json")
            backup = os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "ps5-dashboard-original-settings.json")
            if os.path.isfile(original) and not os.path.exists(backup):
                import shutil
                shutil.copyfile(original, backup)
            tmp = SETTINGS_FILE + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(settings, f, indent=2)
            os.replace(tmp, SETTINGS_FILE)
            return True
        except Exception as e:
            decky.logger.error(f"Could not save settings: {e}")
            return False

    async def welcome_settings(self) -> dict:
        path = os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "welcome.json")
        try:
            with open(path, encoding="utf-8") as f:
                value = json.load(f)
            return value if isinstance(value, dict) else {}
        except (OSError, ValueError):
            return {}

    async def save_welcome_settings(self, settings: dict) -> bool:
        # Separate atomic preferences; never overwrite Home/other plugin settings.
        if not isinstance(settings, dict) or len(json.dumps(settings)) > 7_100_000:
            return False
        path = os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "welcome.json")
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path + ".tmp", "w", encoding="utf-8") as f:
                json.dump(settings, f)
            os.replace(path + ".tmp", path)
            return True
        except OSError:
            return False

    async def welcome_system(self) -> dict:
        def read():
            import shutil
            result = {}
            try:
                drive = os.path.abspath(os.sep) if os.name != "nt" else os.environ.get("SystemDrive", "C:") + "\\"
                usage = shutil.disk_usage(drive)
                result["storage"] = {"free": usage.free, "total": usage.total, "label": "Windows drive" if os.name == "nt" else "System drive"}
            except OSError:
                pass
            if os.name == "nt":
                import ctypes
                class Battery(ctypes.Structure):
                    _fields_ = [("type", ctypes.c_ubyte), ("level", ctypes.c_ubyte)]
                try:
                    api = ctypes.WinDLL("xinput1_4.dll")
                    rows = []
                    for index in range(4):
                        battery = Battery()
                        if api.XInputGetBatteryInformation(index, 0, ctypes.byref(battery)) == 0 and battery.type != 0:
                            rows.append({"index": index + 1, "wired": battery.type == 1, "level": ["Empty", "Low", "Medium", "Full"][min(3, battery.level)] if battery.type in (2, 3) else None})
                    result["controllers"] = rows
                except (OSError, AttributeError):
                    pass
            return result
        return await asyncio.to_thread(read)

    async def _main(self):
        decky.logger.info("PS5 Dashboard loaded")

    async def _unload(self):
        if self.store_appearance_adapter is not None:
            await self.store_appearance_adapter.close()
        decky.logger.info("PS5 Dashboard unloaded")
