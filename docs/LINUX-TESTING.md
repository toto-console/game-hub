# SteamOS and Bazzite experimental build

Version 0.13.0-dev.53 is a compatibility candidate, not a device-certified release.
No SteamOS or Bazzite hardware was available. Ubuntu CI is not Gaming Mode validation.

Changes:
- Storage reads Decky's owner home filesystem (settings filesystem fallback), rather than the immutable OS root. This is not a sum of Steam libraries or SD cards.
- Store and Friend Activity styling can use Steam's existing loopback CEF endpoint on Linux. It retains exact URL checks, port 8080 restriction, timeouts, and native-page fallback. It does not enable debugging, open ports, change firewall rules, or run privileged commands.
- Python backend checks run on Ubuntu and Windows. Existing frontend regression checks run on Ubuntu.
- Windows XInput remains Windows-only. Linux controller battery reporting is not added; existing controller navigation is retained.

Install using Decky's existing ZIP installation interface in Gaming Mode on a machine that already has Decky. Keep the previous plugin ZIP and settings backup. No root flags or OS modifications are required by Game Hub. Optional plugins must be compatible with the target platform and are not installed automatically.

Device checklist: record distro, Steam build, Decky version and GPU; load Home and Welcome; restart Steam and verify saved settings; test D-pad/A/B/Guide focus, Library scroll and game details; open and close Control Center; test audio adapters with and without optional plugins; test Store/Activity and native fallback; check wallpaper codecs; test a safe in-game overlay session. Do not use saves or force-termination as tests.

Known limitations: Store styling depends on the existing CEF endpoint; desktop Roblox handoff is not certified for Linux; codec availability varies; no Linux live voice, overlay, audio, controller, suspend/resume or performance claims. Update compatibility targets remain empty until a loader/platform combination is certified.

References: https://github.com/SteamDeckHomebrew/decky-plugin-template/blob/main/decky.pyi and https://github.com/SteamDeckHomebrew/decky-loader

Navigation regression checklist: open Switcher > Game Library > B > B; repeat five times. Home must remain Game Hub with working focus. Open a different Control Center panel, press B, and confirm no stale Library appears. Check normal Guide/QAM takeover and intentional native recovery independently.
