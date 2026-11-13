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
