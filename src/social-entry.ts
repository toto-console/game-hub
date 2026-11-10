/** Experimental, source-verified Windows social-entry adapter.
 * Hooks only the existing main Gamepad UI instance, never prototypes/windows.
 * All non-social calls retain their original receiver, arguments and return value.
 */
export const HUB_ROUTE = '/game-base-social';
export const NATIVE_CHAT_ROUTE = '/chat';
export const FRIENDS_TAB = 3;
type Method = (...args: unknown[]) => unknown;
type MainWindow = {
  Navigate: Method; LocationPathName: string; BCanNavigate: () => boolean;
  MenuStore: {OpenQuickAccessMenu: Method; CloseSideMenus: () => void; OpenSideMenu?:Method;GetQuickAccessTab?:()=>number};
};
export type PatchHandle = {unpatch:()=>void};
export type PatchFunction = (object:object,property:string,handler:(args:unknown[])=>unknown)=>PatchHandle;
export type EntryAdapter = {connected:boolean;dispose:()=>void;openNative:()=>void};
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object';
function canReplace(obj:object,key:string):boolean {
  let owner:object|null=obj;
  while(owner&&!Object.prototype.hasOwnProperty.call(owner,key))owner=Object.getPrototypeOf(owner);
  if(!owner)return false;
  const d=Object.getOwnPropertyDescriptor(owner,key);
  return !!d&&'value' in d&&d.writable===true&&(owner===obj||Object.isExtensible(obj));
}
export function connectSocialEntry(candidate:unknown,patch:PatchFunction,callOriginal:symbol,isEnabled:()=>boolean):EntryAdapter {
  const disconnected:EntryAdapter={connected:false,dispose:()=>{},openNative:()=>{throw new Error('Main Steam window unavailable');}};
  try {
    if(!record(candidate)||typeof candidate.Navigate!=='function'||typeof candidate.BCanNavigate!=='function'||typeof candidate.LocationPathName!=='string'||
      !record(candidate.MenuStore)||typeof candidate.MenuStore.OpenQuickAccessMenu!=='function'||typeof candidate.MenuStore.CloseSideMenus!=='function')return disconnected;
  } catch {return disconnected;}
  const target=candidate as MainWindow;
  // Steam's MobX action.bound OpenQuickAccessMenu is non-writable and
  // non-configurable in the actual Windows client. Never override its descriptor.
  // Its original implementation selects the tab, then calls OpenSideMenu(2).
  const direct=canReplace(target.MenuStore,'OpenQuickAccessMenu');
  const sideMenu=!direct&&typeof target.MenuStore.OpenSideMenu==='function'&&typeof target.MenuStore.GetQuickAccessTab==='function'&&canReplace(target.MenuStore,'OpenSideMenu');
  if(!canReplace(target,'Navigate')||(!direct&&!sideMenu))return disconnected;
  const handles:PatchHandle[]=[];
  let active=true;
  let bypass=0;
  const canRedirect=()=>{try{return active&&!bypass&&isEnabled()&&target.BCanNavigate();}catch{return false;}};
  const close=()=>{try{target.MenuStore.CloseSideMenus();}catch{/* Successful navigation must not be repeated if menu closure fails. */}};
  const dispose=()=>{if(!active)return;active=false;for(const handle of handles.reverse()){try{handle.unpatch();}catch{/* Disabled wrappers pass through if another plugin replaced the chain. */}}};
  try {
    handles.push(patch(target,'Navigate',args=>{
      // Deep links, location objects, query strings and stateful chat navigation remain native.
      if(args[0]!==NATIVE_CHAT_ROUTE||args[3]!==undefined||!canRedirect())return callOriginal;
      if(target.LocationPathName===HUB_ROUTE){close();return;}
      args[0]=HUB_ROUTE;
      return callOriginal;
    }));
    const property=direct?'OpenQuickAccessMenu':'OpenSideMenu';
    const hadOwn=Object.prototype.hasOwnProperty.call(target.MenuStore,property);
    const inherited=target.MenuStore[property as 'OpenQuickAccessMenu'|'OpenSideMenu'];
    const menuPatch=patch(target.MenuStore,property,args=>{
      // Direct: false means background tab selection. Locked-action fallback:
      // the original OpenQuickAccessMenu already selected Friends before this call.
      if(!canRedirect())return callOriginal;
      try {if(direct ? args[0]!==FRIENDS_TAB||args[1]===false : args[0]!==2||target.MenuStore.GetQuickAccessTab?.()!==FRIENDS_TAB)return callOriginal;}catch{return callOriginal;}
      try {
        if(target.LocationPathName!==HUB_ROUTE)target.Navigate(HUB_ROUTE);
      } catch {return callOriginal;}
      close();return;
    });
    handles.push({unpatch:()=>{
      menuPatch.unpatch();
      // Remove only our temporary instance shadow after the last compatible hook
      // is gone. Never change Steam's prototype or discard another plugin's hook.
      if(!hadOwn&&target.MenuStore[property as 'OpenQuickAccessMenu'|'OpenSideMenu']===inherited)Reflect.deleteProperty(target.MenuStore,property);
    }});
  } catch {dispose();return disconnected;}
  return {connected:true,dispose,openNative:()=>{
    // Direct, synchronous navigation to the verified native route. The bypass is
    // scoped to this call, so the next Friends & Chat action opens the hub again.
    bypass++;
    try {if(sideMenu){close();target.MenuStore.OpenQuickAccessMenu(FRIENDS_TAB,true);}else{target.Navigate(NATIVE_CHAT_ROUTE);close();}}finally{bypass--;}
  }};
}
