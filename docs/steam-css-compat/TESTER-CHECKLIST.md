# Separate Steam Beta tester — evidence required

Do not change the owner's working Steam installation. Do not install an archive labeled as supported until acceptance is complete.

1. Record OS/architecture, Steam version/build date and Client Beta Participation, Decky Loader version, PlayHub distribution version (not just plugin version), Game Hub version and enabled integrations.
2. On a separate test machine with its existing local Steam CEF debug endpoint, use Node 22+: `node scripts/capture-steam-ui.mjs beta-home.json`. Collector reads only local port 8080. No Steam changes/settings writes. If debugging is unavailable, report that; do not apply launch flags to production.
3. Repeat capture on native Home, native Library, an open Store page, profile, and with the in-game overlay active. Main-context capture does not prove in-game window behavior; export Game Hub's Control Center compatibility report from the actual in-game overlay too.
4. Provide a short recording of navigation and screenshots of those surfaces. Include the full error stack if initialization fails; remove account identifiers/private messages before sharing.
5. Test D-pad and both sticks, activate/back, LB/RB, search keyboard and comments, full-profile tabs, direct DM and return, Library install dialog, Store and Back, downloads, settings and saved Home after a cold Steam restart.
6. Launch a small known game from Game Hub, exit normally, repeat with a second game. Record starting route, whether RunGame reached a running process, final screen and focused control. Also test failed launch/crash, Alt-Tab, overlay opening/closing, deliberate navigation to Steam game details, and controller disconnect/reconnect. Do not terminate games with unsaved progress just to test.
7. Verify native Steam recovery and disable/re-enable Game Hub; ensure settings remain. Later, on an approved candidate, test Stable -> Beta -> Stable using backups without resetting settings.
8. Every result needs PASS / FAIL / PARTIAL / UNTESTED, exact build and sequence. CI or synthetic renamed-class tests do not count as real Beta acceptance.

Send the diagnostic files and results to the project owner. This checklist does not send messages or upload data automatically.
