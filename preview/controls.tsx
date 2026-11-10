import type { Controls } from '../src/Panel';

// Browser-only stand-ins. The installable bundle uses Decky's own controls.

export const browserControls:Controls={

  Input:({value,onChange,onConfirm,label,placeholder,disabled})=><input className="gbs-text-input" aria-label={label} placeholder={placeholder} value={value} disabled={disabled} onChange={e=>onChange(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&onConfirm){e.preventDefault();onConfirm();}}}/>,

  Button:({children,...props})=><button type="button" {...props}>{children}</button>,

  Group:({children,className,horizontal})=><div className={className} data-preview-flow={horizontal?'row':'column'}>{children}</div>

};

