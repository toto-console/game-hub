import {useEffect,useState} from 'react';
import {librarySignature} from './library-data';
// One shared, bounded refresh while at least one library consumer is mounted.
const listeners=new Set<()=>void>();let timer:ReturnType<typeof setInterval>|undefined,signature='',revision=0;
function refresh(){const next=librarySignature(window as any);if(next!==signature){signature=next;revision++;listeners.forEach(fn=>fn());}}
export function useLibraryRevision(active=true){const [value,setValue]=useState(revision);useEffect(()=>{if(!active)return;const notify=()=>setValue(revision);listeners.add(notify);refresh();notify();if(!timer)timer=setInterval(refresh,2000);return()=>{listeners.delete(notify);if(!listeners.size&&timer){clearInterval(timer);timer=undefined;}};},[active]);return value;}
