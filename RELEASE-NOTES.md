# Game Hub 0.13.0-dev.46

Experimental Windows-first update from dev.38. Download **Game-Hub-0.13.0-dev.46-decky.zip** and verify it against SHA256SUMS.txt.

## Changes

- Native Audio Loader-compatible navigation, selection and Back sounds across Library, Welcome and custom Back handlers. No sound packs are bundled.
- Control Center keeps Party, Friends, Game News and Messages visible while browsing dock icons. The current-game and achievements tab is preserved; selecting dock icons still opens their controls.
- Notifications display supported friend avatars and game artwork, clearer descriptions, dates and unread indicators. Recognizes Steam's current FriendMessage sender/icon fields and game IDs in grouped alerts. Private message bodies are not collected.
- Welcome accepts GIF, animated WebP/APNG and compatible MP4/WebM/Ogg wallpapers up to 5 MB. Videos loop muted, with an animation toggle, reduced-motion handling and inactive-screen cleanup. Both Welcome-only and entire-Home placement are retained. Video codec support depends on Steam's browser.
- Native Steam header is hidden while integrated Home/Library is mounted, including the return from Library.
- Welcome shows its icon and name at the top left when navigating into widgets, matching the game-page heading transition.

## Installation and compatibility

Use Decky's Install Plugin from ZIP while idle after backing up the plugin and settings. Settings are preserved by the package. Automatic installation remains disabled; no exact Decky/platform pairing has been certified for automated updates. Select the beta update channel to discover this pre-release.

Local build/load checks use Windows 11 x64 and an unidentified Decky development build. Windows 10, SteamOS and Bazzite remain untested. CI building on Linux does not establish SteamOS compatibility. Steam internal API changes may affect integrations. Optional plugins are not installed or modified.

TypeScript, production builds and automated regression checks are required before publication. Live Xbox navigation, audio-pack playback, long-running animated wallpaper performance, gameplay and voice-call acceptance remain manual checks. No game processes, saves, personal artwork, credentials or sound packs are included.
