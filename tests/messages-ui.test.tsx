import {afterEach,describe,it,expect,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {Messages} from '../src/ChatPanel';
import {browserControls} from '../preview/controls';
import type {SocialBridge} from '../src/model';
import type {Thread} from '../src/messages';
afterEach(cleanup);
function harness(){
 const thread:Thread={messages:[{id:'1',author:'Test friend',self:false,text:'<img src=x onerror=alert(1)>',time:100,state:'sent'}],typing:false,more:false,canSend:true};
 const session={read:()=>thread,load:vi.fn(async()=>{}),send:vi.fn(async()=>{}),dispose:vi.fn()};
 const bridge:SocialBridge={readFriends:()=>({kind:'ready',detail:'',friends:[]}),openNative:vi.fn(),openProfile:vi.fn(),messages:{inbox:()=>({account:'1',connected:true,conversations:[{id:'a',name:'Test friend',kind:'friend',subtitle:'Direct message',unread:1,time:100}]}),open:()=>session,friend:()=> 'a'}};
 const result=render(<Messages memory={{last:'',scroll:0,drafts:new Map()}} onThread={()=>{}} registerBack={()=>{}} onParent={()=>{}} onInitialUsed={()=>{}} bridge={bridge} controls={browserControls} native={bridge.openNative}/>);
 return {session,...result};
}
describe('connected Messages UI',()=>{
 it('requires explicit conversation selection and renders message text safely',async()=>{const h=harness();expect(h.session.load).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:/Test friend/}));await waitFor(()=>expect(h.session.load).toHaveBeenCalledOnce());expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeTruthy();expect(document.querySelector('.gbs-chat-bubble img')).toBeNull();expect(h.session.send).not.toHaveBeenCalled();});
 it('preserves the draft on delivery failure and cleans up sessions',async()=>{const h=harness();h.session.send.mockRejectedValue(Error('Not delivered'));fireEvent.click(screen.getByRole('button',{name:/Test friend/}));await waitFor(()=>expect(h.session.load).toHaveBeenCalledOnce());const input=screen.getByRole('textbox');fireEvent.change(input,{target:{value:'Keep this draft'}});fireEvent.click(screen.getByRole('button',{name:'Send'}));await waitFor(()=>expect(screen.getByRole('alert').textContent).toContain('Not delivered'));expect((input as HTMLInputElement).value).toBe('Keep this draft');h.unmount();expect(h.session.dispose).toHaveBeenCalledOnce();});
 it('sends only on explicit Send and clears an acknowledged draft',async()=>{const h=harness();fireEvent.click(screen.getByRole('button',{name:/Test friend/}));const input=await screen.findByRole('textbox');fireEvent.change(input,{target:{value:'Hello'}});fireEvent.keyDown(input,{key:'Enter'});expect(h.session.send).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Send'}));await waitFor(()=>expect((input as HTMLInputElement).value).toBe(''));expect(h.session.send).toHaveBeenCalledExactlyOnceWith('Hello');});
});

