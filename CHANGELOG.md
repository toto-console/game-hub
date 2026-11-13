# Game Hub 0.13.0-dev.53 — Home and Library navigation fix

- Library Back now navigates directly to registered Game Hub Home, avoiding the intermediate native Home route.
- Home consumes controller Back inside Steam's focus-navigation tree as well as the DOM fallback.
- Control Center Home actions use the same destination.
- Normal Quick Access requests open Control Center in supported contexts. Explicit Decky, Friends, recovery and unsupported contexts remain accessible.
- Added regression tests for repeated Home Back, embedded Library Back and standalone Library-to-Home transitions.

Install **Game-Hub-0.13.0-dev.53-decky.zip** using Decky's ZIP installer. Do not use Code > Download ZIP or the automatic Source code archives.

Validation: local TypeScript and production build; 285 existing frontend tests plus 3 new shell tests; 17 Python tests. These are automated Windows-hosted checks with mocked Steam interfaces, not SteamOS device testing. See UPDATE-VALIDATION.md.

SteamOS/Bazzite remain experimental. Please test Library > B > B repeatedly, reopening Switcher, Guide and Quick Access, and restart persistence. Include OS, Steam and Decky versions in bug reports.

Windows parity is incomplete: the ThemeDeck bridge is Windows-only; Linux battery data, overlay behavior, audio, codecs, voice and performance are not certified. Steam system settings, security flows and recovery remain available. Steamcord redesign is not included.

---

# Game Hub 0.13.0-dev.52 — experimental preview

- Fixed reopening Game Library from Switcher and made its Back button reachable with Down.
- Corrected Library-to-Home history and stale Switcher restoration when returning from other Control Center screens.
- Retained custom wallpaper settings across Home remounts to prevent the game-artwork flash.
- Added Portuguese, Japanese, Spanish, French and German language choices, plus automatic system language. Some advanced labels remain English.
- Improved notification names, message previews, avatars and achievement artwork using available Steam data.

Download **Game-Hub-0.13.0-dev.52-decky.zip** below and install it with Decky's ZIP installer. Do not use GitHub's Code → Download ZIP or automatic Source code archives as the plugin installer.

Windows build tested with automated checks. SteamOS and Bazzite remain experimental and have not been verified on physical Linux hardware. Please report your OS, Steam version, Decky version and exact reproduction steps for any issues. Live controller testing remains necessary.

---

## 0.13.0-dev.49

Add saved English, Portuguese (Brazil), Japanese and system-language choices in Game Hub settings. Localize core navigation, settings, Welcome headings, social menus and the existing Home translations without changing Steam, game or message languages. Untranslated advanced text falls back to English.

Consume unhandled Back at the Home root after child screens close, preventing a second Back from falling through to native Steam history. Rename the Switcher library button to Game Library to match its destination. Native recovery remains explicit.

## 0.13.0-dev.48

Notifications now use Steam achievement names, descriptions and achievement icons, cached sender personas including Steamcord CDN avatars, and existing tray message previews. Conversation deduplication preserves preview and artwork. Row layout isolates Steam button wrappers to preserve image/text spacing. Previews stay in memory and are not logged or saved. Existing actions, unread handling and controller navigation remain intact.

## 0.13.0-dev.47

Named source ZIP now includes the compiled frontend and passes the same package integrity checks as the runtime ZIP, preventing an unbuilt named source package from causing a missing-module failure. GitHub automatic source archives remain development-only.

Experimental Linux preparation: home-filesystem storage reporting, capability-based Store/Activity styling, and Windows/Ubuntu backend regression jobs. Device testing remains outstanding.

# Changelog

## 0.13.0-dev.38 — experimental public pre-release

- Add GitHub release checks, stable/beta channels, platform/Decky matching, changelog and verified staging.
- Preserve per-version plugin/configuration rollback backups outside the plugin directory.
- Disable installation from the updater pending end-to-end recovery validation; use Decky's manual ZIP flow.
- Reject checksum mismatches, redirects outside GitHub hosts, path traversal, Windows reserved paths, duplicate/case-colliding archive entries and privileged package manifests.
- Retain Home, Welcome, Library, Control Center and social/media integration code.
- Carry forward dev.37's ambient-music Library correction and native navigation sound requests for Audio Loader. Audible controller acceptance remains unverified.
- Publish build inputs, dependency notices, package checks and intentional-release GitHub Actions.
