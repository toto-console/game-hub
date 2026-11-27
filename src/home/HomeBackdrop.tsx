import type {ReactNode} from 'react';
import {homeSequence} from './console-motion';
import {useEffect,useRef} from 'react';
import {motionAllowed} from '../focus-motion';
import {heroUrls,landscapeUrls,logoUrls,type App} from './upstream/steam';

const cache=new Map<string,HTMLImageElement>();
const loading=new Map<string,Promise<HTMLImageElement|undefined>>();
export function prepareHomeArt(app:App,logo=false){
 const urls=[...new Set(logo?logoUrls(app):[...heroUrls(app),...landscapeUrls(app)])],key=urls.join('|');
 const ready=cache.get(key);
 if(ready){cache.delete(key);cache.set(key,ready);return Promise.resolve(ready);}
 const queued=loading.get(key);
 if(queued)return queued;
 const request=(async()=>{
  for(const url of urls){
   const image=new Image();image.decoding='async';image.src=url;
   try{await image.decode();}catch{continue;}
   if(!image.naturalWidth)continue;
   if(cache.size>=12)cache.delete(cache.keys().next().value!);
   cache.set(key,image);return image;
  }
 })().finally(()=>loading.delete(key));
 loading.set(key,request);return request;
}

export function HomeBackdrop({app,dim,nearby,children,retain=false}:{
 children?:ReactNode;retain?:boolean;app?:App;dim:boolean;nearby:App[];
}){
    const root = useRef<HTMLDivElement>(null);
    const animation = useRef<Animation|null>(null);
    useEffect(() => () => {
        animation.current?.cancel();
        animation.current = null;
    }, []);
    useEffect(() => {
        const el = root.current;
        if (!el || !app)
            return;
        let live = true;
        void prepareHomeArt(app).then(ready => {
            if (!live || !ready)
                return;
            const current = el.lastElementChild as HTMLElement | null;
            if (current?.dataset.wallpaper === ready.src)
                return;
            const old = animation.current;
            if (old) {
                old.commitStyles();
                old.cancel();
                animation.current = null;
            }
            const image = el.ownerDocument.createElement('div');
            image.className = 'ghd-backdrop-wallpaper';
            image.dataset.wallpaper = ready.src;
            image.style.backgroundImage = 'url(' + JSON.stringify(ready.src) + ')';
            if (!el.childElementCount || !motionAllowed(el)) {
                el.replaceChildren(image);
                return;
            }
            // Retain the opaque base. If several selections interrupt, discard the
            // intermediate layer contributing the least to the current blend.
            if (el.children.length >= 4) {
                const layers = Array.from(el.children);
                let transmission = 1, least = Infinity, discard = layers[1];
                for (const layer of layers.slice(1).reverse()) {
                    const alpha = Number(el.ownerDocument.defaultView!.getComputedStyle(layer).opacity);
                    if (alpha * transmission < least) {
                        least = alpha * transmission;
                        discard = layer;
                    }
                    transmission *= 1 - alpha;
                }
                discard.remove();
            }
            el.append(image);
            const fade = image.animate([{ opacity: 0 }, { opacity: 1 }], { duration: homeSequence.dissolve, easing: homeSequence.blend, fill: 'both' });
            animation.current = fade;
            fade.onfinish = () => { if (animation.current === fade) {
                // Keep the displayed layer (and any playing trailer) attached.
                while (image.previousElementSibling) image.previousElementSibling.remove();
                animation.current = null;
                fade.cancel();
            } };
        });
        const i = nearby.findIndex(a => a.appid === app.appid);
        const timer = setTimeout(() => { if (i >= 0)
            for (const next of [nearby[i + 1], nearby[i - 1]])
                if (next) {
                    void prepareHomeArt(next);
                    void prepareHomeArt(next, true);
                } }, 220);
        return () => { live = false; clearTimeout(timer); };
    }, [app, nearby]);
 return <div aria-hidden="true" className={'ghd-backdrop'+(dim?' ghd-dim':'')+(app||retain?'':' ghd-backdrop-empty')}><div className="ghd-backdrop-art" ref={root}/>{children}<div className="ghd-backdrop-shade"/></div>;
}
