import type {WelcomeSettings} from './welcome-layout';
import {heroUrls,type App} from './upstream/steam';
import {welcomeCSS} from './welcome-style';

export function WelcomeBackground({settings,app,home=false,hidden=false}:{settings:WelcomeSettings;app?:App;home?:boolean;hidden?:boolean}){
 const bg=settings.background==='local'?settings.image:settings.background==='game'&&app?heroUrls(app)[0]:undefined;
 return <><style>{welcomeCSS}</style><div hidden={hidden} className={`ghw-background ${home?'ghw-home-background':''} ${settings.background==='existing'?'ghw-existing':''}`} aria-hidden="true">{bg?<img src={bg} alt=""/>:<div className="ghw-sculpture"><i/><b/><em/></div>}</div></>;
}
