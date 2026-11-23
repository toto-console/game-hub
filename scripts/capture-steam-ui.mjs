/* global fetch, AbortSignal, WebSocket, setTimeout, clearTimeout */
import {writeFile} from 'node:fs/promises';
// Read-only collector. No settings, accounts, messages, text, URLs or full DOM.
const out=process.argv[2];
if(!out)throw Error('Usage: node scripts/capture-steam-ui.mjs OUTPUT.json');
const targets=await fetch('http://127.0.0.1:8080/json',{signal:AbortSignal.timeout(5000)}).then(r=>r.json());
const target=targets.find(t=>t.title==='SharedJSContext');
if(!target)throw Error('SharedJSContext unavailable. Use the tester checklist; do not change production Steam.');
const expression=`(()=>{
 const dfl=globalThis.DFL,w=dfl?.Router?.WindowStore?.GamepadUIMainWindowInstance,d=w?.BrowserWindow?.document;
 const shapes={header:['DashboardBar','Header','Clock','CurrentUserAvatar'],browser:['MainBrowserContainer','BrowserContainer','URLBar'],footer:['BasicFooter','FooterLegend']};
 const roles=Object.fromEntries(Object.entries(shapes).map(([role,keys])=>[role,(Array.isArray(dfl?.classMap)?dfl.classMap:[]).filter(m=>keys.every(k=>typeof m?.[k]==='string')).map(m=>({classes:Object.fromEntries(keys.map(k=>[k,m[k]])),nodes:Object.fromEntries(keys.map(k=>{const tokens=m[k].trim().split(/\\s+/);if(!tokens.every(t=>/^[a-zA-Z0-9_-]+$/.test(t)))return [k,{count:0}];const nodes=[...(d?.getElementsByClassName(m[k])??[])];return [k,{count:nodes.length,tags:[...new Set(nodes.map(n=>n.tagName))]}];}))}))]));
 const plugins=globalThis.DeckyPluginLoader?.plugins??[];
 return {schema:1,capturedAt:new Date().toISOString(),platform:globalThis.navigator?.platform,steamChannel:'UNCONFIRMED',steamBuild:'UNCONFIRMED',roles,capabilities:{deckyClassMap:Array.isArray(dfl?.classMap),router:!!w,menu:typeof w?.MenuStore?.OpenSideMenu==='function',history:typeof w?.m_history?.listen==='function',browserHeader:typeof w?.HeaderStore?.SetCurrentBrowserAndBackstack==='function',runGame:typeof globalThis.SteamClient?.Apps?.RunGame==='function',installWizard:typeof globalThis.SteamClient?.Installs?.OpenInstallWizard==='function'},plugins:plugins.filter(p=>['Game Base Social','Playhub','ThemeDeck','CSS Loader'].includes(p.name)).map(p=>({name:p.name,version:typeof p.version==='string'?p.version:'unknown'}))};
})()`;
const report=await new Promise((resolve,reject)=>{
 const ws=new WebSocket(target.webSocketDebuggerUrl);const timeout=setTimeout(()=>{ws.close();reject(Error('Steam diagnostic timed out'));},8000);
 ws.onopen=()=>ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression,returnByValue:true}}));
 ws.onerror=()=>{clearTimeout(timeout);reject(Error('Steam diagnostic connection failed'));};
 ws.onmessage=({data})=>{const r=JSON.parse(String(data));if(r.id!==1)return;clearTimeout(timeout);ws.close();if(r.result?.exceptionDetails||r.error)reject(Error('Steam diagnostic failed; host interfaces may be unavailable'));else resolve(r.result.result.value);};
});
await writeFile(out,JSON.stringify(report,null,2)+'\n');console.log('Saved sanitized Steam UI capabilities and class-map diagnostic.');
