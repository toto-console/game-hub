# Game Hub 0.13.0-dev.68 — console-style Steam profile overview

- Rebuild the Steam profile overview around the requested console layout: top navigation, large identity block, glass Level/Badges/Friends/Groups/Inventory cards, horizontal recent games and an achievement strip.
- Keep the viewed player's equipped Steam background, avatar/frame and real profile details. The reference's example games, country, language and statistics are not fabricated. The small gold accent is decorative, not a subscription status.
- Read actual next-level XP from the same profile's Steam Badges page once per view. Fall back to the Badges link if that information cannot load. Badge XP is never misrepresented as progress to the next level.
- Retain native Steam nodes, links, Message/More actions, comments and showcases. Additional native content remains below the new overview. Achievements shows a real recent game's progress and labels which game it belongs to; when the selected game has none, another available recent game's progress is shown.
- Use Steam's existing direction/A event stream for spatial focus; B and Guide remain with Steam. Dialogs and text editing retain native input handling.
- Add a console-style profiles toggle in Game Hub Settings and Control Center Settings > Appearance. The profile gear offers original Steam presentation for the current visit.
- Keep account edits, inventory, purchases and other unsupported profile subpages native. Private/unrecognized layouts safely retain the native page.

Validation: 65 focused profile, Store, activity-navigation and browser tests; six backend boundary/cleanup tests. Live Windows profile rendering inspected. Physical Xbox controller and SteamOS/Bazzite device testing remain unverified. TypeScript and production build checks passed.

No third-party plugin changes. No background, avatar, message or profile account changes. GitHub has not been updated with this local build.

Implementation: profile.js and profile.css are delivered through the existing secure native-browser presentation adapter. Decoration is scoped to recognized overview pages, with reversible DOM moves. A single cancellable, same-origin Badges request supplies XP; no polling, API keys, invented data or stored profile payloads. The player’s native background video is retained and paused when the document is hidden or reduced motion is enabled.
