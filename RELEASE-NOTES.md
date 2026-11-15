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
