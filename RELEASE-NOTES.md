# Game Hub 0.13.0-dev.47

Experimental Linux compatibility candidate. Install **Game-Hub-0.13.0-dev.47-decky.zip** through Decky and verify SHA256SUMS.txt. Do not install GitHub's automatic Source code archives.

## Changes since dev.46

- Linux Welcome storage uses Decky's actual user home filesystem, with a settings-filesystem fallback, instead of the operating-system root partition. Windows drive reporting is preserved.
- Store/Friend Activity styling now uses capability detection on Linux as well as Windows. It only uses Steam's existing loopback renderer endpoint; no ports, firewall settings, services, or OS configuration are changed. If unavailable, native Steam remains the fallback.
- The named source ZIP includes its matching compiled frontend and receives the same package validation as the install ZIP. Previously a named source ZIP installed as a plugin could leave Decky unable to fetch the missing frontend.
- Added Windows/Ubuntu backend test jobs and a Linux device acceptance checklist.

## Steam Deck loading error

A report shows “Failed to fetch dynamically imported module.” The installed version, ZIP and full URL are unknown, so the cause on that device is unconfirmed. The dev.46 install ZIP contains dist/index.js; its source ZIP does not. Reinstall the named -decky.zip through Decky, then restart Steam when idle if necessary. Preserve settings. If the issue persists, report Game Hub, Decky and Steam versions plus the complete failed-module URL and matching Decky log error. This release does not claim to resolve every cause of that error.

## Compatibility and testing

No SteamOS or Bazzite device was available. This is not a verified Linux support release. Automated Ubuntu tests cannot validate Gaming Mode, Guide input, voice, optional-plugin audio, video codecs or game overlays. See docs/LINUX-TESTING.md in the source package for the device checklist and remaining limitations.

Existing Windows UI and integrations are preserved. Optional plugins are not installed or modified. No game processes or saves are touched. Automatic update installation remains disabled and compatibility targets remain uncertified. Keep your previous ZIP and settings backup for rollback.
