# Steam CSS compatibility engineering report — in progress

Date: 2026-11-22. Feature development frozen. No deployment or release publication authorized.

## Baseline and preservation

- Branch: `steam-beta-css-compat`, based on `e79cc3caa777b35c6277c79dd6b10dc8c71ddf56` (main).
- Initial checkout clean. Previous quick-menu and completion-trophy work preserved in that commit.
- Latest published release: `v0.13.0-dev.67`, an experimental prerelease. **There is no published stable/non-prerelease release.** Steam Stable is a client channel, not a claim that Game Hub is production-certified.
- Local installed plugin: `0.13.0-dev.103.store.1`, with subsequently verified quick-menu and trophy assets. It was not replaced by this branch.
- Git bundle, installed plugin/configuration backups, public dev.67 runtime ZIP/checksum, release metadata, and baseline test logs are saved privately outside the repository. Settings/account data are excluded from this branch and its diagnostics.
- Local Steam bootstrap log identifies build `1794536281`, updater built November 12, 2026. No package/beta marker was present. Channel remains unconfirmed until checked in Steam's UI. This is not evidence of the November 18 Beta.

## Verified Valve changes

Primary source: https://steamcommunity.com/groups/SteamClientBeta/announcements/detail/712292033362921463

Valve's actual announcement was retrieved and its embedded event data inspected. It confirms a build-tool change affecting nearly all CSS class names. It also changes startup presentation/timing, achievement sorting/navigation/pinning, Store/Community load-failure UI, offline artwork/avatar handling, on-screen keyboard input, and controller detection. Linux fixes include launch handling for manually edited Steam symlinks, filters, and notification clipping.

The announcement does **not** supply replacement classes or establish an unchanged DOM/React/module shape. No Beta hashes, hierarchy or runtime behavior have been invented. Beta client files and tester diagnostics are still required.

## Architecture and actual integrations

- Decky frontend (`@decky/api` 1.1.3 and host `@decky/ui` 4.12.1): React routes/global components, route patches, native MenuStore interception, classMap exports and Steam/Decky focus controls.
- Python Decky backend: settings, platform checks, update staging, and StoreAppearance. StoreAppearance uses local CEF debugging to apply the scoped Store/Community theme, not Millennium or CSS Loader.
- Home/Library: integrated PS5 Dashboard-derived React components and shared Steam data/actions. Game Hub-owned CSS dominates these surfaces; it is not a reskin of native game tiles using frozen hashes.
- Full profile: native Steam Community document transformations and data parsing, with a separate CEF BrowserView sizing/visibility adapter. Web semantic selectors need their own verification; a Steam shell hash rename does not prove the website changed.
- Optional ThemeDeck adapter is version/platform guarded; media/plugin integrations remain optional. PlayHub can affect host/window and shortcut launch behavior, but is not bundled. CSS Loader/Millennium are not required or newly installed.
- Settings identities, schema, storage paths, dependencies and installation behavior remain unchanged.

## Selector audit

`selector-inventory.json` is the generated, reviewable inventory of DOM calls, embedded CSS candidates, CSS rules, module resolvers and observers across src, store-theme and integrations. It includes source locations, ownership, feature, risk, status and unknown Beta evidence. It is deliberately an inventory, not 2,000 independently verified compatibility claims; embedded CSS extraction includes candidates requiring review.

Highest-risk dependencies:

| Original dependency | Locations / feature | Local evidence | Beta replacement / structure | Risk | Repair / coverage |
| --- | --- | --- | --- | --- | --- |
| classMap DashboardBar, Header, Clock, CurrentUserAvatar | fullscreen.ts; Home, Control Center, achievements | Actual local module fixture captured | Unverified | HIGH | Central validated resolver; no hash constants; fullscreen + compatibility tests |
| MainBrowserContainer, BrowserContainer, URLBar | fullscreen-web.ts; profile CEF bounds and native chrome | Module exports captured; browser nodes absent on current route | Unverified | CRITICAL | Shared resolver, malformed/ambiguous rejection, unsupported adapter inert; browser tests |
| BasicFooter, FooterLegend | center-footer.ts; full-screen footer | Module and native nodes observed | Unverified | MEDIUM | Shared resolver; composed exports supported, scope preserved |
| BasicUI / GamepadMode / gpfocus / Focusable | theme/navigation/focus | Existing contracts; not exhaustively rechecked | Unverified | HIGH | Retained; no guessed replacements; tester required |
| responsive_page_template_content / profile_page / profile_header_content | store-theme/profile.js | Prior installed-profile checks only | Website structure unverified on Beta | HIGH | Retained; existing profile fixtures; real Beta required |
| friend_block_v2 / group_block / review_box / valve-ssr-data | profile-tabs.js | Existing parsers/fixtures | Unverified | MEDIUM | No speculative edits |
| MenuStore, window classification, composition and Overlay exports | control-center-entry / overlay-compatibility / index | Existing guards/tests | API behavior unverified | CRITICAL | Preserved native fallback; explicit separate tester matrix |
| native context menu discovery by function source | home/upstream/steam.ts | Existing code heuristic | Unverified | HIGH | Retain native game-details fallback; tester required |

## Changes in this branch

- `src/steam-ui-compat.ts`: centralizes the three existing module contracts. Uses runtime exports, supports composed classes, rejects malformed values and conflicting module matches. Concrete digit-leading class tokens use a quoted class-token selector. No channel detection guessed from CSS hashes.
- `src/fullscreen.ts`, `src/center-footer.ts`, `src/fullscreen-web.ts`: use that resolver. Scope and visual design preserved.
- `fullscreen-web.ts`: an unsupported adapter's direct begin/refresh now performs no route ownership change or watchdog polling. Regression reproduced on baseline (one timer instead of zero) and passed with the fix. Not claimed as the cause of every historical loading issue.
- Added real local class-map fixture, synthetic renamed-export tests (explicitly not a real Beta fixture), malformed/missing/duplicate tests and unsupported-browser regression.
- Read-only sanitized diagnostic collector and reproducible selector inventory generator. Neither installs or patches Steam.

## Game launch / exit investigation

`playGame` invokes Steam RunGame; `launchShortcutFromLibrary` deliberately navigates to `/library/app/<id>` for Steam's shortcut prelaunch workflow. Neither has an explicit owned launch-return session restoring the originating Game Hub route after a confirmed running-to-stopped transition. This is a plausible contributor to the reported return-to-Play-page behavior, independent of CSS. It is **not yet reproduced on the tester**.

Do not redirect every native details page to Home. Before implementing return ownership, capture normal launch/exit, failed launch, crash, intentional navigation, overlay/Alt-Tab and repeated launches. The fix must distinguish an owned launch from deliberate details navigation and clear ownership on cancellation. No unverified launch hooks or forced-navigation timers were added.

## Automated baseline

- 67 frontend suites / 382 tests passed.
- 41 Python tests passed.
- Existing lint: **385 errors**, 0 warnings (mostly explicit-any and unused-vars). This is a baseline failure, not hidden or suppressed. No unrelated mass refactor undertaken.
- TypeScript and candidate build results recorded separately in VALIDATION.json.
- New resolver/test files pass targeted lint.

## Real-client acceptance matrix (candidate branch)

| Feature | Steam Stable | Steam Beta |
| --- | --- | --- |
| Home screen | UNTESTED | UNTESTED |
| Game library | UNTESTED | UNTESTED |
| Game cards | UNTESTED | UNTESTED |
| Game details | UNTESTED | UNTESTED |
| Game launching | UNTESTED | UNTESTED |
| Return after game exit | UNTESTED | UNTESTED |
| Controller navigation | UNTESTED | UNTESTED |
| Control Center | UNTESTED | UNTESTED |
| Themes | UNTESTED | UNTESTED |
| Settings | UNTESTED | UNTESTED |
| Overlays | UNTESTED | UNTESTED |
| Native Steam recovery | UNTESTED | UNTESTED |

Prior user acceptance applies to the installed build, not this undeployed branch. The live local class-map capture is read-only capability evidence, not a PASS for all those flows.

## Release readiness and blockers

**Steam Stable: NOT READY** for a new compatibility release; installed/published baseline preserved.

**Steam Beta: NOT READY.** Separate tester selected by the user; actual Beta class map, host versions, DOM roles and full controller/game acceptance missing. Do not manufacture a verified Beta adapter or downloadable placeholder.

**Two-download release: NOT READY.** Draft notes prepared; no Stable/Beta installers published or deployed. Required names after acceptance: `GameHub-Steam-Stable.zip` and `GameHub-Steam-Beta.zip` for the Windows test matrix. OS target remains an independent constraint: Linux must retain separate explicit experimental packaging, not be silently folded into a Windows ZIP. Generic names cannot bypass the existing platform gate.

Automatic updates remain disabled. Baseline lint and launch-return behavior are unresolved release blockers. Existing platform packages were built before this task; they are not Beta-certified packages and must not be relabeled as such.

## Future Stable transition

Require the exact production build, fresh class-map/DOM evidence, both regression suites, visual/controller and game lifecycle acceptance, settings round-trip and native recovery. Do not promote based on a date/channel string alone. Keep legacy rollback archives and settings backups. Resume feature development only after compatibility verification and user approval.
