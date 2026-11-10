export const wallpaperAccept='.png,.jpg,.jpeg,.gif,.webp,.apng,.mp4,.webm,.ogv';
const types:Record<string,string>={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',apng:'image/apng',mp4:'video/mp4',webm:'video/webm',ogv:'video/ogg'};
export function wallpaperType(file:Pick<File,'name'|'size'|'type'>){
 if(file.size>5_000_000||file.size===0)throw Error('Choose a wallpaper under 5 MB. Short looping clips work best.');
 const type=types[file.name.split('.').pop()?.toLowerCase()??''];
 if(!type)throw Error('Choose PNG, JPEG, GIF, WebP, APNG, MP4, WebM or Ogg video.');return type;
}
export function validWallpaper(value:unknown):value is string{return typeof value==='string'&&value.length<7_000_000&&/^data:(image\/(png|jpeg|webp|gif|apng)|video\/(mp4|webm|ogg));base64,[A-Za-z0-9+/=]+$/.test(value);}
export async function readWallpaper(file:File):Promise<string>{
 const type=wallpaperType(file),video=type.startsWith('video/');
 const blob=new Blob([file],{type}),url=URL.createObjectURL(blob);
 const media=video?document.createElement('video'):new Image();
 try{await new Promise<void>((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('Wallpaper could not be decoded. Try GIF, MP4 (H.264), or WebM.')),10000);
  const finish=(ok:boolean)=>{clearTimeout(timer);ok?resolve():reject(Error('Steam cannot decode this wallpaper. Try a different format or codec.'));};
  media.onerror=()=>finish(false);
  if(media instanceof HTMLVideoElement){media.muted=true;media.preload='auto';media.onloadeddata=()=>finish(true);}else media.onload=()=>finish(true);
  media.src=url;
 });}finally{media.onload=null;media.onerror=null;if(media instanceof HTMLVideoElement){media.onloadeddata=null;media.pause();media.removeAttribute('src');media.load();}else media.src='';URL.revokeObjectURL(url);}
 return await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('The wallpaper could not be read.'));reader.readAsDataURL(blob);});
}
