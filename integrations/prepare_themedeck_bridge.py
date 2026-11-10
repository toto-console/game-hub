"""Prepare a hash-locked compatibility extension; never edits the installed plugin implicitly."""
from pathlib import Path
import argparse,hashlib
EXPECTED='b62c86b94c446166bb8e765dadda0a5f646c32f08b10305a608da4d8b24147e9'
def patch_bundle(raw: bytes, bridge: str) -> bytes:
 if hashlib.sha256(raw).hexdigest()!=EXPECTED: raise ValueError('Unreviewed ThemeDeck bundle; refusing to patch.')
 s=raw.decode('utf-8')
 def replace(old,new):
  nonlocal s
  if s.count(old)!=1: raise ValueError('ThemeDeck compatibility anchor changed: '+old[:80])
  s=s.replace(old,new)
 replace('var index = definePlugin(() => {',bridge+'\nvar index = definePlugin(() => {')
 replace('    pluginDisposed = false;\n    const unbindAudioUpmix', '    pluginDisposed = false;\n    startGameHubBridge();\n    const unbindAudioUpmix')
 replace('        onDismount() {\n            pluginDisposed = true;', '        onDismount() {\n            stopGameHubBridge();\n            pluginDisposed = true;')
 replace('    const effectiveAppId = getEffectiveDetailRouteAppId();\n    if (effectiveAppId && readAutoPlaySetting())', '    const external = gameHubContext();\n    const effectiveAppId = getEffectiveDetailRouteAppId() || (!external?.pending ? external?.appId : null);\n    if (effectiveAppId && readAutoPlaySetting())')
 replace('const applyAutoPlaybackFromContext = () => {\n', 'const applyAutoPlaybackFromContext = () => {\n    gameHubContext();\n    if (gameHubContext()?.silent) return;\n    if (Date.now() < gameHubBlockedUntil) { if (playbackState.status === "playing") stopPlayback(); return; }\n')
 replace('    const nextTrack = resolveAutoTrackFromContext();', '    if (gameHubContext()?.pending && !readAppIdFromLocation()) return;\n    const nextTrack = resolveAutoTrackFromContext();')
 replace('        if (!sameTrack) {\n            audio.src = nextUrl;\n        }', '        const smooth = reason === "auto" && gameHubContext()?.smooth && !sameTrack;\n        if (smooth && !audio.paused && !await gameHubFade(audio, 0, invocationId)) return;\n        if (invocationId !== playInvocationCounter) return;\n        if (!sameTrack) {\n            audio.src = nextUrl;\n            notifyPlayback({ appId: track.appId, reason, status: "loading" });\n        }')
 replace('        audio.volume = targetVolume;', '        audio.volume = smooth ? 0 : targetVolume;')
 replace('        await audio.play();\n        // Keep the element', '        await audio.play();\n        if (smooth && !await gameHubFade(audio, targetVolume, invocationId)) return;\n        // Keep the element')
 return s.encode('utf-8')
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--output',required=True);a=p.parse_args()
 source=Path(a.input).resolve();dest=Path(a.output).resolve()
 if source==dest: raise ValueError('Output must be a separate review file, not the installed bundle.')
 result=patch_bundle(source.read_bytes(),Path(__file__).with_name('themedeck-3.3.7-bridge.js').read_text(encoding='utf-8-sig'))
 dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(result)
 print('Prepared bridge bundle SHA256: '+hashlib.sha256(result).hexdigest())
