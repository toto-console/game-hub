import {previewMessages} from './messages';
import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Panel} from '../src/Panel';
import {defaults} from '../src/settings';
import {browserControls} from './controls';
import {friends,preview} from './fixtures';
import type {SocialBridge} from '../src/model';
const bridge:SocialBridge={messages:previewMessages,readFriends:()=>({kind:'ready',friends,detail:'Fictional names and activity · no live Steam connection'}),openNative:()=>alert('Design preview only. The installed plugin requests native Steam navigation.'),openProfile:()=>alert('Fictional profile. No Steam account is connected.')};
function App(){const [settings,setSettings]=useState({...defaults,liveFriends:true});return <Panel controls={browserControls} bridge={bridge} settings={settings} setSettings={setSettings} onBack={()=>alert('Design preview only. In Decky, Back returns to the previous screen.')} preview={preview}/>;}
createRoot(document.getElementById('root')!).render(<App/>);


