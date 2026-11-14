# Targeted validation — dev.54

Evidence: inspected both tester screenshots and sampled the full 9.6-second recording at four frames per second. The supplied manifest identifies dev.53. Video confirms transient game-row visibility on two achievement returns; it does not establish every native route or controller path.

Code causes: expanded initialized from game detail only (not Welcome return), passive widget restoration competed with Shell top-row focus, and return position only stored a widget ID. Switcher bypassed shared custom-artwork candidates and lacked image error handling.

Changed: src/home/WelcomeHub.tsx, src/home/welcome-layout.ts, src/home/upstream/Ps5Home.tsx, src/home/upstream/Shell.tsx, src/home/home-hub-style.ts; src/library-art.ts, src/game-adapter.ts, src/GameSwitcher.tsx, new src/SwitcherArtwork.tsx. Tests: home-hub-navigation, welcome-return, switcher-artwork; existing Shell, Switcher, Library identity and shortcut launch checks.

Known limits: private Steam APIs and custom artwork availability vary by client. No direct filesystem scan or guessed shortcut asset filenames. Tests preserve Windows/Linux-style URL paths, spaces and case but are Windows-hosted mocks, not Linux hardware tests. Actual tester artwork, physical controller routing, compositor flashes and native-screen history must be retested on the handheld. ThemeDeck/platform limits from dev.53 remain.

Results: 28 distinct focused tests passed across the navigation, identity, artwork and launch suites (including the final header ownership check). TypeScript and production builds passed. Package validation and installed-file/settings comparisons are performed before delivery.
