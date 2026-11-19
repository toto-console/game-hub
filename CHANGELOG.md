## 0.13.0-dev.105

- Split Windows x64 and experimental SteamOS/Bazzite x64 downloads from the shared source tree, preserving plugin identity and settings.
- Bind each runtime archive to its platform; keep automatic installs disabled until exact updater/loader compatibility is certified.
- Restore browser visibility after completed or interrupted profile navigation so Store pages do not remain black.
- Add platform archive checks and Windows/Linux CI builds; Linux hardware support still awaits testers.

## 0.13.0-dev.87 — PS5-style profile overview cards

- Four tall silver-black translucent cards: Achievements, Profile Awards, Games, and Friends.
- Compact artwork and avatars, bottom-aligned captions, subtle edges, and full-card silver focus.
- Real Steam data; Groups and Inventory remain accessible through tabs and below the overview.
- Preserve dev.86 controller navigation. Windows live preview and simulated focus checked; SteamOS not hardware tested.

## 0.13.0-dev.86 — controller verification candidate

- Whole-card focus targets for overview and game grids; deterministic neighboring rows and columns.
- One silver translucent focus surface with separate tab styling; remove duplicate floating reflections.
- Back returns from content to its tab before leaving the section. Inventory card opens the in-profile tab.
- User confirmed all requested full-profile checks passed on their physical controller on Windows.

## 0.13.0-dev.85

- Register profile controls with Steam native controller focus; prevent trophy rows from falling back to toolbar focus.
- Open Steam keyboard on search activation, allow navigation past inactive search fields, and restore control on cancel.
- Compare viewed player with signed-in player directly, with counts and percentages; remove friend picker.
- Stabilize trophy scrolling and avoid rebuilding the active tab.

## 0.13.0-dev.84

- Move real Steam badges below the player name and status beside the name and level.
- Fit four narrow silver-black overview cards (Games, Friends, Groups, Inventory) above the fold.
- Keep About and native profile sections below the initial viewport, with the navigation fixed during scrolling.

## 0.13.0-dev.83 — Level beside the profile name

Place the native Steam level number beside the name in a subtle circular badge. Hide its text label and remove the duplicate overview level card. Preserve the native badge link and restoration on disable.

## 0.13.0-dev.82 — Profile actions in navigation

Move native Message and More actions into the profile tab bar, with More following Reviews. Preserve Steam action handlers and independent section-tab routing.

## 0.13.0-dev.81 — Console profile composition

Recreate the supplied PS5 overview composition with compact identity, fine outlined tabs and four tall Level, Badges, Games and Friends cards using real Steam data. Keep Level transparent, equipped backgrounds bright and full-viewport, and Steam biography, activity, comments and other sections accessible below. Preserve search keyboard and comparison fixes.

## 0.13.0-dev.80 — Profile search and comparison focus

Open Steam’s existing keyboard for profile search and isolate controller navigation during text entry. Focus and reveal the friend comparison picker. Escape/B closes search; Enter finishes entry.

## 0.13.0-dev.79 — Friends header

Remove the manual Refresh button from the Friends panel. Preserve automatic friend updates.

## 0.13.0-dev.78 — Silver Friends panel

Lighten the Game Hub Friends list background with transparent silver glass and a soft glow. Preserve selection and controller focus visibility.

## 0.13.0-dev.77 — Profile tab typography

Lighter console-inspired tab text and softer shadows. Reserve space for navigation tools and prevent settings icon clipping.

## 0.13.0-dev.76 — Friends grid and silver profile sections

Four-column friend tiles with circular avatars and presence indicators, ordered online first. Remove the lower blue profile container and apply transparent silver styling to awards, activity and comments.

## 0.13.0-dev.75 — Transparent silver profile cards

Use much lighter silver glass for overview statistics, recent games and the achievement summary, with readable text shadows and visible focus outlines.

## 0.13.0-dev.74 — Floating profile tabs

Remove the profile navigation background and backdrop blur. Keep readable text and icons with subtle shadows, existing focus indicators, and stationary navigation.

## 0.13.0-dev.73 — Stationary profile navigation

Keep the profile identity and tabs in place across all sections. Scroll only the content beneath the tabs, including controller-focused items. Restore the original document on disable.

## 0.13.0-dev.72 — Full-screen profiles and trophy library

Full-viewport equipped backgrounds with brighter artwork, circular profile portraits, and a PS5-inspired trophy game list. Keep real Steam earned totals, global percentages and friend comparison. Preserve viewport/navigation and Windows overlay fixes. Physical controller and SteamOS testing remain pending.

## 0.13.0-dev.71 — Profile viewport and navigation

Fill the owned full-profile browser viewport, cover initial native layout until the Game Hub presentation is ready, and distinguish the active tab from controller focus. Keep a bounded native recovery path on load errors. Preserve dev.70 overlay hotfix.

## 0.13.0-dev.70 — Windows overlay hotfix (testing)

Fix missing Decky composition-enum crash, reactive Home startup, and safe overlay teardown. Preserve native recovery. Physical Windows tester verification pending; see docs/windows-overlay-hotfix-dev70.md.

# Game Hub 0.13.0-dev.69 — connected profile tabs

- Games, recent/followed games, Friends, Groups and Reviews now share the overview background, navy glass styling and top navigation instead of opening unrelated native layouts.
- LB/RB changes top tabs; Steam's existing D-pad/stick direction events move focus. A activates controls. B returns from game details to the game picker, then Overview. Native dialogs and text entry retain their controls.
- Achievements has a game picker, real player progress, unlock dates and global percentages. It reuses Game Hub's trophy-row and animated rare-diamond styling. Locked achievements never receive the diamond; locked hidden details remain concealed.
- Keep the themed profile alive while its browser is hidden. Treat hash tabs as the same verified document. A bounded early profile-loading guard prevents old-profile paint on later document loads in the owned browser; recognized profile transitions retain header suppression.
- Account editing, trading and inventory item actions remain native Steam. Inventory offers an explicit native action. Unavailable/private data has Retry and Open in Steam recovery.
- No third-party plugin changes. GitHub is unchanged. Rollback archives were created before editing.

Validation: focused frontend/navigation tests, backend tests, TypeScript and production build. Live Windows rendering checked against actual Steam profile data. Physical Xbox controller and SteamOS/Bazzite testing remain unverified.

# Game Hub 0.13.0-dev.68 — console-style Steam profile overview

- Rebuild the Steam profile overview around the requested console layout: top navigation, large identity block, glass Level/Badges/Friends/Groups/Inventory cards, horizontal recent games and an achievement strip.
- Keep the viewed player's equipped Steam background, avatar/frame and real profile details. The reference's example games, country, language and statistics are not fabricated. The small gold accent is decorative, not a subscription status.
- Read actual next-level XP from the same profile's Steam Badges page once per view. Fall back to the Badges link if that information cannot load. Badge XP is never misrepresented as progress to the next level.
- Retain native Steam nodes, links, Message/More actions, comments and showcases. Additional native content remains below the new overview. Achievements shows a real recent game's progress and labels which game it belongs to; when the selected game has none, another available recent game's progress is shown.
- Use Steam's existing direction/A event stream for spatial focus; B and Guide remain with Steam. Dialogs and text editing retain native input handling.
- Add a console-style profiles toggle in Game Hub Settings and Control Center Settings > Appearance. The profile gear offers original Steam presentation for the current visit.
- Keep account edits, inventory, purchases and other unsupported profile subpages native. Private/unrecognized layouts safely retain the native page.

Validation: 65 focused profile, Store, activity-navigation and browser tests; six backend boundary/cleanup tests. Live Windows profile rendering inspected. Physical Xbox controller and SteamOS/Bazzite device testing remain unverified. TypeScript and production build checks passed.

No third-party plugin changes. No background, avatar, message or profile account changes. GitHub has not been updated with this local build.

---

# Game Hub 0.13.0-dev.67 — Store handoff and overlay recovery

## Install
Download **Game-Hub-0.13.0-dev.67-decky.zip** (or **Game-Base-Social.zip**, identical plugin bytes). Install through Decky's ZIP installer. Do not install GitHub's automatic Source code ZIP.

## Changes since dev.60
- Game News dismisses the full-screen Control Center modal before opening its Steam Store listing, preserving the Back return. Missing Store navigation no longer silently closes the card.
- In-game Control Center waits for Steam to classify a new overlay window and recovers when its activation bridge becomes available late. Native Steam recovery remains available.
- Settings > Control Center and the Decky quick panel offer compatibility checks and sanitized report export. Reports contain no friend/account IDs, messages, cookies or tokens.
- Friend cards load public Steam bios for the selected friend, refresh while visible, preserve existing text during temporary failures, and stop automatic retries after three failures. Private/friends-only bios cannot be retrieved through the public lookup.
- Brighter mini-profile backgrounds. Existing designs, controller bindings, games, saves and third-party plugins are unchanged.

## Updates
Decky Direct Updater: **All > Game Base Social > Install another version > dev.67**. The canonical **Game-Base-Social.zip** asset remains supported. Experimental versions may not appear in stable-only checks.

Optional **Game-Hub-and-Direct-Updater-install-pack.zip** includes Game Hub and unmodified Direct Updater 0.2.6, its license and corresponding source. Extract it and install the two inner plugin ZIPs separately; the outer ZIP is not directly installable. No silent third-party installation.

## Validation and limits
Local TypeScript and production builds passed. Focused checks: 39 news/browser/Back tests, 28 overlay/startup/return tests, two report-sanitization tests, and the previously validated bio tests. These suites overlap; the counts are not additive. Installed dev.67 loaded locally.

The reported Windows tester's exact failure remains unconfirmed. A compatible in-game Steam/Decky overlay is required; no universal Guide interception is claimed. SteamOS/Bazzite remain experimental without handheld validation. If the native sidebar persists, export the Control Center compatibility report while the overlay is open and include your Steam, Decky, PlayHub, controller and launch details.

Only the current version tag is retained. Previous public releases are retired after the new download is verified, with rollback metadata backed up first.

---

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
