import {afterEach,expect,it,vi} from 'vitest';
import {connectProfileReturn,clearProfileReturn} from '../src/profile-return';
afterEach(clearProfileReturn);
it('does not crash plugin startup before the Steam main window exists',()=>{
 const pending=connectProfileReturn(undefined,vi.fn(),()=>false);
 expect(()=>pending.begin()).toThrow('not ready');
 expect(()=>pending.dispose()).not.toThrow();
});
it('binds the later window and releases its native browser history listener',()=>{
 const stop=vi.fn(),listen=vi.fn(()=>stop);
 const main={LocationPathName:'/apprunning',m_history:{listen}};
 const center=connectProfileReturn(main,vi.fn(),()=>true);
 expect(listen).toHaveBeenCalledOnce();center.begin();
 center.dispose();expect(stop).toHaveBeenCalledOnce();
});
