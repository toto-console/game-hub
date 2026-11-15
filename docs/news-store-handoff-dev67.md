# dev.67 — Game News Store handoff

The Game News card previously called Steam web navigation while its full-screen Control Center modal was still open, then requested closure. Steam's native MainBrowserContainer uses hideForModals. News now explicitly dismisses the modal before navigating, using the existing profile/Switcher handoff and Back-focus restoration. The Store URL and news feed are unchanged.

A missing main-window NavigateToSteamWeb method now throws instead of silently returning. A synchronous navigation failure clears the pending return snapshot and reopens Control Center. This does not detect network/server failures or change Steam age gates.

Scope: src/ControlCenter.tsx and src/index.tsx plus version metadata. No layout, theme, feed, controller bindings, games or third-party plugin changes.

Validation: TypeScript check and 39 focused tests for news UI/feed, browser handling and Back return passed. Production build passed. Live controller and in-game behavior still need user verification.

Try Control Center -> Game News -> A. The associated Steam Store listing should open. B should return to Control Center. Existing native Steam browser recovery remains available.
