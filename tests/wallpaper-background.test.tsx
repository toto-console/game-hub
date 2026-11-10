import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,cleanup} from '@testing-library/react';
vi.mock('../src/home/upstream/steam',()=>({heroUrls:()=>[]}));
import {WelcomeBackground} from '../src/home/WelcomeBackground';
import {defaults} from '../src/home/welcome-layout';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('loops silently and releases video when hidden or Home becomes inactive',()=>{const play=vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();const pause=vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});const settings={...defaults(),background:'local' as const,image:'data:video/webm;base64,YQ=='};const v=render(<WelcomeBackground settings={settings}/>);const video=v.container.querySelector('video')!;expect(video.muted).toBe(true);expect(video.loop).toBe(true);expect(play).toHaveBeenCalled();v.rerender(<WelcomeBackground settings={settings} hidden/>);expect(v.container.querySelector('video')).toBeNull();expect(pause).toHaveBeenCalled();v.rerender(<WelcomeBackground settings={settings} active={false}/>);expect(v.container.querySelector('video')).toBeNull();});
it('does not autoplay with wallpaper animation off or reduced motion enabled',()=>{const play=vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});const settings={...defaults(),background:'local' as const,image:'data:video/mp4;base64,YQ==',animateWallpaper:false};const v=render(<WelcomeBackground settings={settings}/>);expect(play).not.toHaveBeenCalled();v.rerender(<WelcomeBackground settings={{...settings,animateWallpaper:true,reducedMotion:true}}/>);expect(play).not.toHaveBeenCalled();});
