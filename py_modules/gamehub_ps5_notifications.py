"""Game Hub's bundled, click-through PlayStation notification overlay for Windows."""
import asyncio
import base64
import binascii
import json
import sys
import tempfile
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1] / "third_party" / "playhub-notifications"
HELPER = ROOT / "helpers" / "PlayhubNotificationsHelper.exe"
SOUNDS = ROOT / "assets" / "sounds" / "playstation"
KINDS = {"achievement", "friend", "message", "invite", "controller", "screenshot",
         "download", "warning", "community", "system"}


class Notifications:
    def __init__(self, runtime, logger):
        self.runtime = Path(runtime)
        self.logger = logger
        self.queue = asyncio.Queue(maxsize=32)
        self.worker = None
        self.closed = False

    def ready(self):
        return (not self.closed and sys.platform == "win32" and HELPER.is_file()
                and HELPER.with_name("PlayhubNotificationsWpf.ps1").is_file())

    def enqueue(self, notice):
        if not isinstance(notice, dict) or self.closed or self.queue.full():
            return {"ok": False, "queued": False}
        self.queue.put_nowait(notice)
        if self.worker is None or self.worker.done():
            self.worker = asyncio.create_task(self._drain())
        return {"ok": True, "queued": True}

    async def _drain(self):
        while not self.queue.empty():
            notice = self.queue.get_nowait()
            try:
                await self._display(notice)
            except Exception:
                self.logger.exception("Game Hub notification display failed")
            finally:
                self.queue.task_done()

    async def _display(self, notice):
        kind = notice.get("kind")
        if kind not in KINDS:
            kind = "system"
        cue = kind if kind in ("message", "achievement") else "system"
        payload = {key: str(notice.get(key) or "")[:limit]
                   for key, limit in (("title", 140), ("body", 320), ("subtitle", 160))}
        payload.update(theme="playstation", position="top-right", kind=kind,
                       duration_ms=6000 if kind == "achievement" else 5500,
                       sound_enabled=True, sound_volume=72, sound_path=str(SOUNDS / (cue + ".wav")))
        self.runtime.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(dir=self.runtime) as temp:
            folder = Path(temp)
            uri = str(notice.get("image") or "")
            try:
                url = urlsplit(uri)
                host = url.hostname or ""
                if url.scheme == "https" and any(host == domain or host.endswith("." + domain)
                        for domain in ("steamstatic.com", "steamcontent.com", "akamaihd.net")):
                    payload["image_remote"] = uri
                    payload["image"] = uri
            except ValueError:
                pass
            data = notice.get("image_data")
            if isinstance(data, str) and len(data) <= 3_000_000:
                header, _, encoded = data.partition(",")
                ext = {"data:image/png;base64": "png", "data:image/jpeg;base64": "jpg",
                       "data:image/gif;base64": "gif"}.get(header)
                if ext:
                    try:
                        image = folder / ("art." + ext)
                        image.write_bytes(base64.b64decode(encoded, validate=True))
                        payload["image"] = str(image)
                    except (ValueError, binascii.Error):
                        pass
            path = folder / "toast.json"
            path.write_text(json.dumps(payload), encoding="utf-8")
            log = self.runtime / "ps5-notifications.log"
            if log.exists() and log.stat().st_size > 512_000:
                log.unlink()
            proc = await asyncio.create_subprocess_exec(
                str(HELPER), "--payload", str(path), "--log", str(log), cwd=HELPER.parent)
            try:
                if await asyncio.wait_for(proc.wait(), timeout=18):
                    raise RuntimeError("Notification renderer failed; see ps5-notifications.log")
            finally:
                if proc.returncode is None:
                    proc.kill()
                    await proc.wait()

    async def close(self):
        self.closed = True
        if self.worker and not self.worker.done():
            self.worker.cancel()
            try:
                await self.worker
            except asyncio.CancelledError:
                pass
