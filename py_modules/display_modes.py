"""Windows primary-display modes. Preview changes without writing the registry."""
import ctypes as ct
import os


class Mode(ct.Structure):
    _fields_ = [
        ("device", ct.c_wchar * 32), ("spec", ct.c_ushort), ("driver", ct.c_ushort),
        ("size", ct.c_ushort), ("extra", ct.c_ushort), ("fields", ct.c_uint32),
        ("display_union", ct.c_byte * 16), ("print_fields", ct.c_short * 5),
        ("form", ct.c_wchar * 32), ("log_pixels", ct.c_ushort),
        ("depth", ct.c_uint32), ("width", ct.c_uint32), ("height", ct.c_uint32),
        ("flags", ct.c_uint32), ("hz", ct.c_uint32), ("remaining", ct.c_uint32 * 8),
    ]


def mode(index):
    value = Mode()
    value.size = ct.sizeof(value)
    if ct.windll.user32.EnumDisplaySettingsW(None, index, ct.byref(value)):
        return value


def modes():
    current = mode(-1)
    if current is None:
        raise RuntimeError("Windows could not read the current display mode.")
    choices = {}
    index = 0
    while (item := mode(index)) is not None:
        index += 1
        key = f"{item.width}x{item.height}"
        if item.depth != current.depth or item.flags != current.flags:
            continue
        previous = choices.get(key)
        if previous is None or (item.hz == current.hz, item.hz) > (previous.hz == current.hz, previous.hz):
            choices[key] = item
    return current, choices


def info():
    if os.name != "nt":
        return {"supported": False}
    current, choices = modes()
    return {"supported": True, "current": f"{current.width}x{current.height}",
            "choices": sorted(choices, key=lambda key: (choices[key].width, choices[key].height), reverse=True)}


def apply(value, flags):
    code = ct.windll.user32.ChangeDisplaySettingsW(ct.byref(value), flags)
    if code != 0:
        raise RuntimeError(f"Windows declined this display mode ({code}).")
