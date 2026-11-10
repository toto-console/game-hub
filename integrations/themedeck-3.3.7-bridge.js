// Game Hub compatibility extension for the reviewed ThemeDeck Windows 3.3.7 bundle.
// Uses its existing player, assignment cache, media arbitration and launch watchers.
let gameHubLease = null;
let gameHubBlockedUntil = 0;
let gameHubBridgeAPI;
const gameHubContext = () => {
    if (gameHubLease && Date.now() > gameHubLease.expires) {
        gameHubLease = null;
        playInvocationCounter += 1;
        playInFlightSignature = null;
        if (!readAppIdFromLocation()) stopPlayback();
    }
    return gameHubLease;
};
const gameHubFade = async (audio, target, invocation) => {
    const start = audio.volume, begun = Date.now();
    while (Date.now() - begun < 400) {
        if (invocation !== playInvocationCounter || pluginDisposed) return false;
        audio.volume = clamp(start + (target - start) * Math.min(1, (Date.now() - begun) / 400));
        await new Promise(resolve => window.setTimeout(resolve, 20));
    }
    if (invocation !== playInvocationCounter || pluginDisposed) return false;
    audio.volume = clamp(target);
    return true;
};
const gameHubTracksUpdated = async () => {
    if (!gameHubContext()) return;
    const id = playbackState.appId;
    const previous = latestTracksForAutoPlay[id];
    await refreshAutoPlaybackTrackCache();
    if (pluginDisposed || !gameHubContext() || playbackState.appId !== id) return;
    const next = latestTracksForAutoPlay[id];
    if (id > 0 && previous?.path !== next?.path) stopPlayback();
    else if (next) { applyVolumeToActiveTrack(id, next.volume); applyLoopToActiveTrack(id, next.loop); }
    scheduleAutoPlaybackFromContext();
};
const startGameHubBridge = () => {
    gameHubLease = null;
    gameHubBlockedUntil = 0;
    window.addEventListener(TRACKS_UPDATED_EVENT, gameHubTracksUpdated);
    gameHubBridgeAPI = Object.freeze({
        apiVersion: 1, pluginVersion: '3.3.7', platform: 'windows',
        claim(owner) {
            if (typeof owner !== 'string' || !owner.startsWith('game-hub:') || pluginDisposed) return false;
            const active = gameHubContext();
            if (active && active.owner !== owner) return false;
            if (!active) gameHubLease = {owner, appId: null, pending: true, smooth: true, expires: Date.now() + 6500};
            return true;
        },
        heartbeat(owner) { if (gameHubLease?.owner === owner) gameHubLease.expires = Date.now() + 6500; },
        pending(owner) {
            if (gameHubLease?.owner !== owner) return;
            gameHubLease.pending = true;
            playInvocationCounter += 1;
            playInFlightSignature = null;
        },
        silence(owner) {
            if (gameHubLease?.owner !== owner) return;
            gameHubLease.silent = true;
            gameHubLease.pending = false;
            gameHubLease.appId = null;
            playInvocationCounter += 1;
            playInFlightSignature = null;
            stopPlayback();
        },
        select(owner, appId, smooth) {
            if (gameHubLease?.owner !== owner || !(appId === null || Number.isSafeInteger(appId) && appId > 0 && appId <= 4294967295)) return false;
            gameHubLease.silent = false;
            gameHubLease.appId = appId;
            gameHubLease.smooth = smooth === true;
            gameHubLease.pending = false;
            gameHubLease.expires = Date.now() + 6500;
            if (playbackState.appId === appId && playbackState.status === "playing" && sharedAudio && latestTracksForAutoPlay[appId]) {
                void gameHubFade(sharedAudio, getEffectiveTrackVolume(appId, latestTracksForAutoPlay[appId].volume), playInvocationCounter);
            }
            scheduleAutoPlaybackFromContext();
            return true;
        },
        release(owner) {
            if (gameHubLease?.owner !== owner) return;
            const id = gameHubLease.appId;
            gameHubLease = null;
            playInvocationCounter += 1;
            playInFlightSignature = null;
            if (playbackState.appId === id && readAppIdFromLocation() !== id) stopPlayback();
            scheduleAutoPlaybackFromContext();
        },
        beforeLaunch() {
            gameHubBlockedUntil = Date.now() + 15000;
            stopPlayback();
        },
        settings() { return {autoPlay: readAutoPlaySetting(), volume: readGameTrackMasterVolumeSetting()}; },
        setAutoPlay(value) { persistAutoPlaySetting(value === true); },
        setVolume(value) { if (Number.isFinite(value)) persistGameTrackMasterVolumeSetting(clamp(value)); },
        async preview(appId) {
            const track = latestTracksForAutoPlay[appId];
            if (!track || runningGameAppId !== null || launchActivityAppId !== null || externalMediaActive) return false;
            await playTrack(track, 'manual');
            return playbackState.appId === appId && playbackState.status === 'playing';
        },
        stopPreview(appId) { if (playbackState.reason === 'manual' && playbackState.appId === appId) stopPlayback(); },
    });
    window.__gameHubThemeDeckV1 = gameHubBridgeAPI;
};
const stopGameHubBridge = () => {
    window.removeEventListener(TRACKS_UPDATED_EVENT, gameHubTracksUpdated);
    gameHubLease = null;
    gameHubBlockedUntil = 0;
    if (window.__gameHubThemeDeckV1 === gameHubBridgeAPI) delete window.__gameHubThemeDeckV1;
};
