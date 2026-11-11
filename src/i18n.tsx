import {useSyncExternalStore} from 'react';
import catalog from './translations.json';
export type Language = 'auto'|'en'|'pt-BR'|'ja';
export const LANGUAGE_KEY='game-hub.language.v1';
export const languages:readonly {id:Language;name:string}[]=[{id:'auto',name:'Use system language'},{id:'en',name:'English'},{id:'pt-BR',name:'Português (Brasil)'},{id:'ja',name:'日本語'}];
let choice:Language='auto';
let storage:Pick<Storage,'getItem'|'setItem'>|undefined;
let browserLanguage='en';
const listeners=new Set<()=>void>();
const emit=()=>listeners.forEach(fn=>fn());
export function validLanguage(value:unknown):value is Language{return languages.some(l=>l.id===value);}
export function resolveLanguage(value:Language,system=browserLanguage):Exclude<Language,'auto'>{if(value!=='auto')return value;return /^pt(?:-|$)/i.test(system)?'pt-BR':/^ja(?:-|$)/i.test(system)?'ja':'en';}
export function initializeLanguage(target:typeof storage,system='en'){
 storage=target;browserLanguage=system;try{const raw=target?.getItem(LANGUAGE_KEY);choice=validLanguage(raw)?raw:'auto';}catch{choice='auto';}emit();
}
export function setLanguage(value:Language):boolean{
 if(!validLanguage(value))return false;
 choice=value;let saved=false;try{if(storage){storage.setItem(LANGUAGE_KEY,value);saved=true;}}catch{}emit();return saved;
}
export function getLanguage(){return choice;}
export function translate(text:string,language=resolveLanguage(choice)):string{
 if(language==='en')return text;
 const entry=(catalog as Record<string,Partial<Record<Exclude<Language,'auto'>,string>>>)[text];
 if(entry?.[language])return entry[language]!;
 // Composite settings labels contain fixed captions separated by this delimiter.
 if(text.includes(' · '))return text.split(' · ').map(part=>translate(part,language)).join(' · ');
 if(text.includes(': '))return text.split(': ').map(part=>translate(part,language)).join(': ');
 return text;
}
const subscribe=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export function useLanguage(){return useSyncExternalStore(subscribe,()=>choice+':'+resolveLanguage(choice),()=> 'auto:en');}
export function T({text}:{text:string}){useLanguage();return <>{translate(text)}</>;}
