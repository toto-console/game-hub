/** Steam composition ABI: Hidden=0, Notification=1, Overlay=2.
 * @decky/ui 4.12.1 globals/steam-client/shared.ts defines this numeric enum.
 * Bundle the value: older Decky DFL globals do not export EUIComposition.
 * This is NOT an overlay implementation; real composition/activation APIs are
 * independently checked by createControlCenter before intercepting any menu.
 */
export const OVERLAY_COMPOSITION = 2;
