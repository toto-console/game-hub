import {useState} from 'react';
import {MdSportsEsports} from 'react-icons/md';
import type {Game} from './game-adapter';
export function SwitcherArtwork({game}:{game:Game}){
 const urls=[...new Set([...(game.artwork??[]),...(game.icon?[game.icon]:[])])];
 return <Artwork key={`${game.id}:${JSON.stringify(urls)}`} urls={urls}/>;
}
function Artwork({urls}:{urls:string[]}){
 const [index,setIndex]=useState(0);
 return index<urls.length?<img src={urls[index]} alt="" decoding="async" onError={()=>setIndex(i=>i+1)}/>:<span className="gs-art-fallback" aria-hidden="true"><MdSportsEsports/></span>;
}
