import {Focusable} from '@decky/ui';
import {playSound,soundRevision} from '../native-navigation-audio';
import type {ComponentProps} from 'react';

export function StoreAction(props:ComponentProps<typeof Focusable>){
 return <Focusable {...props} onActivate={event=>{
  if(props['aria-disabled']===true||props['aria-disabled']==='true')return;
  const before=soundRevision;
  props.onActivate?.(event);
  if(before===soundRevision)playSound('DefaultOk');
 }}/>;
}
