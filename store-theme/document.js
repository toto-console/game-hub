/* Presentation only; preserve the native Store, media, commerce and focus engines. */
function installGameHubStore(options, css) {
  const root=document.documentElement,VERSION=16;
  function activity(raw=location.href){try{const u=new URL(raw);return u.origin==='https://steamcommunity.com'&&!u.username&&!u.password&&/^\/(?:my|id\/[a-zA-Z0-9_-]+|profiles\/\d+)\/home\/?$/.test(u.pathname)&&[...u.searchParams.keys()].every(k=>['l','snr'].includes(k));}catch{return false;}}
  function supported(raw=location.href) {
    try{const u=new URL(raw,location.href),path=decodeURIComponent(u.pathname),query=decodeURIComponent(u.search);
      if(activity(raw))return root.classList.contains('GamepadMode');
      return u.origin==='https://store.steampowered.com'&&!u.username&&!u.password&&
        !/(login|logout|checkout|account|payment|purchase|auth|token|agecheck|agegate|redirect|error|warning|steamguard)/i.test(path+query)&&
        (path==='/'||/^\/cart\/?$/.test(path)||/^\/(app|sub|bundle)\/\d+(?:\/[^/]*)?\/?$/.test(path)||/^\/(search|category|genre|tags|specials|explore|wishlist)(\/|$)/.test(path))&&root.classList.contains('GamepadMode');
    }catch{return false;}
  }
  const previous=window.__gameHubStoreAppearance;
  if(!options.enabled||!supported()){previous?.dispose();return {applied:false,reason:'Native Steam presentation'};}
  if(window.__gameHubStoreOriginalURL===location.href)return {applied:false,reason:'Original Steam Store for this visit; reopen Store to restore the custom layout'};
  if(previous?.version===VERSION){previous.update(options,css);return {applied:true,reason:'Game Hub Store presentation active'};}
  previous?.dispose();
  if(!document.querySelector(activity()?'.blotter_status_entry,.blotter_block,.blotter_day':'.responsive_page_template_content'))return {applied:false,reason:'Store layout not recognized'};
  const style=document.createElement('style');style.id='game-hub-store-theme';style.textContent=css;document.head.append(style);
  let disposed=false;
  const update=(next,nextCSS)=>{
    options=next;if(style.textContent!==nextCSS)style.textContent=nextCSS;
    if(activity()){delete root.dataset.ghStore;root.dataset.ghActivity='ps5';}else{delete root.dataset.ghActivity;root.dataset.ghStore='cinematic';}root.dataset.ghStoreBackground=String(options.backgrounds);root.dataset.ghStoreMotion=String(options.motion);root.dataset.ghStoreSubtle=String(options.subtle);
  };
  const stopGloss=connectFocusGloss(document,()=>!disposed&&supported()&&options.gloss&&options.motion,activity()?'[data-gh-activity] .responsive_page_template_content':'[data-gh-store] .responsive_page_template_content');
  const stopActivity=activity()?connectActivityNavigation(document,()=>!disposed&&activity()&&supported()):()=>{};
  const before={pushState:history.pushState,replaceState:history.replaceState},wrapped={};
  const dispose=()=>{
    if(disposed)return;disposed=true;stopActivity();stopGloss();style.remove();
    for(const key of ['ghActivity','ghStore','ghStoreBackground','ghStoreMotion','ghStoreSubtle'])delete root.dataset[key];
    window.removeEventListener('popstate',changed);window.removeEventListener('pagehide',hide);
    window.removeEventListener('pageshow',show);
    for(const key of ['pushState','replaceState'])if(history[key]===wrapped[key])history[key]=before[key];
    delete window.__gameHubStoreAppearance;
  };
  const changed=()=>{if(!supported())dispose();else update(options,css);};
  const hide=e=>{if(!e.persisted)dispose();};
  const show=()=>changed();
  for(const key of ['pushState','replaceState']){
    wrapped[key]=function(...args){
      // Remove BEFORE entering a sensitive route, but retain resources on public navigation.
      if(args[2]!=null&&!supported(new URL(args[2],location.href).href))dispose();
      const result=before[key].apply(this,args);if(!disposed)changed();return result;
    };history[key]=wrapped[key];
  }
  window.addEventListener('popstate',changed);window.addEventListener('pagehide',hide);window.addEventListener('pageshow',show);
  window.__gameHubStoreAppearance={version:VERSION,dispose,update,original(){window.__gameHubStoreOriginalURL=location.href;dispose();}};
  update(options,css);
  return {applied:true,reason:'Native Steam layout with navy colors and rounded corners'};
}
