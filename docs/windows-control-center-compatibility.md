# Windows in-game Control Center compatibility — dev.66

## Findings and scope

The tester's exact cause is not yet confirmed: their Steam/Decky/PlayHub versions, overlay capabilities and game launch path have not been supplied. An enabled Home Control Center is not evidence that Decky mounted Game Hub in the separate game overlay.

Two reproducible initialization gaps were fixed:

1. GlobalCenter stopped its startup binding after finding a window even if Steam had not classified it as an overlay yet. The existing cancellable startup dependency retry now continues until the window is classified. Once bound it stops, avoiding duplicate patches. VR still remains native.
2. The activation adapter was captured only once. If Steam's activation bridge was absent at context creation, it stayed unavailable; a subscription failure could also escape mount. The adapter now resolves the current bridge when mounting or handling an explicit open/menu request, catches temporary failures and retries on the next request. Native Steam remains authoritative until composition, route, app context and activation subscription are available.

The Guide path remains Steam/controller -> this window's MenuStore OpenSideMenu -> Game Hub's mounted Control Center. It is not a raw Guide listener. The plugin cannot identify which physical button caused a menu request, take input away from Game Bar, or inject Decky into an absent overlay. No controller mapping, PlayHub source, game process, saves, Steam binaries or privileged input hooks were changed.

The QAM's manual Open Control Center action no longer accidentally selects the desktop center for an unmounted overlay window. The custom dock and game/achievement area are unchanged. The existing narrowly scoped Roblox desktop fallback is unchanged.

## PlayHub research

[PlayHub 2.6.0 official release](https://github.com/LoZazaMastro/Playhub/releases/tag/v2.6.0), dated November 13, 2026, describes improvements to overlay/QAM behavior for non-Steam games and Big Picture handoff/recovery. The [author's announcement](https://www.reddit.com/r/deckyloader/comments/1xvafu7/playhub_260_is_now_available/) describes the same scope. These can affect whether a usable Steam overlay exists, but neither proves a particular Game Hub hook is mounted. Updating PlayHub is not treated as a guaranteed fix.

Game Hub does not version-gate PlayHub or call its private input handlers. Compatibility is determined from the current Steam window's actual capabilities. Locally, the Playhub Decky plugin package reports 2.1.0; this is not proof of the installed PlayHub distribution version. Reports deliberately distinguish those fields. No PlayHub files were modified.

## Tester steps

1. Install the dev.66 **Decky runtime ZIP** using Decky's Install Plugin from ZIP. GitHub's Code / Download ZIP is source, not the installable plugin.
2. Keep Game Hub and Control Center enabled. Launch the same affected game by the same method; try Home/Guide once.
3. If Steam's sidebar appears, open Decky in that in-game overlay -> Game Base Social -> Open Control Center. This is the manual fallback, only when Game Hub is mounted in that window.
4. Open Game Hub Control Center -> Settings -> Control Center, or Decky -> Game Base Social -> Control Center compatibility. Refresh compatibility, run Test current-window open action and Export compatibility report. Export saves a new JSON in the user's Downloads directory, never overwriting existing files. Send the report after the failure while the game overlay remains available.
5. Include Steam version, Decky version, PlayHub distribution version, controller model, Steam Input enabled/disabled, Steam game vs non-Steam shortcut, how it was launched, and fullscreen/borderless/windowed mode. These are marked unknown rather than guessed where not exposed.

Available means an attached, mounted in-game context currently passes capability checks. It is not a certification of physical controller behavior. Unknown with no in-game context observed is expected on Home before an overlay mounts. If Decky itself is missing inside that game's overlay, the plugin cannot safely offer a replacement there. Use the original Steam menu and supply the versions/setup details; do not disable the recovery menu or change Windows security settings.

Reports contain only allowlisted status/enums and version/platform information. They exclude app IDs, Steam IDs, names, paths inside report contents, messages, cookies and tokens. No automatic uploads or persistent input logging. The UI displays the local export path solely to help locate the file.

## Validation and limitations

- TypeScript noEmit check passed.
- 28 focused frontend tests passed across overlay entry, startup readiness, desktop fallback and center return. Added coverage includes late classification, late/throwing activation subscription, absent integration, clean remount, native recovery and launcher/controller-independent native request handling.
- 2 backend report tests passed (allowlist redaction and useful failure reasons).
- A subsequent native request models controller reconnection; this does not simulate hardware or certify any controller model.
- No live games launched, stopped or suspended. SteamOS/Bazzite and tester Windows behavior require device verification. Existing platform-independent guards and native escape remain.

Changed source: src/startup-ready.ts, src/index.tsx, src/control-center-entry.ts, src/center-diagnostics.ts, src/CenterCompatibility.tsx, src/CenterSettings.tsx, src/ControlCenter.tsx, main.py, py_modules/center_diagnostic.py; focused tests and version metadata. No appearance stylesheet changes.
