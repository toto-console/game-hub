import {afterEach,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
const script=['scroll-engine','profile'].map(name=>readFileSync('store-theme/'+name+'.js','utf8')).join('\n');
const url='https://steamcommunity.com/id/example';
const fixture=`<div class="responsive_page_template_content"><div class="profile_page"><div class="profile_animated_background"><video poster="https://shared.fastly.steamstatic.com/background.jpg"></video></div><div class="profile_header_bg"><div class="profile_header_content"><div class="playerAvatar online"><img src="avatar.jpg"></div><div class="profile_header_centered_col"><span class="actual_persona_name">Example Player</span><div class="header_real_name">Canada</div></div><a class="persona_level_btn" href="${url}/badges">Level 7</a><div class="profile_header_actions"><a href="steam://friends/message/76561190000000000">Message</a></div></div></div><div class="profile_content"><div class="responsive_status_info">Online</div><div class="profile_badges"><a href="${url}/badges">Badges 2</a></div><div class="profile_friend_links"><span class="profile_count_link_total">10</span><div class="profile_topfriends">${[1,2,3,4].map(n=>`<div class="friendBlock"><a href="${url}/friends/${n}">Friend ${n}</a></div>`).join('')}</div></div><div class="profile_group_links"><a href="${url}/groups">Groups 1</a></div><div class="recent_games">${[1,2].map(n=>`<div class="recent_game"><div class="game_info"><div class="game_info_cap"><a href="https://steamcommunity.com/app/${n}"><img class="game_capsule" src="original-${n}.jpg"></a></div><div class="game_name">Real Game ${n}</div><div class="game_info_details">12 hrs on record</div></div><div class="game_info_stats"><div class="game_info_achievement_summary"><a href="${url}/achievements/${n}">${n} / 5 Achievements</a></div></div></div>`).join('')}</div><div class="profile_comment_area">Original comments</div></div></div></div>`;
let active:any;
function setup(fetcher:any=vi.fn().mockResolvedValue({ok:false}),navigation:any=vi.fn(()=>vi.fn())){
 document.documentElement.className='GamepadMode';document.body.innerHTML=fixture;
 const original=document.body.innerHTML,history={pushState:vi.fn(),replaceState:vi.fn()},location={href:url};
 const w={addEventListener:vi.fn(),removeEventListener:vi.fn(),__gameHubStoreAppearance:undefined as any,__gameHubStoreOriginalURL:undefined as any};
 const api=new Function('window','document','history','location','connectActivityNavigation','connectFocusGloss','fetch',script+';return {install:installGameHubProfile,allowed:isGameHubProfileURL};')(w,document,history,location,navigation,vi.fn(()=>vi.fn()),fetcher);
 active=w;return {...api,w,history,original,navigation,fetcher};
}
afterEach(()=>{active?.__gameHubStoreAppearance?.dispose();document.head.innerHTML='';document.body.innerHTML='';vi.restoreAllMocks();});
it('reuses real profile nodes, background, actions and achievement links without invented data',()=>{
 const x=setup(),avatar=document.querySelector('.playerAvatar'),video=document.querySelector('video'),message=document.querySelector('.profile_header_actions a')!,clicked=vi.fn((e:Event)=>e.preventDefault());message.addEventListener('click',clicked);
 expect(x.install({enabled:true},'').applied).toBe(true);expect(document.querySelector('.ghp-hero .playerAvatar')).toBe(avatar);expect(document.querySelector('.ghp-tabs .profile_header_actions a')).toBe(message);expect(document.querySelector('video')).toBe(video);(message as HTMLElement).click();expect(clicked).toHaveBeenCalledOnce();
 expect(document.querySelector('.ghp-shell')!.textContent).toContain('Example Player');expect(document.querySelector('.ghp-shell')!.textContent).not.toMatch(/Japan|ROB RUN|250 XP|Level 20/);
 expect(document.querySelector('.ghp-percentage')!.textContent).toBe('20%');expect(document.querySelectorAll('.ghp-tab')).toHaveLength(7);expect(JSON.parse(document.querySelector('.ghp-tab')!.getAttribute('data-panel')!)).toEqual({focusable:true,noFocusRing:true});
});
it('restores the original DOM and attributes without duplicate friends badges after repeated installs',()=>{
 const x=setup();for(let i=0;i<2;i++){x.install({enabled:true},'');expect(document.querySelectorAll('.ghp-friend-more')).toHaveLength(1);x.w.__gameHubStoreAppearance.dispose();expect(document.body.innerHTML).toBe(x.original);}
 expect(document.querySelector('#game-hub-profile-theme')).toBeNull();
});
it('reuses a live installation and changes selected-game achievement progress on focus',()=>{
 const x=setup();x.install({enabled:true},'');const first=document.querySelector('.ghp-shell');x.install({enabled:true},'x');expect(document.querySelector('.ghp-shell')).toBe(first);expect(x.navigation).toHaveBeenCalledOnce();
 document.querySelectorAll('.recent_game')[1].dispatchEvent(new Event('focusin',{bubbles:true}));expect(document.querySelector('.ghp-percentage')!.textContent).toBe('40%');expect(document.querySelector('.ghp-achievement-title small')!.textContent).toBe('Real Game 2');
});
it('reuses the native level link without fetching a separate XP card',()=>{const x=setup(),native=document.querySelector('.persona_level_btn');x.install({enabled:true},'');expect(document.querySelector('.ghp-name-level')).toBe(native);expect(document.querySelector('.ghp-name-level')?.getAttribute('href')).toBe(url+'/badges');expect(document.querySelector('.ghp-level')).toBeNull();expect(x.fetcher).not.toHaveBeenCalled();});
it('rejects account edits, login, external domains and unrecognized/private layouts',()=>{
 const x=setup();for(const u of [url+'/edit',url+'/inventory',url+'?token=x','https://steamcommunity.com.evil.test/id/example','https://steamcommunity.com/login/'])expect(x.allowed(u)).toBe(false);
 expect(x.allowed(url+'?insideModal=0')).toBe(true);document.body.innerHTML='<div>Private profile</div>';expect(x.install({enabled:true},'').applied).toBe(false);expect(document.body.textContent).toBe('Private profile');
});
it('restores before leaving to protected routes and tolerates harmless URL normalization',()=>{
 const x=setup();x.install({enabled:true},'');x.history.replaceState({},'',url+'/?insideModal=0');expect(document.querySelector('.ghp-shell')).not.toBeNull();x.history.pushState({},'',url+'/edit');expect(document.body.innerHTML).toBe(x.original);
});
it('fails back to native without leaving half a layout when navigation integration fails',()=>{
 const x=setup(undefined,()=>{throw Error('unsupported');});expect(x.install({enabled:true},'').applied).toBe(false);expect(document.body.innerHTML).toBe(x.original);expect(document.documentElement.dataset.ghProfile).toBeUndefined();
});

it('keeps overview cards and places the level beside the name and retains Steam comments and secondary sections',()=>{const x=setup();x.install({enabled:true,motion:false,gloss:false},'');expect(Array.from(document.querySelectorAll('.ghp-stats>.ghp-stat')).map(n=>n.className)).toEqual(['ghp-stat ghp-trophy-overview','ghp-stat ghp-awards','ghp-stat ghp-collection','ghp-stat ghp-friends']);expect(document.querySelector('.actual_persona_name')?.nextElementSibling?.classList.contains('ghp-name-level')).toBe(true);expect(document.querySelector('.ghp-secondary .ghp-groups')).not.toBeNull();expect(document.querySelector('.ghp-secondary .ghp-inventory')).not.toBeNull();expect(document.querySelector('[data-ghp-remaining]')?.textContent).toContain('Original comments');});

