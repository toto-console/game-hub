import {expect,it,vi} from 'vitest';
import {revealSocialCard} from '../src/social-card-style';
it('does not measure or scroll a row that already fits',()=>{
 const row=document.createElement('div');row.className='gcc-card-row';const card=document.createElement('button');row.append(card);Object.defineProperties(row,{clientWidth:{value:1600},scrollWidth:{value:1600}});const measure=vi.spyOn(card,'getBoundingClientRect');row.scrollBy=vi.fn();revealSocialCard(card,true);expect(measure).not.toHaveBeenCalled();expect(row.scrollBy).not.toHaveBeenCalled();
});
it('scrolls only the overflowing row by the necessary amount',()=>{
 const row=document.createElement('div');row.className='gcc-card-row';const card=document.createElement('button');row.append(card);Object.defineProperties(row,{clientWidth:{value:700},scrollWidth:{value:950}});row.scrollBy=vi.fn();vi.spyOn(row,'getBoundingClientRect').mockReturnValue({left:80,right:780} as DOMRect);vi.spyOn(card,'getBoundingClientRect').mockReturnValue({left:800,right:1030} as DOMRect);revealSocialCard(card,false);expect(row.scrollBy).toHaveBeenCalledWith({left:250,behavior:'auto'});
});
