/** The packaging step binds the target before any routes or input hooks start. */
export function packagePlatformAllowed(target:string, platform:string):boolean {
  if(target.startsWith('__GAMEHUB_'))return true; // shared development source only
  if(target==='windows-x86_64')return /^Win/i.test(platform);
  if(target==='linux-x86_64')return /^Linux.*(?:x86_64|amd64)/i.test(platform);
  return false;
}
