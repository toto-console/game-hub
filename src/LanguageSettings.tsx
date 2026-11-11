import {useState} from 'react';
import type {Controls} from './Panel';
import {T,getLanguage,languages,setLanguage,useLanguage} from './i18n';
export function LanguageSettings({controls}:{controls:Pick<Controls,'Button'|'Group'>}){
 useLanguage();const {Button,Group}=controls;const [failed,setFailed]=useState(false);
 return <section className="gh-language-settings"><h3><T text="Language"/></h3><Group className="gcc-vertical-list">{languages.map(language=><Button key={language.id} className="gcc-utility gcc-setting-row gbs-button" aria-pressed={getLanguage()===language.id} onClick={()=>setFailed(!setLanguage(language.id))}><T text={language.name}/>{getLanguage()===language.id?' ✓':''}</Button>)}</Group><p><T text="Changes apply immediately to Game Hub. Steam and game languages are unchanged."/></p>{failed&&<p role="status"><T text="Could not save language. It applies for this session only."/></p>}</section>;
}
