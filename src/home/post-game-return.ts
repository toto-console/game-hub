/** Consume Steam's post-game detail destination once, whichever arrives first:
 * the game lifetime event or the main window's return navigation. */
export function watchPostGame(main:any, sessions:any, enabled:()=>boolean) {
  const history=main.m_history;
  let exited=0, previous=history.location.pathname;
  let menuOrigin='/game-hub/home';
  const instances=new Map<number,number>();
  const detailsId=(path:string)=>Number(/^\/library\/app\/(\d+)\/?$/.exec(path)?.[1] || 0);
  const redirect=(id:number)=>{
    exited=0;
    if(enabled()) history.replace('/game-hub/post-game/'+id);
  };
  const subscription=sessions.RegisterForAppLifetimeNotifications((event:any)=>{
    const path=history.location.pathname;
    if(event.bRunning){
      exited=0;
      instances.set(event.nInstanceID,event.unAppID||Number(main.MainRunningAppID)||detailsId(path));
      return;
    }
    exited=event.unAppID||instances.get(event.nInstanceID)||0;
    instances.delete(event.nInstanceID);
    if(exited && detailsId(path)===exited) redirect(exited);
  });
  const unlisten=history.listen((location:{pathname:string},action?:string)=>{
    const id=detailsId(location.pathname),fromGame=/^\/apprunning(?:\/|$)/.test(previous);
    const previousMenu=/^\/game-hub\/post-game\/(\d+)$/.exec(previous);
    if(/^\/game-hub\/post-game\/\d+$/.test(location.pathname)&&!previousMenu){
      if(/^\/(?:game-hub\/(?:home|library)(?:\/|$)|library(?:\/home)?$)/.test(previous))menuOrigin=previous;
      else menuOrigin='/game-hub/home';
    }
    const leavingMenu=previousMenu&&action==='POP'&&id===Number(previousMenu[1]);
    previous=location.pathname;
    if(leavingMenu&&enabled()){exited=0;history.replace(menuOrigin);return;}
    if(id && (id===exited || fromGame)) redirect(id);
    else if(!fromGame && !/^\/apprunning(?:\/|$)/.test(location.pathname)) exited=0;
  });
  return ()=>{unlisten();subscription?.unregister?.();};
}
