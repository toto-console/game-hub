# Direct Updater compatibility — dev.60

Reviewed nukeador/deckyup 0.2.6 at 5856b8177c254cb7625f978d3214ba186ba88e7b.
Sources: https://github.com/nukeador/deckyup and https://deckyup.nukeador.com/en/

Internal name Game Base Social, folder game-base-social and package game-base-decky are preserved. Both manifests now identify toto-console/game-hub. Game-Base-Social.zip is byte-identical to the versioned runtime ZIP. Only this asset matches Direct Updater's name filter; source archives and the historical Game-Hub filename do not. A versionless basename also avoids treating the packaging suffix as part of a prerelease version.

## Install and update
Install Direct Updater through Decky developer settings using https://deckyup.nukeador.com/install.zip and review the confirmation. First install Game Hub from Game-Base-Social.zip on our GitHub release. Do not use GitHub Code → Download ZIP.
Open Direct Updater → All → Game Base Social; confirm toto-console/game-hub if required. Choose Install another version and select dev.60 or a future compatible experimental release. Decky asks for installation confirmation; downgrades require additional confirmation. Stable auto-checks deliberately exclude these builds. Searching Game Hub can discover the repository, but upstream search installation requires a stable compatible release. No stable release has been fabricated to bypass this restriction. Older published releases without the new asset are not compatible with this selector; use their manual ZIP fallback.

## Preservation and recovery
Back up the version and settings using Game Hub's existing update page before updating. Settings stay outside the plugin ZIP; the archive contains no saves, Steam Cloud, userdata, optional-plugin settings, or installation hooks. Game Hub makes no new installer calls, downloads or polling loops for this integration. Decky retains control of installation, cancellation and errors. Recover using Decky's manual ZIP installation and the settings backup. Do not run two installers concurrently. Store submission is separate; no approval is claimed.

There is no supported public API in the reviewed Decky API for opening a specific third-party panel. The button opens the existing Decky manager, where the user selects Direct Updater. It does not call internal installer APIs or modify Direct Updater.

## Validation scope
TypeScript, production bundle, package hashes, existing updater unit tests and a separate check using the actual upstream metadata parser, release selector, version comparison and ZIP validator. No SteamOS/Bazzite hardware, VM, controller installation or third-party updater installation is claimed. Windows local installation verifies payload bytes and unchanged settings. Linux path/identity compatibility is static validation, not handheld runtime certification.
