import type {PlayerActions} from './player-actions';
import type {SteamGroupAdapter} from './groups';
import type {SteamVoiceAdapter} from './voice';
import type {MessagesBridge} from './messages';

export type Friend = { id: string; name: string; state: 'playing' | 'online' | 'away' | 'offline'; game?: string; avatar?: string };

export type Snapshot = { kind: 'ready' | 'unavailable' | 'loading'; friends: Friend[]; detail: string };

export interface SocialBridge {

  playerSearch?:ReturnType<typeof import('./player-search').createPlayerSearch>;
  friendManagement?:import('./friend-management').FriendManagement;
  searchPlayersNative?:(query:string)=>void;
  messages?:MessagesBridge;
  voice?:SteamVoiceAdapter;
  groups?:SteamGroupAdapter;
  playerActions?:PlayerActions;

  readFriends(): Snapshot;

  openNative(): void;
  openFriendChat?(id:string):void;
  openVoiceSettings?():void;

  openProfile(id: string): void;

}

export const rank = { playing: 0, online: 1, away: 2, offline: 3 };

export function sortFriends(friends: Friend[]): Friend[] {

  return [...friends].sort((a, b) => rank[a.state] - rank[b.state] || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

}

export function safeAvatar(value: unknown): string | undefined {

  if (typeof value !== 'string') return;

  try {

    const url = new URL(value);

    if (url.protocol === 'https:' && ['avatars.steamstatic.com', 'avatars.akamai.steamstatic.com', 'avatars.cloudflare.steamstatic.com'].includes(url.hostname) && !url.username && !url.password) return url.href;

  } catch { /* Invalid or changed avatar schema: initials remain available. */ }

}

const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object';

const unavailable = (): Snapshot => ({kind:'unavailable',friends:[],detail:'Steam friends are unavailable here. Open native chat, or retry after Steam connects.'});

/** Experimental read-only contract observed in the installed steamui/sp.js.

 * No getters that fetch persona data are read until is_ready is true. No RPCs,

 * credentials, message histories, voice mutations, or DOM discovery. */

export function readSteamFriends(host: unknown): Snapshot {

  try {

    if (!record(host) || !record(host.friendStore)) return unavailable();

    const app=host.g_FriendsUIApp as {CMInterface?:{logged_on?:boolean}}|undefined;
    if(app?.CMInterface?.logged_on===false)return unavailable();
    const raw = host.friendStore.allFriends;

    if (!Array.isArray(raw) || raw.length > 10000) return unavailable();

    const friends: Friend[] = [];

    const seen = new Set<string>();

    let pending = 0;

    for (const item of raw) {

      if (!record(item) || item.is_ready !== true) { pending++; continue; }

      const p = item.persona;

      if (!record(p) || typeof item.steamid64 !== 'string' || !/^7656119\d{10}$/.test(item.steamid64) ||

        typeof p.m_strPlayerName !== 'string' || !p.m_strPlayerName.trim() ||

        typeof p.is_online !== 'boolean' || typeof p.is_ingame !== 'boolean' || typeof p.is_awayOrSnooze !== 'boolean') return unavailable();

      if (seen.has(item.steamid64)) continue;

      seen.add(item.steamid64);

      let game:string|undefined;
      if(p.is_online&&p.is_ingame){
        try {const title=typeof p.GetCurrentGameName==='function'?p.GetCurrentGameName():p.m_strGameExtraInfo;if(typeof title==='string'&&title.trim())game=title.trim().slice(0,160);}catch {/* Preserve presence when app metadata is unavailable. */}
        if(!game&&typeof p.m_strGameExtraInfo==='string'&&p.m_strGameExtraInfo.trim())game=p.m_strGameExtraInfo.trim().slice(0,160);
      }

      friends.push({id:item.steamid64,name:p.m_strPlayerName.slice(0,100),

        state: !p.is_online || p.m_ePersonaState===7 ? 'offline' : p.is_ingame ? 'playing' : p.is_awayOrSnooze ? 'away' : 'online',

        game,

        avatar:safeAvatar(p.avatar_url_medium)});

    }

    // An empty store is not proof that an account has no friends or is connected.

    if (!friends.length) return {kind:'loading',friends:[],detail:pending ? 'Waiting for Steam to load friend profiles.' : 'No loaded friends yet. Check your connection in native Steam chat.'};

    return {kind:'ready',friends:sortFriends(friends),detail:pending ? `${pending} profiles still loading` : 'Read from Steam · experimental'};

  } catch { return unavailable(); }

}

