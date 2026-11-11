import sys, unittest
from pathlib import Path
from unittest.mock import patch
from types import SimpleNamespace
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "py_modules"))
from platform_storage import storage_snapshot

class StorageTests(unittest.TestCase):
    def test_linux_uses_decky_owner_not_root(self):
        with patch("platform_storage.os.path.isabs", return_value=True), patch("platform_storage.shutil.disk_usage", return_value=SimpleNamespace(free=42,total=100)) as disk:
            self.assertEqual(storage_snapshot("/home/player", "/home/player/homebrew/settings", "posix"), {"free":42,"total":100,"label":"Home storage"})
            disk.assert_called_once_with("/home/player")

    def test_missing_home_falls_back_to_decky_settings(self):
        with patch("platform_storage.os.path.isabs", return_value=True), patch("platform_storage.shutil.disk_usage", return_value=SimpleNamespace(free=42,total=100)) as disk:
            self.assertEqual(storage_snapshot(None, "/var/home/player/homebrew/settings", "posix")["label"], "Plugin storage")
            disk.assert_called_once_with("/var/home/player/homebrew/settings")

    def test_unreadable_storage_is_omitted(self):
        with patch("platform_storage.os.path.isabs", return_value=True), patch("platform_storage.shutil.disk_usage", side_effect=PermissionError):
            self.assertIsNone(storage_snapshot("/home/player", "/settings", "posix"))

    def test_windows_drive_preserved(self):
        with patch.dict("os.environ", {"SystemDrive":"Z:"}), patch("platform_storage.os.path.isabs", return_value=True), patch("platform_storage.shutil.disk_usage", return_value=SimpleNamespace(free=42,total=100)) as disk:
            self.assertEqual(storage_snapshot("ignored", "ignored", "nt")["label"], "Windows drive")
            disk.assert_called_once_with("Z:" + chr(92))

    def test_relative_paths_not_used(self):
        with patch("platform_storage.shutil.disk_usage") as disk:
            self.assertIsNone(storage_snapshot("relative", "relative", "posix"))
            disk.assert_not_called()
