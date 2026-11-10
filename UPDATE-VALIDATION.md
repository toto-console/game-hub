# Release validation — 0.13.0-dev.46

Local TypeScript and production builds passed. The complete regression run identified missing optional media-query listeners and outdated Welcome heading test queries. These were corrected; focused Home and wallpaper regression checks then passed (8 tests). The Python updater suite passed all 12 tests.

The publishing workflow independently runs TypeScript, production build, the entire JavaScript test suite and the Python updater suite before creating the release. See the published tag's GitHub Actions run for the final full-suite result.

The release includes the local dev.39–45 feature/fix changes plus the release-check corrections. Local Windows plugin load checks do not establish live controller, sound-pack, video-codec or SteamOS/Bazzite compatibility. Automatic installs remain disabled. No saves or game processes were used for tests.
