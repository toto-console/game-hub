# Game Hub dev.70 — Windows overlay compatibility hotfix (testing)

This is a testing build, not a claim of universal Windows or Linux compatibility.

## Diagnosis
The supplied 58-second recording shows Dispatch launching, the native in-game menu, a Game Base Social exception, Steam restarting, native Home, manual Game Hub Home navigation, and the same exception on another launch. The error names createOverlayContext and an undefined object read as Overlay.

The source compiles `EUIComposition.Overlay` into `DFL.EUIComposition.Overlay`. @decky/ui is provided externally by Decky at runtime: development typings from 4.12.1 do not guarantee that an older installed DFL exports this enum. The activation API access already used optional chaining, so it is not the unguarded property access in this stack. The working local runtime exposes the enum with Overlay=2 and RegisterForOverlayActivated as a function. The affected runtime's enum is absent, according to the exception. Its exact Steam/Decky/PlayHub versions remain unknown; do not attribute this to PlayHub or Steam Input without its diagnostic report.

## Changes
- src/overlay-compatibility.ts and src/index.tsx: bundle the SDK's numeric Overlay composition ABI (2), independent of Decky's exported enum object. Real window, route, activation and composition methods are still required. Failed context construction disposes partial state; unexpected initialization exceptions remain local.
- src/startup-ready.ts: contain binding exceptions without continuously retrying a broken initializer. Transient not-ready results still retry; fresh component mounting provides a new attempt.
- src/control-center-entry.ts and src/ControlCenter.tsx: guard overlay teardown when the window/bridge disappears; record render failures and retain native recovery. Guide is still handled through Steam's own MenuStore, with no global input hooks.
- src/home/module.tsx: register reactive Home/Library gates before asynchronous preferences; an already-mounted native Home updates when enabled preferences arrive. Dispose removes gates; native content remains for disabled/recovery/error states. Header suppression requires a mounted dashboard.
- src/center-diagnostics.ts, src/CenterCompatibility.tsx, py_modules/center_diagnostic.py: expose sanitized Home and overlay initialization states. Unknown environment fields remain Unknown.

The Home registration timing defect is independently reproduced by the delayed-preference regression. The tester's video does not establish that this is the only startup cause, or reveal their saved Home setting. No startup redirect, arbitrary activation delay, forced restart, or permanent native hiding was added.

## Verification
TypeScript, production build, focused automated regressions and package validation are required before packaging. Tests cover delayed settings in an already-mounted Home, a fresh plugin instance, disabled Home recovery, missing/late overlay APIs, Guide menu interception, closing/composition release, native bypass, repeated overlay mounting, initialization exceptions, and teardown errors. These are simulated integration tests, not physical controller tests.

## Tester installation and checks
Install the actual `Game-Hub-0.13.0-dev.70-decky.zip` using Decky developer settings → Install Plugin from ZIP/File (wording depends on Decky). Do not use GitHub Code → Download ZIP. Replace the existing Game Base Social plugin; keep its existing folder and settings. Reload the plugin normally or restart Steam once if the old bundle remains loaded.

1. Confirm dev.70 and Integrated Steam Home enabled. Restart Steam normally; verify Home restores.
2. Launch Dispatch through Steam. Press Guide: verify the custom center appears, the game remains running, and Back closes it once.
3. Exit normally, then launch again. Confirm no error screen or duplicate menu.
4. Check Game Hub → Settings → Control Center compatibility (also in its Decky quick panel). Refresh and export the sanitized report if it fails. Record Steam channel, Decky/PlayHub versions, controller and display mode separately where reports say Unknown.
5. If Guide routing is unsupported, use Steam's existing controller Quick Access/Decky shortcut, then Game Base Social → Open Control Center. If Decky is not present in that game's overlay, retain native Steam; there is no verified universal alternate Guide binding. Open Original Steam Menu remains available.

The local Windows user's physical controller verification and the Reddit tester's Windows 11 verification remain pending. SteamOS/Bazzite, fullscreen versus borderless, non-Steam overlay injection, and other controller/configuration combinations are unverified by this hotfix. No third-party plugin, game, save, Steam binary, or controller mapping was modified. No stable promotion is appropriate yet.
