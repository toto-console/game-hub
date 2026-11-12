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
