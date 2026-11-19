export type FriendPlatform='steam-machine'|'steam-deck'|'legion-go-s';
/** Steam persona gaming_device_type, verified against the installed client enum.
 * Generic PC/unknown and rich-presence strings cannot identify a console. */
export function friendPlatform(value:unknown):FriendPlatform|undefined {
 switch(value){case 546:return 'steam-machine';case 544:return 'steam-deck';case 545:return 'legion-go-s';default:return undefined;}
}
