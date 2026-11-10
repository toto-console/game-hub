import {it,expect,vi,afterEach} from 'vitest';
import {readFileSync} from 'node:fs';
const connect=new Function(readFileSync('store-theme/activity-navigation.js','utf8')+';return connectActivityNavigation;')();
let stop=()=>{};
afterEach(()=>{stop();document.body.innerHTML='';vi.restoreAllMocks();});
function fixture(){
 document.body.innerHTML='<div class="responsive_page_template_content"><a href="#game">Game</a><div onclick="" class="blotter_screenshot_gallery_image">Picture</div><button>Comment</button><input></div>';
 const items=Array.from(document.querySelectorAll<HTMLElement>('a,.blotter_screenshot_gallery_image,button,input'));
 items.forEach((el,i)=>{const rect={left:20,top:40+i*160,width:120,height:100,right:140,bottom:140+i*160} as DOMRect;el.getClientRects=()=>[rect] as unknown as DOMRectList;el.getBoundingClientRect=()=>rect;el.scrollIntoView=vi.fn();});
 stop=connect(document,()=>true);return items;
}
function dir(n:number){const e=new CustomEvent('vgp_ondirection',{bubbles:true,cancelable:true,detail:{button:n}});(document.activeElement||document.body).dispatchEvent(e);return e;}
it('moves Steam controller focus down through games/pictures/actions and back up, scrolling each target',()=>{const [game,picture,button]=fixture();dir(10);expect(document.activeElement).toBe(game);dir(10);expect(document.activeElement).toBe(picture);dir(10);expect(document.activeElement).toBe(button);dir(9);expect(document.activeElement).toBe(picture);expect(picture.scrollIntoView).toHaveBeenCalledTimes(2);dir(9);dir(9);expect(document.activeElement).toBe(game);});
it('A activates exactly once, B stays native, disposal restores temporary attributes',()=>{const [,picture]=fixture();dir(10);dir(10);const click=vi.fn();picture.onclick=click;picture.dispatchEvent(new CustomEvent('vgp_onok',{bubbles:true,cancelable:true}));expect(click).toHaveBeenCalledOnce();const b=new CustomEvent('vgp_oncancel',{bubbles:true,cancelable:true});picture.dispatchEvent(b);expect(b.defaultPrevented).toBe(false);stop();expect(picture.hasAttribute('tabindex')).toBe(false);expect(picture.classList.contains('gh-activity-focus')).toBe(false);expect(dir(9).defaultPrevented).toBe(false);});
it('leaves text editing and visible dialogs to Steam',()=>{const items=fixture();items[3].focus();expect(dir(10).defaultPrevented).toBe(false);items[0].focus();items[2].setAttribute('role','dialog');expect(dir(10).defaultPrevented).toBe(false);});
it('re-queries newly loaded feed items rather than holding a stale list',()=>{const items=fixture();dir(10);items[1].remove();dir(10);expect(document.activeElement).toBe(items[2]);});
