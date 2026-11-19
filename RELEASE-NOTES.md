# Game Hub dev.105 — separate platform downloads

- **Windows:** `Game-Hub-0.13.0-dev.105-Windows-x64.zip`
- **SteamOS / Bazzite:** `Game-Hub-0.13.0-dev.105-SteamOS-Bazzite-x64-EXPERIMENTAL.zip`

Choose only the download matching your OS. Linux is experimental and awaits tester confirmation, not fully supported. One shared source tree; plugin identity and settings paths are unchanged. No bundled replacement Decky Loader or PlayHub.

Wrong-platform packages refuse Game Hub activation. Decky's manual installer can still copy the wrong ZIP: reinstall the matching package without deleting settings. Native Steam recovery remains available.

Automatic installation stays disabled. The inspected Decky Direct Updater lacks OS selection; do not enable its automatic installation for Game Hub or rename these packages. Game Hub verifies the host and archive target before staging certified schema-3 updates; no loader/platform combinations are certified yet.

Includes the accumulated profile/controller fixes and dev.104 saved-Home read-failure recovery. The tester's restart issue still requires cold-start confirmation; no arbitrary startup delay was added.

Both packages are validated independently in Windows/Linux CI. Linux CI does not certify SteamOS or Bazzite integration. Please report exact Steam, Decky, PlayHub/host and Game Hub versions alongside startup and in-game results.

Store hotfix: preserve ownership of hidden CEF views across Back and restore show requests suppressed during profile-to-Store transitions. Verified live on Windows with completed and interrupted profile loads; 74 focused regression tests pass.
