# Windows tester investigation — November 19, 2026

## Evidence and current scope
The tester reports that all other optional Decky plugins were disabled during the original recording and the faults persisted. This reduces the priority of optional-plugin interference; it does not identify the exact loader/runtime versions or establish a root cause. No further blanket plugin disabling is requested.

Latest clarification: the remaining reported issue is that PS5 Home does not appear after restarting Steam, but Control Center -> Home opens it. Older Overlay/sidebar failures are historical unless reproduced in the new identified build.

## Comparison established locally
| Component | Working local installation | Tester |
|---|---|---|
| Game Hub runtime | 0.13.0-dev.103, verified in loaded registration and installed package | Build previously sent is unknown; obtain displayed version and ZIP name |
| Decky Loader | Runtime reports `dev`; do not substitute the remote available release number | Obtain runtime version/build or binary fingerprint if `dev` |
| PlayHub Decky plugin | 2.1.0 loaded | Unknown |
| PlayHub distribution | Not established from plugin version; local DeckyHost product metadata is 1.0.0+a5e79db0da2a7b918118eece64447dea2866fe2e | Obtain PlayHub distribution version separately |
| Steam executable | Active steam.exe file version 11.23.65.88; not a replacement for About Steam build/channel | Obtain About Steam build/channel |
| Steam package metadata | win64 manifest 1794536281, win32 manifest 1759461205; coexistence does not establish the loaded UI build | Obtain About Steam rather than infer from package cache |
| Home preferences | active=true, dashboard.enabled=true, dashboard.ps5Home=true | Need report before manually opening Home |
| Current Home | Custom Home mounted at /game-hub/home; this alone is not a cold-start test | Manual Home works; automatic startup fails |
| Separate PS5 Dashboard | Not loaded | Tester reports other optional plugins disabled |

Read-only capability observation on the local running client: shared-context SteamClient.Overlay.RegisterForOverlayActivated is a function; the main window's corresponding method is undefined. The current createOverlayContext implementation resolves the shared context with optional guards. This supports investigating execution context and loaded build identity, but is not proof of the tester's historical error cause. Current code also keeps native menu recovery when overlay prerequisites fail.

## Root-cause distinctions for startup
1. Control Center Home opens /game-hub/home directly. That route renders the dashboard even when automatic /library/home replacement is disabled. Check Integrated Steam Home and all three saved flags first.
2. A verified backend defect returned {} after an existing settings file could not be read. The frontend accepted that as a successful settings load, interpreted active as false, and never ran its rejected-request recovery. Dev.104 rejects that read instead. Invalid non-object settings also reject. A subsequent successful read restores the actual saved choice. Missing-file migration remains inactive; explicitly disabled Home remains disabled.
3. If saved flags are true and runtime homeIntegration is enabled but native Home persists, investigate the startup route, installed route patch, mounted RouteGate and Decky global-component lifecycle. If homeIntegration remains loading, collect backend read/call errors. If conflict is reported, inspect loaded lifecycle registrations rather than assume disabled plugins are active.

No new fixed startup delay, forced redirect, native-menu hiding, controller remapping, Steam restart, or change to the working local installation was used for this investigation.

## Tester package and evidence to collect
Candidate: outputs/Game-Hub-0.13.0-dev.104-decky.zip (Decky runtime archive, not source ZIP).

Before changing settings, ask for a compatibility report and exact loaded Game Hub version. If Integrated Steam Home is Off, record that and turn it On intentionally; this is configuration evidence, not proof of a code defect.

Test sequence:
1. Record Steam build/channel, Decky Loader version/build, PlayHub distribution version, PlayHub plugin version, Game Hub version and launch method (desktop Steam, Big Picture, PlayHub launcher).
2. Enable automatic integrated Home, confirm save success, fully exit Steam and start it the same way as the failing run. Do not open Control Center or manually click Home first.
3. Record the first screen and export Game Base Social -> Control Center compatibility -> Export compatibility report. Dev.104 adds savedHomePreferences with status and only the three relevant boolean flags. Record current startup route if available and any Game Hub startup/settings error with its full stack and timestamp.
4. Repeat three cold Steam restarts. Require PS5 Home without the manual workaround, unchanged saved settings, and functional native Home/menu recovery. A hot plugin reload or one manual Home visit does not pass this test.
5. If overlay failures recur, collect the full exception stack, exact runtime/build, overlay-window presence, UI mounted/hook status, activationSubscribed, reason, lastAction and lastResult after one Guide request and after the manual current-window open test. Home success does not certify in-game behavior.

The existing report intentionally leaves Steam/Decky/distribution version fields unknown; supply those separately. Do not interpret the PlayHub plugin version as the PlayHub distribution version. Reports and screenshots can be returned by the user; nothing was sent to the tester by the assistant.

## Validation
- Existing-file read failure rejects instead of returning disabled defaults; file bytes remain unchanged; subsequent read returns enabled settings.
- Invalid settings reject; missing-file migration stays inactive; original standalone settings remain untouched.
- 9 frontend startup/readiness tests pass, including late saved settings and disabled Home.
- 3 diagnostic tests pass, including allowlisting, missing/invalid settings, and read-only flag export.
- Tester confirmation remains required; this is a candidate fix for a verified failure mode, not a confirmed diagnosis of the tester's unknown build.
