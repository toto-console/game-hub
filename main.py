import asyncio
import json
import os

import decky

from hltb_client import HltbClient

SETTINGS_FILE = os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "home-dashboard.json")
HLTB_CACHE_FILE = os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, "home-hltb-cache.json")


class Plugin:
    notices = None

    async def ps5_notifications_ready(self):
        return bool(self.notices and self.notices.ready())

    async def emit_ps5_notification(self, payload):
        if not await self.ps5_notifications_ready():
            return {"ok": False, "queued": False}
        return self.notices.enqueue(payload)

    def _require_platform(self):
        from package_platform import require_package
        require_package(os.path.dirname(__file__))

    async def export_center_diagnostic(self, report: dict) -> dict:
        from center_diagnostic import export_report
        return await asyncio.to_thread(export_report, report, os.path.dirname(__file__), decky.DECKY_PLUGIN_SETTINGS_DIR)

    async def player_bio(self, steamid: str) -> dict:
        from player_bio import read_bio
        return await asyncio.to_thread(read_bio, steamid)

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
        self._require_platform()
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
                value = json.load(f)
            if not isinstance(value, dict):
                raise ValueError("Home preferences must be an object")
            return value
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
            # A read failure is not a saved choice to disable Home. Reject so the
            # frontend's dependency recovery can retry without changing preferences.
            raise RuntimeError("Saved Home preferences are temporarily unavailable") from e

    async def set_settings(self, settings: dict) -> bool:
        self._require_platform()
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
        self._require_platform()
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
            from platform_storage import storage_snapshot
            result = {}
            storage = storage_snapshot(getattr(decky, "DECKY_USER_HOME", None), decky.DECKY_PLUGIN_SETTINGS_DIR)
            if storage is not None:
                result["storage"] = storage
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

    _display_preview = None
    _display_timer = None

    async def display_modes(self):
        import display_modes
        return {**display_modes.info(), "preview": self._display_preview is not None}

    def _restore_display(self):
        import display_modes
        if self._display_preview is not None:
            display_modes.apply(self._display_preview[0], 0)
        self._clear_display_preview()

    def _clear_display_preview(self):
        if self._display_timer:
            self._display_timer.cancel()
        self._display_timer = self._display_preview = None

    async def display_resolution(self, action: str, key: str):
        import display_modes
        if action == "preview":
            self._restore_display()
            current, choices = display_modes.modes()
            choice = choices.get(key)
            if choice is None:
                raise ValueError("This resolution is unavailable.")
            display_modes.apply(choice, 2)  # CDS_TEST
            display_modes.apply(choice, 0)
            self._display_preview = (current, choice)
            self._display_timer = asyncio.get_running_loop().call_later(15, self._restore_display)
        elif action == "keep" and self._display_preview:
            display_modes.apply(self._display_preview[1], 1)  # CDS_UPDATEREGISTRY
            self._clear_display_preview()
        elif action == "restore":
            self._restore_display()
        return {**display_modes.info(), "preview": self._display_preview is not None}

    async def _main(self):
        self._require_platform()
        from gamehub_ps5_notifications import Notifications
        self.notices = Notifications(decky.DECKY_PLUGIN_RUNTIME_DIR, decky.logger)
        decky.logger.info("PS5 Dashboard loaded")

    async def _unload(self):
        if self.notices:
            await self.notices.close()
        self._restore_display()
        if self.store_appearance_adapter is not None:
            await self.store_appearance_adapter.close()
        decky.logger.info("PS5 Dashboard unloaded")
