# dev56 achievement comparison

Uses SteamClient.Apps.GetFriendAchievementsForApp(appidString, steamid64), confirmed against the locally installed Steam sp.js implementation. Its rgAchievements payload uses the existing parser. Global percentages come from flAchieved in GetMyAchievementsForApp, matching Steam's own global achievement mapping. No Web API key or external friend scraping is used.

Friends are read from the existing Steam friends adapter. Only the selected friend's achievements are fetched; requests time out after five seconds. Successful results have a 60-second cache capped at 20 entries. Component cleanup prevents old friend/game responses from overwriting the current selection. Missing per-achievement data and failed/private requests display unavailable, not locked/zero. Hidden achievement names remain based on the current user's protected metadata.

TypeScript passed. Eleven focused tests passed: provider parsing, real app/friend identity, bounded caching/timeouts, privacy/error handling, view selection, sorting, detail Back restoration and Welcome return. Production build/package integrity are checked during packaging. Hardware controller and SteamOS validation remains pending.

Manual check: open Achievements, select Compare with friends, choose a friend with public game stats, compare the percentages and row statuses, then select Global. Press B from the friend picker and detail view to confirm focus returns. Check a private-profile friend displays unavailable.

ThemeDeck's separately approved local title-style compatibility fix remains installed and is not redistributed in the Game Hub ZIP. No GitHub update was performed.
