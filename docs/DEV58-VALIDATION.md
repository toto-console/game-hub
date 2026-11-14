# dev58 orbit animation

Replaced near-static star pulsing with clockwise and counter-clockwise orbits, eight staggered sparkle pulses and a moving rim reflection. Visible rare icons animate without focus. A single IntersectionObserver tracks page decorations and disconnects on cleanup. Offscreen, inert-background and reduced-motion states disable animation.

TypeScript and three achievement navigation/comparison tests passed. Headless Edge measured changed rotation transforms over 600 ms on visible icons and confirmed offscreen and reduced-motion stopping. No achievement data, soundtracks, controller behavior or user settings changed. Production and archive checks run during packaging. Live SteamOS rendering remains untested.
