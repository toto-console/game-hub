/** Steam shortcut IDs must remain full-width strings. Metadata plugins can make
 * GetGameID() return an app ID on Home but the full game ID on native details. */
export function launchGameId(app:{appid:number;app_type:number;m_gameid?:string;gameid?:string;GetGameID?:()=>unknown}):string|undefined {
 const valid=(id:unknown):id is string=>typeof id==='string'&&/^\d+$/.test(id)&&BigInt(id)>0n&&BigInt(id)<=18446744073709551615n;
 const shortcut=app.app_type===1073741824;
 const acceptable=(id:unknown):id is string=>valid(id)&&(!shortcut||(BigInt(id)>>32n)===BigInt(app.appid)&&(BigInt(id)&0xffffffffn)===0x02000000n);
 // Use the authoritative stored shortcut identity, independent of route-sensitive patches.
 if(shortcut)for(const id of [app.m_gameid,app.gameid])if(acceptable(id))return id;
 try {const native=app.GetGameID?.();if(acceptable(native))return native;}catch{/* Older contexts may lack the native method. */}
 if(!shortcut){for(const id of [app.m_gameid,app.gameid])if(valid(id))return id;
  return Number.isSafeInteger(app.appid)&&app.appid>0?String(app.appid):undefined;}
 return undefined;
}
