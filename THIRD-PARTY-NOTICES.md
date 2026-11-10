# Third-party notices

Game Base Social's original application code is MIT licensed (LICENSE).

- **@decky/api 1.1.3**, SteamDeckHomebrew Team, LGPL-2.1. The plugin bundle includes tree-shaken portions of this unmodified API library. Its distributed source/JavaScript/declarations and package metadata are in `third_party/decky-api-1.1.3`, with its full license in `licenses/`. Upstream: https://github.com/SteamDeckHomebrew/loader-api. The accompanying source ZIP includes the application source, exact lockfile and Rollup instructions to rebuild/relink against a modified library. Reverse engineering to debug modifications to this library is not prohibited by this project.
- **@decky/ui 4.12.1**, SteamDeckHomebrew Team, LGPL-2.1. Supplied by Decky at runtime; not bundled in the plugin. Upstream: https://github.com/SteamDeckHomebrew/decky-frontend-lib.
- **@decky/rollup 1.0.2**, SteamDeckHomebrew, BSD-3-Clause. Build tooling only; license included in `licenses/`.
- **React and React DOM 19.1.1**, Meta Platforms and affiliates, MIT. Host-provided for the Decky plugin, bundled only in the separate browser preview. License texts included in `licenses/`.
- **Scheduler**, Meta Platforms and affiliates, MIT, used by the React preview. License included in `licenses/`.
- **tslib 2.8.1**, Microsoft, Apache-2.0. Development/runtime helper dependency; license included in `licenses/`.

The other tools in package-lock.json are development dependencies and are not included as node_modules in the source or install ZIP. Their notices are supplied by their npm distributions after `npm ci`.

No Sony proprietary fonts, sounds, logos, screenshots or icons are bundled. System font names request fonts already available on the machine. Initials and simple Unicode symbols are used as original UI placeholders. The supplied Millennium prototype was reviewed as a design reference; its code and screenshots are not redistributed. Steam and PlayStation trademarks belong to their respective owners; this project is unaffiliated.

Embedded controls reuse the user-installed Glance Library 1.0.0 and Game Glance 3.6.0 registered React elements (installed metadata declares MIT). Their code/assets are not copied, forked or distributed in this package. Other installed plugin licenses remain with their owners.

## Integrated Home and icon attribution

Home/Library and HLTB-derived code: decky-ps5-dashboard 1.10.0, commit 44e3979c65f0f50f8e7b347e277496f7ba46c8ce, copyright 2026 kromossomo, MIT. https://github.com/kromossomom-debug/decky-ps5-dashboard . See licenses/ps5-dashboard-MIT.txt. Local adaptations isolate routes, state, styling and Game Hub integration.

react-icons 5.3.0 is MIT; Google Material icons Apache-2.0; Ionic Ionicons MIT; Fonticons Font Awesome icons CC BY 4.0. Full corresponding notices are in licenses/. All artwork and optional music are loaded at runtime from user-installed services; no captured game artwork or preview snapshots are redistributed.
