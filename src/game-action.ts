import {readDownloads,type DownloadSnapshot,type DownloadHost} from './downloads';

import {isInstalled,SHORTCUT,type LibraryApp} from './library-data';

export type GameAction={kind:'play'|'install'|'downloads'|'running'|'details';label:string;percent?:number};

/** Transfer completion is not installation readiness. Active queue records always win. */

export function gameAction(host:DownloadHost,app:LibraryApp,running=false,snapshot?:DownloadSnapshot):GameAction {

 const transfer=(snapshot??readDownloads(host)).rows.find(r=>r.appid===app.appid&&r.section!=='completed'&&r.section!=='uploads');

 if(transfer)return {kind:'downloads',label:transfer.error?'Download error — View Downloads':transfer.status+(transfer.percent!==undefined?' — '+Math.round(transfer.percent)+'%':' — View Downloads'),percent:transfer.percent};

 if(running)return {kind:'running',label:'View running game'};

 if(app.app_type===SHORTCUT||isInstalled(app))return {kind:'play',label:'Play'};

 return {kind:'install',label:'Install'};

}

export function openGameDownloads(appid:number,origin?:HTMLElement|null){

 const doc=origin?.ownerDocument??document,View=doc.defaultView;

 if(!View)throw Error('Game Hub Downloads is unavailable.');

 const event=new View.CustomEvent('game-hub:open-downloads',{detail:{appid,origin:origin??doc.activeElement},cancelable:true});

 doc.dispatchEvent(event);

 if(!event.defaultPrevented)throw Error('Enable Game Hub Control Center to open Downloads.');

}

