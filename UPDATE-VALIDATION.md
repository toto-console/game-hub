# Update and release validation

This pre-release uses manual installation only. The updater never executes scripts, extracts update archives, replaces a plugin or restarts Steam. Download staging and backups are performed off the backend event loop and serialized by a lock.

Automated coverage: semver/prerelease ordering, stable/beta filtering, no downgrade, exact platform/loader matching, offline/throttled checks, HTTPS redirect restrictions, SHA-256 failures, incomplete downloads, archive identity/privileges/path checks, settings preservation and per-version backup retention. Existing UI regressions are checked by the Vitest suite. TypeScript and production packaging are mandatory CI gates.

Local environment: Windows 11 Home 64-bit, build 26200, Node/Python build tools. Loading the plugin is not proof of live Xbox, gameplay or all third-party behavior. SteamOS/Bazzite are untested; Windows 10 is untested. First-install, interrupted native Decky installation, settings restore, and post-reboot update acceptance remain manual tests. Decky's native installation is not guaranteed atomic, so no unattended updater is offered.

Before promoting a platform: install through its actual Decky version, upgrade from an old release while idle, confirm preferences, disconnect network during staging, test recovery from the external backup, restart Steam and the PC, and run the user's controller/navigation/integration checklist. Only then record that exact environment in compatibility metadata. Do not infer Linux support from CI on Linux.

Official Decky distribution requires a reviewed plugin database submission: https://github.com/SteamDeckHomebrew/decky-plugin-database . This release has not been submitted or approved there.

Local checks: 248 Vitest tests in 44 files passed; 12 updater Python tests passed; TypeScript passed. The installed Windows Decky loader reports only `dev`, so the compatibility target allowlist is intentionally empty. The release is available for manual installation and testing; no deployment is silently certified by these unit tests.
