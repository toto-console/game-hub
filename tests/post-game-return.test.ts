import {describe,it,expect,vi} from 'vitest';
import {watchPostGame} from '../src/home/post-game-return';

function session(enabled=true){
  let onLife:(event:any)=>void, onRoute:(location:{pathname:string},action?:string)=>void;
  const unregister=vi.fn(),unlisten=vi.fn();
  const history={location:{pathname:'/library/app/123'},replace:vi.fn(),listen:(fn:typeof onRoute)=>{onRoute=fn;return unlisten;}};
  const stop=watchPostGame({m_history:history},{RegisterForAppLifetimeNotifications:(fn:typeof onLife)=>{onLife=fn;return {unregister};}},()=>enabled);
  return {history,stop,unregister,unlisten,life:(running:boolean,id:number)=>onLife({nInstanceID:3,bRunning:running,unAppID:id}),go:(path:string,action?:string)=>{history.location={pathname:path};onRoute(history.location,action);}};
}
describe('Steam game return',()=>{
  it('resolves a shortcut whose lifetime event has no Steam app ID',()=>{
    const s=session();s.life(true,0);s.life(false,0);
    expect(s.history.replace).toHaveBeenCalledWith('/game-hub/post-game/123');
  });
  it('handles a native game page restored after the process exits',()=>{
    const s=session();s.life(true,123);s.go('/apprunning');s.life(false,123);s.go('/library/app/123');
    expect(s.history.replace).toHaveBeenCalledOnce();
  });
  it('returns to the tile screen if Steam restores a stale same-game detail entry on Back',()=>{
    const s=session();s.go('/game-hub/home/library');s.go('/game-hub/post-game/123');s.go('/library/app/123','POP');
    expect(s.history.replace).toHaveBeenCalledWith('/game-hub/home/library');
  });
  it('allows deliberate navigation to native game details',()=>{
    const s=session();s.go('/game-hub/post-game/123');s.go('/library/app/123','PUSH');
    expect(s.history.replace).not.toHaveBeenCalled();
  });
  it('leaves ordinary browsing and disabled integration alone',()=>{
    const s=session();s.go('/library/app/456');expect(s.history.replace).not.toHaveBeenCalled();
    const off=session(false);off.go('/apprunning');off.go('/library/app/123');expect(off.history.replace).not.toHaveBeenCalled();
    off.stop();expect(off.unlisten).toHaveBeenCalledOnce();expect(off.unregister).toHaveBeenCalledOnce();
  });
});
