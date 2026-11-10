import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {useState} from 'react';
import {usePartyFocus} from '../src/party-focus';
import {useFriendsFocus} from '../src/friends-focus';
import {PartyPicker} from '../src/PartyPicker';
import {browserControls} from '../preview/controls';

beforeEach(()=>{vi.stubGlobal('requestAnimationFrame',(fn:FrameRequestCallback)=>setTimeout(()=>fn(0),0));vi.stubGlobal('cancelAnimationFrame',clearTimeout);});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const direction=(element:Element,button:number)=>{let accepted=true;act(()=>{accepted=element.dispatchEvent(new CustomEvent('vgp_ondirection',{bubbles:true,cancelable:true,detail:{button}}));});return accepted;};
function Picker(){const root=usePartyFocus('picker');const [selected,setSelected]=useState<string[]>([]);return <div ref={root}><section className="gbs-party-card"><PartyPicker controls={browserControls} friends={[{id:'123',name:'Friend',state:'online'}]} selected={selected} setSelected={setSelected} favorites={[]} recent={[]}/></section><aside className="gbs-party-side"><button className="gbs-button"><span data-party-primary>Create</span></button></aside></div>;}
it('keeps filter directions local, preserves selection, handles empty lists and restores the filter',async()=>{
 render(<Picker/>);const filters=['All Friends','Online Friends','Favorites','Recently Contacted'].map(name=>screen.getByRole('button',{name}));await waitFor(()=>expect(document.activeElement).toBe(filters[0]));
 for(let i=0;i<3;i++){direction(filters[i],12);expect(document.activeElement).toBe(filters[i+1]);}
 expect(filters[0].getAttribute('aria-pressed')).toBe('true');
 for(let i=3;i>0;i--){direction(filters[i],11);expect(document.activeElement).toBe(filters[i-1]);}
 direction(filters[0],10);const row=document.querySelector('.gbs-party-row')!;expect(document.activeElement).toBe(row);fireEvent.click(row);expect(screen.getByText('Selected Players: 1')).toBeTruthy();
 direction(row,9);expect(document.activeElement).toBe(filters[0]);fireEvent.click(filters[2]);filters[2].focus();expect(document.querySelector('.gbs-party-row')).toBeNull();expect(direction(filters[2],10)).toBe(false);expect(document.activeElement).toBe(filters[2]);expect(screen.getByText('Selected Players: 1')).toBeTruthy();
 fireEvent.click(filters[1]);filters[1].focus();direction(filters[1],10);direction(document.querySelector('.gbs-party-row')!,9);expect(document.activeElement).toBe(filters[1]);
});
function Friends(){const [selected,setSelected]=useState('a');const root=useFriendsFocus(true,setSelected);return <div ref={root}><div className="gbs-list">{['a','b'].map(id=><button key={id} className="gbs-button gbs-friend" aria-pressed={id===selected}><span data-friend-id={id}>{id}</span></button>)}</div><div className="gbs-detail"><span data-testid="identity">{selected}</span><div className="gbs-actions">{['Message','Start Voice Chat','View Profile'].map(name=><button key={name} className="gbs-button">{name}</button>)}</div></div></div>;}
it('moves to the exact friend actions and restores that row and scroll',async()=>{
 render(<Friends/>);const row=screen.getByRole('button',{name:'b'}),message=screen.getByRole('button',{name:'Message'}),voice=screen.getByRole('button',{name:'Start Voice Chat'}),profile=screen.getByRole('button',{name:'View Profile'});const list=document.querySelector('.gbs-list')!;list.scrollTop=320;row.focus();direction(row,12);await waitFor(()=>expect(document.activeElement).toBe(message));expect(screen.getByTestId('identity').textContent).toBe('b');direction(message,12);expect(document.activeElement).toBe(voice);direction(voice,12);expect(document.activeElement).toBe(profile);direction(profile,11);direction(voice,11);direction(message,11);expect(document.activeElement).toBe(row);expect(list.scrollTop).toBe(320);expect(screen.getByTestId('identity').textContent).toBe('b');
});
it('preserves the existing Party list to primary action edge',async()=>{
 function Party(){const ref=usePartyFocus('list');return <div ref={ref}><section className="gbs-party-card"><div className="gbs-party-list"><button className="gbs-button gbs-party-row"><span data-party-key="friend">Friend</span></button></div></section><aside className="gbs-party-side"><button className="gbs-button"><span data-party-primary>Audio Settings</span></button></aside></div>;}
 render(<Party/>);const row=screen.getByRole('button',{name:'Friend'}),audio=screen.getByRole('button',{name:'Audio Settings'});await waitFor(()=>expect(document.activeElement).toBe(row));direction(row,12);expect(document.activeElement).toBe(audio);direction(audio,11);expect(document.activeElement).toBe(row);
});
