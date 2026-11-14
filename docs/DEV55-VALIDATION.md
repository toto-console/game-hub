# dev55 achievements redesign validation

## Changes
New shared AchievementsPage, achievement-page-style, and achievement-page-data implement the reference composition: cover/title, progress/earned header, long rows, icon/name/state/rarity, unlock date and separated description. No PlayStation tiers are inferred. Rarity labels are Game Hub classifications based on Steam percentages (<1 ultra rare, <10 rare, <50 uncommon, otherwise common).

Welcome and Home game-detail achievement links now open /game-hub/achievements/:appid. Back uses the existing navigation history, retaining dev54 Welcome widget and scroll restoration. Switcher embeds the same page and preserves its activity origin. Detail Back retains list scroll. Sorting does not mutate provider rows and leaves unknown dates/rarities last.

Integrated Home now mounts native-header suppression globally while enabled, rather than removing it between page commits. This also hides the native header on native destinations while integrated Home is enabled. Disabling integrated Home, unloading Game Hub, or choosing explicit native Library recovery removes this suppression. Game Hub's own header is unaffected.

Changed files: src/AchievementsPage.tsx, src/achievement-page-style.ts, src/achievement-page-data.ts, src/achievements.ts, src/GameSwitcher.tsx, src/home/upstream/steam.ts, src/home/module.tsx, src/fullscreen.ts, tests/achievement-page.test.tsx, tests/fullscreen.test.ts, package.json, package-lock.json, RELEASE-NOTES.md.

## Checks
TypeScript and production build checked. Focused achievement data/sorting/detail navigation, Welcome return, Home navigation, Shell Back, Switcher navigation and scoped fullscreen CSS tests: 23 tests passed after correcting a test-only missing Decky mock.
Rendered the component using fictional test data in headless Edge at 1920x1080, 1280x800, 2560x1440 and 3840x2160. No horizontal document/card overflow at these sizes. Compared the 1080p render with the reference: wide separated rows and header composition preserved. This is a browser layout check, not Steam controller validation.

## Limitations and manual test
Steam has no native PlayStation trophy tiers. Missing global percentages and dates are omitted; hidden metadata remains concealed. Unsupported non-Steam games show a truthful unavailable state. No games launched or saves modified.
User should open Welcome Achievements, move Down/Up, sort, open a row with A, press B to restore that row and then B to return to the same Welcome widget. Repeat from a game hub and Switcher. Check no native header flashes and try the native recovery option. Xbox feel, SteamOS/Bazzite hardware and live transition rendering remain unverified.
