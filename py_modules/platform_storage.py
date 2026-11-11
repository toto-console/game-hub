"""Read-only storage probe; never assume Linux root holds user data."""
import os
import shutil


def storage_snapshot(user_home, settings_dir, system=None):
    system = os.name if system is None else system
    if system == "nt":
        candidates = [(os.environ.get("SystemDrive", "C:") + "\\", "Windows drive")]
    else:
        # Decky supplies the actual owner home, including non-deck Bazzite users.
        candidates = [(user_home, "Home storage"), (settings_dir, "Plugin storage")]
    for path, label in candidates:
        if not path or not os.path.isabs(path):
            continue
        try:
            usage = shutil.disk_usage(path)
            return {"free": usage.free, "total": usage.total, "label": label}
        except OSError:
            continue
    return None
