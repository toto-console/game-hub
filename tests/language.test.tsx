import React from 'react';
import {afterEach,it,expect,vi} from 'vitest';
import {render,fireEvent,cleanup,act} from '@testing-library/react';
import {T,LANGUAGE_KEY,initializeLanguage,setLanguage,getLanguage,resolveLanguage,translate} from '../src/i18n';
import {LanguageSettings} from '../src/LanguageSettings';
import {t} from '../src/home/upstream/i18n';
import type {Controls} from '../src/Panel';
const controls={Button:({children,...props}:any)=><button {...props}>{children}</button>,Group:({children}:any)=><div>{children}</div>} as Controls;
afterEach(()=>{cleanup();initializeLanguage(undefined,'en');});
it('persists choices and resolves supported system languages with safe fallback',()=>{
 const data=new Map<string,string>();const storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)};
 initializeLanguage(storage,'pt-PT');expect(resolveLanguage(getLanguage())).toBe('pt-BR');expect(setLanguage('ja')).toBe(true);expect(data.get(LANGUAGE_KEY)).toBe('ja');initializeLanguage(storage,'en');expect(translate('Settings')).toBe('設定');expect(t.settings).toBe('設定');
 data.set(LANGUAGE_KEY,'bad');initializeLanguage(storage,'xx-XX');expect(resolveLanguage(getLanguage())).toBe('en');
});
it('changes visible text without replacing the focused language button',()=>{
 initializeLanguage(localStorage,'en');const v=render(<><LanguageSettings controls={controls}/><T text="Friends"/></>);
 const japanese=v.getByRole('button',{name:'日本語'});japanese.focus();fireEvent.click(japanese);
 expect(v.getByText('フレンド')).toBeTruthy();expect(document.activeElement).toBe(japanese);expect(japanese.getAttribute('aria-pressed')).toBe('true');
 fireEvent.click(v.getByRole('button',{name:'Português (Brasil)'}));expect(v.getByText('Amigos')).toBeTruthy();expect(t.settings).toBe('Configurações');localStorage.clear();
});
it('reports failed persistence and keeps untranslated content intact',()=>{
 initializeLanguage({getItem:()=>null,setItem:()=>{throw Error('unavailable');}},'en');const v=render(<LanguageSettings controls={controls}/>);fireEvent.click(v.getByRole('button',{name:'日本語'}));expect(v.getByRole('status')).toBeTruthy();expect(translate('Unmapped technical message')).toBe('Unmapped technical message');
});

it('supports Spanish, French and German in settings and automatic selection',()=>{
 for(const [id,name,label] of [['es','Español','Amigos'],['fr','Français','Amis'],['de','Deutsch','Freunde']] as const){
  initializeLanguage(localStorage,'en');const v=render(<><LanguageSettings controls={controls}/><T text="Friends"/></>);
  fireEvent.click(v.getByRole('button',{name}));expect(getLanguage()).toBe(id);expect(v.getByText(label)).toBeTruthy();expect(resolveLanguage('auto',id+'-XX')).toBe(id);cleanup();
 }localStorage.clear();
});
