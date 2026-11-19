# Game Hub 0.13.0-dev.69 — connected profile tabs

- Games, recent/followed games, Friends, Groups and Reviews now share the overview background, navy glass styling and top navigation instead of opening unrelated native layouts.
- LB/RB changes top tabs; Steam's existing D-pad/stick direction events move focus. A activates controls. B returns from game details to the game picker, then Overview. Native dialogs and text entry retain their controls.
- Achievements has a game picker, real player progress, unlock dates and global percentages. It reuses Game Hub's trophy-row and animated rare-diamond styling. Locked achievements never receive the diamond; locked hidden details remain concealed.
- Keep the themed profile alive while its browser is hidden. Treat hash tabs as the same verified document. A bounded early profile-loading guard prevents old-profile paint on later document loads in the owned browser; recognized profile transitions retain header suppression.
- Account editing, trading and inventory item actions remain native Steam. Inventory offers an explicit native action. Unavailable/private data has Retry and Open in Steam recovery.
- No third-party plugin changes. GitHub is unchanged. Rollback archives were created before editing.

Validation: focused frontend/navigation tests, backend tests, TypeScript and production build. Live Windows rendering checked against actual Steam profile data. Physical Xbox controller and SteamOS/Bazzite testing remain unverified.
