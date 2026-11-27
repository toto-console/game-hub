// Steam notification adapter adapted from Playhub Notifications 1.3.1 (MIT).
// See third_party/playhub-notifications/LICENSE and NOTICE.
import { callable } from '@decky/api';
import { linuxPopupAvailable, showLinuxPopup } from './linux-popup';
const emitWindowsNotification = callable('emit_ps5_notification');
const emitNotification = payload => linuxPopupAvailable() ? showLinuxPopup(payload) : emitWindowsNotification(payload);
const rendererReady = callable('ps5_notifications_ready');
const debugLog = (message) => console.debug('[Game Hub]', message);
const contains = (value, ...parts) => parts.some((part) => value.includes(part));
const CONTROLLER_MARKERS = [
    "controller", "gamepad", "steam input", "steaminput", "steam_input",
    "input device", "input_device", "inputdevice"
];
const SCREENSHOT_MARKERS = ["screenshot", "mediacapture", "media_capture", "screen capture"];
function classifyNotification(strTest, raw) {
    const name = String(strTest || "").toLowerCase();
    if (contains(name, "achievement"))
        return "achievement";
    if (contains(name, "friend message", "group chat", "voice chat"))
        return "message";
    if (contains(name, "invite", "family purchase request", "parental"))
        return "invite";
    if (contains(name, "friend online", "friend in game"))
        return "friend";
    if (contains(name, "download complete", "clip downloaded", "async game"))
        return "download";
    if (contains(name, ...SCREENSHOT_MARKERS, "recording"))
        return "screenshot";
    if (contains(name, ...CONTROLLER_MARKERS))
        return "controller";
    if (contains(name, "failure", "conflict", "warning", "low battery", "timer expired", "moderator"))
        return "warning";
    if (contains(name, "comment", "wishlist", "trade", "gift", "item announcement", "major sale", "playtest"))
        return "community";
    let blob = "";
    try {
        blob = JSON.stringify(raw || {}).toLowerCase();
    }
    catch {
        blob = String(raw || "").toLowerCase();
    }
    if (contains(blob, "achievement_id", "achievement_name"))
        return "achievement";
    // Device/media payloads can also contain a generic `message` field, so match
    // their stronger markers before the broad chat-message fallback.
    if (contains(blob, ...SCREENSHOT_MARKERS))
        return "screenshot";
    if (contains(blob, ...CONTROLLER_MARKERS))
        return "controller";
    if (contains(blob, "chat_group_id", "chat_message", "friend_message"))
        return "message";
    return "system";
}
function getPath(obj, path) {
    let current = obj;
    for (const key of path.split(".")) {
        if (current == null)
            return undefined;
        current = current[key];
    }
    return current;
}
function firstText(obj, paths) {
    for (const path of paths) {
        const value = getPath(obj, path);
        if (typeof value === "string" && value.trim())
            return value.trim();
        if (typeof value === "number" && Number.isFinite(value))
            return String(value);
    }
    return "";
}
function isInternalToken(value) {
    const clean = String(value || "").trim();
    if (!clean)
        return true;
    if (clean.startsWith("#"))
        return true;
    return /(^|\s)#(?:MediaCapture|GameRecording|Controller|SteamInput|Input)/i.test(clean);
}
function firstHumanText(obj, paths) {
    for (const path of paths) {
        const value = getPath(obj, path);
        if (typeof value === "string" && value.trim() && !isInternalToken(value))
            return value.trim();
        if (typeof value === "number" && Number.isFinite(value))
            return String(value);
    }
    return "";
}
function humanString(value) {
    const text = typeof value === "string" ? value.trim() : "";
    return text && !isInternalToken(text) ? text : "";
}
function collectTextCandidates(node, path = "", depth = 0, seen = new WeakSet(), out = []) {
    if (node == null || depth > 4 || out.length >= 80)
        return out;
    if (typeof node === "string") {
        const value = humanString(node);
        if (value && value.length <= 220 && !/^https?:\/\//i.test(value))
            out.push({ path, value });
        return out;
    }
    if (typeof node !== "object")
        return out;
    if (seen.has(node))
        return out;
    seen.add(node);
    if (Array.isArray(node)) {
        for (let i = 0; i < Math.min(node.length, 20); i++)
            collectTextCandidates(node[i], `${path}[${i}]`, depth + 1, seen, out);
        return out;
    }
    let keys = [];
    try {
        keys = Object.keys(node).slice(0, 60);
    }
    catch {
        return out;
    }
    for (const key of keys) {
        const nextPath = path ? `${path}.${key}` : key;
        let value;
        try {
            value = node[key];
        }
        catch {
            continue;
        }
        if (typeof value === "string") {
            const clean = humanString(value);
            if (clean && clean.length <= 220 && !/^https?:\/\//i.test(clean))
                out.push({ path: nextPath, value: clean });
        }
        else if (value && typeof value === "object") {
            collectTextCandidates(value, nextPath, depth + 1, seen, out);
        }
        if (out.length >= 80)
            break;
    }
    return out;
}
function controllerConnectionState(obj, blob) {
    for (const path of ["connected", "is_connected", "bConnected", "controller.connected", "device.connected"]) {
        const value = getPath(obj, path);
        if (typeof value === "boolean")
            return value ? "connected" : "disconnected";
        if (typeof value === "number" && Number.isFinite(value))
            return value ? "connected" : "disconnected";
        if (typeof value === "string") {
            const s = value.trim().toLowerCase();
            if (["true", "1", "yes", "connected", "on", "added"].includes(s))
                return "connected";
            if (["false", "0", "no", "disconnected", "off", "removed"].includes(s))
                return "disconnected";
        }
    }
    for (const path of ["connection_state", "connectionState", "state", "device_state", "event", "action"]) {
        const value = String(getPath(obj, path) ?? "").toLowerCase();
        if (!value)
            continue;
        if (contains(value, "disconnect", "removed", "powered off", "turned off", "unplug"))
            return "disconnected";
        if (contains(value, "connect", "added", "powered on", "turned on", "plugged"))
            return "connected";
    }
    if (/"(?:connected|is_connected|bconnected)"\s*:\s*(?:false|0|"false"|"0")/i.test(blob))
        return "disconnected";
    if (/"(?:connected|is_connected|bconnected)"\s*:\s*(?:true|1|"true"|"1")/i.test(blob))
        return "connected";
    if (contains(blob, "disconnected", "disconnect", "device_removed", "removed", "powered off", "turned off", "unplugged"))
        return "disconnected";
    if (contains(blob, "connected", "device_added", "added", "powered on", "turned on", "plugged in"))
        return "connected";
    return "";
}
function cleanControllerName(value) {
    let out = humanString(value);
    if (!out)
        return "";
    out = out
        .replace(/\b(?:was\s+)?(?:connected|disconnected|added|removed)\b/gi, " ")
        .replace(/\b(?:has\s+been\s+)?(?:connected|disconnected)\b/gi, " ")
        .replace(/\s+/g, " ")
        // I trattini restano scritti come codice unicode: il carattere non compare nei sorgenti.
        .replace(/^[\s:\u2013\u2014-]+|[\s:\u2013\u2014-]+$/g, "")
        .trim();
    if (!out || /^(controller|gamepad|steam input|input device)$/i.test(out))
        return "";
    return out;
}
function findControllerName(obj) {
    const direct = firstHumanText(obj, [
        "controller_name", "controllerName", "device_name", "deviceName", "product_name", "productName",
        "input_device_name", "inputDeviceName", "friendly_name", "friendlyName", "controller.name", "device.name"
    ]);
    if (direct)
        return cleanControllerName(direct);
    const candidates = collectTextCandidates(obj);
    let best = "";
    let bestScore = -999;
    for (const candidate of candidates) {
        const path = candidate.path.toLowerCase();
        const value = candidate.value;
        const lower = value.toLowerCase();
        let score = 0;
        if (/(controller|gamepad|input|device)/.test(path))
            score += 40;
        if (/(name|product|model|label|description|param|arg)/.test(path))
            score += 35;
        if (/(xbox|dualsense|dualshock|steam controller|nintendo|switch|pro controller|8bitdo|gamepad)/i.test(value))
            score += 60;
        if (/(connected|disconnected)/.test(lower))
            score += 20;
        if (/^(connected|disconnected|controller connected|controller disconnected|controller status changed\.?|steam input)$/i.test(value))
            score -= 120;
        if (/(game_name|app_name|title|message)/.test(path) && !/(controller|device|input)/.test(path))
            score -= 25;
        const cleaned = cleanControllerName(value);
        if (!cleaned)
            score -= 100;
        if (score > bestScore && cleaned) {
            bestScore = score;
            best = cleaned;
        }
    }
    return bestScore >= 25 ? best : "";
}
function looksLikeSteamIdentifier(value) {
    const v = String(value || "").trim();
    if (!v)
        return false;
    // Steam friend notifications can surface either SteamID64 or AccountID while
    // the persona cache is warming. Numeric IDs are never valid visible fallbacks.
    return /^\d{1,20}$/.test(v)
        || /^STEAM_[0-5]:[01]:\d+$/i.test(v)
        || /^\[U:1:\d+\]$/i.test(v);
}
function findFriendName(obj) {
    const direct = firstHumanText(obj, [
        "friend_name", "friendName", "persona_name", "personaName", "player_name", "playerName",
        "friend.display_name", "friend.name", "persona.display_name", "persona.name", "sender_name"
    ]);
    if (direct && !looksLikeSteamIdentifier(direct))
        return direct;
    const candidates = collectTextCandidates(obj);
    let best = "";
    let bestScore = -999;
    for (const candidate of candidates) {
        const path = candidate.path.toLowerCase();
        const value = candidate.value.trim();
        if (!value || looksLikeSteamIdentifier(value))
            continue;
        let score = 0;
        if (/(friend|persona|player)/.test(path))
            score += 55;
        if (/(steamid|steam_id|accountid|account_id)/.test(path))
            score -= 220;
        if (/(name|display|nick)/.test(path))
            score += 35;
        if (/(game_name|app_name|game\.name|app\.name)/.test(path))
            score -= 100;
        if (/friend (?:in game|online)|friend status/i.test(value))
            score -= 90;
        if (/\bis (?:now )?playing\b/i.test(value)) {
            const parsed = value.split(/\bis (?:now )?playing\b/i)[0]?.trim();
            if (parsed && !looksLikeSteamIdentifier(parsed))
                return parsed;
        }
        if (value.length > 80)
            score -= 30;
        if (score > bestScore) {
            bestScore = score;
            best = value;
        }
    }
    return bestScore >= 45 ? best : "";
}
function stripMarkup(value) {
    return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function makeDisplayPayload(strTest, data, eventMeta) {
    let raw = data || {};
    let serverBody = {};
    try {
        const body = raw?.item?.body_data;
        if (typeof body === "string" && body.trim())
            serverBody = JSON.parse(body);
    }
    catch { /* keep empty */ }
    const merged = { ...serverBody, ...(raw && typeof raw === "object" ? raw : {}) };
    const kind = classifyNotification(strTest, merged);
    let title = "Steam notification";
    let body = "A new notification arrived.";
    let subtitle = "";
    let image = "";
    if (kind === "achievement") {
        title = firstText(merged, ["name", "display_name", "achievement_name", "title"]) || "Achievement unlocked";
        body = firstText(merged, ["description", "body", "text"]) || "Achievement unlocked";
        subtitle = firstText(merged, ["game_name", "app_name"]);
        image = firstText(merged, [
            "image_url", "imageUrl", "achievement_image_url", "achievementImageUrl", "achievement_icon_url", "unlocked_icon_url",
            "icon_url", "image", "strImage", "achievement.image_url", "achievement.imageUrl", "achievement.icon_url"
        ]);
    }
    else if (kind === "message") {
        title = firstText(merged, ["friend_name", "persona_name", "display_name", "sender_name", "title"]) || "New message";
        body = firstText(merged, ["message", "body", "text", "chat_message"]) || "You received a new Steam message.";
        subtitle = firstText(merged, ["game_name", "group_name"]);
        image = firstText(merged, ["avatar_url", "image_url"]);
    }
    else if (kind === "invite") {
        title = firstText(merged, ["title", "display_name", "game_name"]) || (strTest || "Invitation");
        body = firstText(merged, ["body", "message", "text", "description"]) || "You received a new invitation.";
        subtitle = firstText(merged, ["game_name", "app_name"]);
    }
    else if (kind === "friend") {
        const friendName = findFriendName(merged);
        const gameName = firstHumanText(merged, ["game_name", "app_name", "game.name", "app.name"]);
        image = firstText(merged, ["avatar_url", "avatarUrl", "avatar", "persona.avatar_url", "friend.avatar_url", "image_url"]);
        const friendBlob = `${String(strTest || "")} ${JSON.stringify(merged || {})}`.toLowerCase();
        const playing = Boolean(gameName) || contains(friendBlob, "friend in game", "is playing", "now playing");
        if (friendName && playing) {
            title = `${friendName} is now playing`;
            body = gameName || firstHumanText(merged, ["body", "message", "text"]) || "Playing a game";
        }
        else if (friendName) {
            title = friendName;
            body = firstHumanText(merged, ["body", "message", "text"]) || (contains(friendBlob, "online") ? "Friend is online" : "Friend status changed");
        }
        else {
            title = firstHumanText(merged, ["display_name", "title"]) || (strTest || "Friend status");
            body = gameName || firstHumanText(merged, ["body", "message", "text"]) || (strTest || "Friend status changed");
        }
    }
    else if (kind === "download") {
        title = strTest || "Download complete";
        body = firstText(merged, ["game_name", "app_name", "display_name", "title"]) || "Steam game";
        subtitle = "";
        image = firstText(merged, ["app_icon", "icon_url", "image_url", "game_icon"]);
    }
    else if (kind === "screenshot") {
        const testTitle = humanString(strTest);
        title = testTitle || firstHumanText(merged, ["display_name", "title"]) || "Screenshot saved";
        body = firstHumanText(merged, ["description", "body", "text"]) || "Saved to your Steam screenshots.";
        subtitle = firstHumanText(merged, ["game_name", "app_name"]);
        image = firstText(merged, ["image_url", "screenshot_url"]);
    }
    else if (kind === "controller") {
        let controllerBlob = "";
        try {
            controllerBlob = `${String(strTest || "")} ${JSON.stringify(merged || {})}`.toLowerCase();
        }
        catch {
            controllerBlob = String(strTest || "").toLowerCase();
        }
        const state = controllerConnectionState(merged, controllerBlob);
        const controllerName = findControllerName(merged);
        // Match Steam's native information hierarchy: controller name as the main
        // line, connection state as the secondary line. Do not surface generic
        // internal strings such as "Steam Input" or "Controller status has changed"
        // when the native connected/disconnected payload gives us a real state.
        title = controllerName || "Controller";
        if (state === "connected")
            body = "Controller connected";
        else if (state === "disconnected")
            body = "Controller disconnected";
        else {
            const nativeDetail = firstHumanText(merged, ["controller_message", "status_text", "statusText", "description", "body", "text"]);
            body = nativeDetail && !/(?:controller status (?:has )?changed|steam input)/i.test(nativeDetail)
                ? nativeDetail
                : "Controller status changed";
        }
    }
    else if (kind === "warning") {
        title = strTest || "Attention";
        body = firstText(merged, ["body", "message", "description", "title"]) || "Steam needs your attention.";
    }
    else if (kind === "community") {
        title = firstText(merged, ["title", "display_name", "game_name"]) || (strTest || "Steam Community");
        body = firstText(merged, ["body", "message", "text", "description"]) || "You have a new community notification.";
    }
    else {
        title = strTest || firstText(merged, ["title"]) || "Steam notification";
        body = firstText(merged, ["body", "message", "text", "description", "game_name"]) || "A Steam system notification arrived.";
    }
    return {
        kind,
        steam_type: Number(eventMeta?.eType ?? -1),
        steam_source: Number(eventMeta?.eSource ?? -1),
        steam_test_name: String(strTest || ""),
        steam_notification_id: String(eventMeta?.notificationID ?? eventMeta?.notification_id ?? ""),
        title: stripMarkup(String(title)).slice(0, 140),
        body: stripMarkup(String(body)).slice(0, 260),
        subtitle: stripMarkup(String(subtitle)).slice(0, 140),
        image: String(image || "").slice(0, 2048),
        appid: Number(merged?.appid ?? merged?.appId ?? 0) || 0,
        icon_hash: String(merged?.icon_hash || ""),
        achievement_id: String(merged?.achievement_id ?? merged?.achievementId ?? ""),
        raw: merged
    };
}

const state = { enabled: false, overlayReady: false, interceptionReady: false };
let cleanupFn = null;
let retryTimer = null;
let avatarWarmTimer = null;
const friendAvatarCache = new Map();
/*
  Names that must never be invoked, wherever they turn up.

  Steam's descriptors carry `fnTest`, `fnTray` and `fnShowModal`; calling any of them makes
  the client DO something - inject a notification, rewrite the tray, open a modal. This
  plugin only ever wants to read values, so anything whose name says "do" is refused even
  if a future build puts it on an object we do read from.
*/
const ACTION_KEY_PATTERN = /^(fn|test|show|open|dispatch|send|trigger|invoke|run|start|stop|clear|remove|delete|set|add|load|request)/i;
function directField(data, key) {
    try {
        const member = data?.[key];
        if (typeof member !== "function")
            return member;
        if (member.length !== 0 || ACTION_KEY_PATTERN.test(key))
            return undefined;
        return member.call(data);
    }
    catch {
        return undefined;
    }
}
function directString(data, keys) {
    for (const key of keys) {
        const value = directField(data, key);
        if (typeof value === "string" && value.trim())
            return value.trim();
    }
    return "";
}
function directNumber(data, keys) {
    for (const key of keys) {
        const value = Number(directField(data, key));
        if (Number.isFinite(value) && value > 0)
            return value;
    }
    return 0;
}
function objectify(data) {
    if (data == null)
        return {};
    let out = {};
    try {
        if (typeof data.toObject === "function") {
            const converted = data.toObject();
            if (converted && typeof converted === "object")
                out = { ...converted };
        }
    }
    catch { /* ignore */ }
    if (typeof data === "object" && Object.keys(out).length === 0) {
        try {
            out = JSON.parse(JSON.stringify(data));
        }
        catch { /* ignore */ }
    }
    // Steam's generated protobuf objects expose many notification fields as
    // zero-argument methods (for example achieved() and image_url()).  Copy the
    // known fields explicitly so achievement artwork survives even if toObject()
    // is absent or changes shape in a future SteamUI build.
    const protoFields = [
        "achievement_id", "achievementId", "appid", "appId", "dlc_appid", "name", "description",
        "image_url", "imageUrl", "image", "image_src", "imageSrc", "image_path", "imagePath",
        "achievement_image_url", "achievementImageUrl", "achievement_icon_url", "achievementIconUrl",
        "unlocked_icon_url", "unlockedIconUrl", "unlocked_icon", "unlockedIcon",
        "icon", "icon_url", "iconUrl", "large_icon_url", "largeIconUrl", "thumb_url", "thumbUrl",
        "achieved", "rtime_unlocked", "global_achieved_pct", "game_name", "app_name",
        "friend_name", "persona_name", "display_name", "sender_name", "message",
        "controller_name", "controllerName", "controller_index", "controllerIndex", "controller_type", "controllerType",
        "device_name", "deviceName", "product_name", "productName",
        "input_device", "inputDevice", "input_device_name", "inputDeviceName", "device_type", "deviceType",
        "friendly_name", "friendlyName", "connected", "is_connected", "connection_state", "connectionState",
        "steamid", "steam_id", "steamid64", "friend_steamid", "friendSteamId", "accountid", "account_id",
        "player_name", "playerName", "friendName", "personaName",
        "avatar_url", "avatarUrl", "avatar", "avatar_hash", "avatarHash", "screenshot_url", "media_type", "title", "body", "text"
    ];
    for (const key of protoFields) {
        if (out?.[key] != null && out[key] !== "")
            continue;
        try {
            const value = directField(data, key);
            if (value != null && value !== "")
                out[key] = value;
        }
        catch { /* ignore individual protobuf fields */ }
    }
    if (!out.image_url && out.imageUrl)
        out.image_url = out.imageUrl;
    if (!out.image_url && out.image)
        out.image_url = out.image;
    if (!out.image_url && out.image_src)
        out.image_url = out.image_src;
    if (!out.image_url && out.imagePath)
        out.image_url = out.imagePath;
    if (!out.image_url && out.image_path)
        out.image_url = out.image_path;
    if (!out.image_url && out.achievement_image_url)
        out.image_url = out.achievement_image_url;
    if (!out.image_url && out.achievementImageUrl)
        out.image_url = out.achievementImageUrl;
    if (!out.image_url && out.achievement_icon_url)
        out.image_url = out.achievement_icon_url;
    if (!out.image_url && out.achievementIconUrl)
        out.image_url = out.achievementIconUrl;
    if (!out.image_url && out.unlocked_icon_url)
        out.image_url = out.unlocked_icon_url;
    if (!out.image_url && out.unlockedIconUrl)
        out.image_url = out.unlockedIconUrl;
    if (!out.image_url && out.unlocked_icon)
        out.image_url = out.unlocked_icon;
    if (!out.image_url && out.unlockedIcon)
        out.image_url = out.unlockedIcon;
    if (!out.image_url && out.large_icon_url)
        out.image_url = out.large_icon_url;
    if (!out.image_url && out.largeIconUrl)
        out.image_url = out.largeIconUrl;
    if (!out.image_url && out.thumb_url)
        out.image_url = out.thumb_url;
    if (!out.image_url && out.thumbUrl)
        out.image_url = out.thumbUrl;
    if (!out.image_url && out.icon_url)
        out.image_url = out.icon_url;
    if (!out.image_url && out.iconUrl)
        out.image_url = out.iconUrl;
    if (!out.avatar_url && out.avatarUrl)
        out.avatar_url = out.avatarUrl;
    if (!out.achievement_id && out.achievementId)
        out.achievement_id = out.achievementId;
    if (!out.appid && out.appId)
        out.appid = out.appId;
    return out || {};
}
function imageStringScore(path, value, kind, appIcon) {
    const key = String(path || "").toLowerCase();
    const src = String(value || "").trim();
    let score = 0;
    if (!src)
        return score;
    if (/^data:image\//i.test(src))
        score += 160;
    if (/^https?:\/\//i.test(src) || /^\/\//.test(src))
        score += 80;
    if (/\.(png|jpe?g|webp|bmp|gif)(\?|$)/i.test(src))
        score += 35;
    if (key.includes("image"))
        score += 22;
    if (key.includes("icon"))
        score += 12;
    if (key.includes("url") || key.includes("src"))
        score += 6;
    if (kind === "achievement") {
        if (/(achievement|achiev|unlocked|unlock|trophy)/.test(key))
            score += 120;
        if (key.includes("app_icon") || key.endsWith("icon_url") || key.includes("avatar"))
            score -= 65;
        if (appIcon && src === appIcon)
            score -= 70;
    }
    if ((kind === "message" || kind === "friend") && key.includes("avatar"))
        score += 80;
    return score;
}
function isImageLikeValue(value) {
    if (typeof value !== "string")
        return false;
    const src = value.trim();
    return Boolean(src) && (/^data:image\//i.test(src) ||
        /^https?:\/\//i.test(src) ||
        /^\/\//.test(src) ||
        /^file:\/\//i.test(src) ||
        /\.(png|jpe?g|webp|bmp|gif)(\?|$)/i.test(src));
}
/** A Steam protobuf message, whose zero-argument accessors are pure field reads. */
function isProtobufLike(node) {
    return Boolean(node) && (typeof node.toObject === "function"
        || typeof node.serializeBinary === "function"
        || typeof node.getClassName === "function");
}
const IMAGE_KEY_PATTERN = /(image|icon|avatar|logo|art|capsule|portrait|url|src)/i;
/*
  Reading a property must never DO anything.

  The image search walks the notification and, before 1.2.0, called every zero-argument
  function it met on the way - own properties and prototype methods alike. On a protobuf
  that is harmless (`image_url()` is a field read); on anything else it is a loaded gun,
  and it is the same mistake that made `fnTest()` fire on Steam's descriptors.

  Now a function is only ever called when BOTH are true: the object is a protobuf message,
  and the property name is one that could hold a picture. Everything else is read as data
  or skipped.
*/
function getPropertyValue(node, key) {
    try {
        const member = node?.[key];
        if (typeof member !== "function")
            return member;
        if (member.length !== 0)
            return undefined;
        if (!isProtobufLike(node) || !IMAGE_KEY_PATTERN.test(key))
            return undefined;
        return member.call(node);
    }
    catch {
        return undefined;
    }
}
function collectImageCandidates(node, kind, appIcon, path = "", depth = 0, seen = new WeakSet(), out = []) {
    if (node == null || depth > 5)
        return out;
    if (typeof node === "string") {
        if (isImageLikeValue(node)) {
            out.push({ path, value: node.trim(), score: imageStringScore(path, node, kind, appIcon) });
        }
        return out;
    }
    if (typeof node !== "object")
        return out;
    if (seen.has(node))
        return out;
    seen.add(node);
    const keys = new Set();
    try {
        Object.keys(node).forEach((key) => keys.add(key));
    }
    catch { /* ignore */ }
    try {
        const proto = Object.getPrototypeOf(node);
        if (proto && proto !== Object.prototype) {
            for (const key of Object.getOwnPropertyNames(proto)) {
                if (key && key !== "constructor")
                    keys.add(key);
            }
        }
    }
    catch { /* ignore */ }
    for (const key of keys) {
        const value = getPropertyValue(node, key);
        const nextPath = path ? `${path}.${key}` : key;
        if (isImageLikeValue(value)) {
            out.push({ path: nextPath, value: value.trim(), score: imageStringScore(nextPath, value, kind, appIcon) });
            continue;
        }
        if (value && typeof value === "object") {
            collectImageCandidates(value, kind, appIcon, nextPath, depth + 1, seen, out);
        }
    }
    return out;
}
function inferBestImage(raw, kind) {
    const appIcon = String(raw?.app_icon || raw?.icon_url || "").trim();
    const candidates = collectImageCandidates(raw, kind, appIcon)
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || a.path.length - b.path.length);
    return candidates[0]?.value || "";
}
async function fetchImageDataUrl(url, timeoutMs = 3500) {
    let source = String(url || "").trim();
    if (!source)
        return "";
    if (/^data:image\//i.test(source))
        return source;
    if (/^\/\//.test(source))
        source = `https:${source}`;
    if (!/^https?:\/\//i.test(source))
        return "";
    try {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), timeoutMs);
        const response = await fetch(source, { signal: controller.signal, cache: "force-cache" });
        window.clearTimeout(timer);
        if (!response.ok)
            return "";
        const blob = await response.blob();
        if (!blob.size || blob.size > 2000000)
            return "";
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let binary = "";
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
        }
        return `data:${blob.type || "image/png"};base64,${btoa(binary)}`;
    }
    catch {
        return "";
    }
}
function numberField(obj, keys) {
    for (const key of keys) {
        const value = obj?.[key];
        const n = Number(typeof value === "function" ? value.call(obj) : value);
        if (Number.isFinite(n) && n > 0)
            return n;
    }
    return 0;
}
function getAppOverview(appid) {
    if (!appid)
        return null;
    try {
        const g = globalThis;
        return g.appStore?.GetAppOverviewByAppID?.(appid)
            ?? g.window?.appStore?.GetAppOverviewByAppID?.(appid)
            ?? null;
    }
    catch {
        return null;
    }
}
function enrichSteamApp(raw) {
    const appid = numberField(raw, ["appid", "app_id", "unAppID", "nAppID"]);
    if (!appid)
        return raw;
    const overview = getAppOverview(appid);
    if (!overview)
        return { ...raw, appid };
    const iconHash = String(overview?.icon_hash || "").trim();
    let steamIconUrl = "";
    try {
        const g = globalThis;
        const store = g.appStore ?? g.window?.appStore;
        steamIconUrl = String(store?.GetIconURLForApp?.(overview) || "").trim();
    }
    catch { /* ignore */ }
    const hashIconUrl = iconHash
        ? `https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/${appid}/${iconHash}.jpg`
        : "";
    const appIcon = raw?.app_icon || raw?.icon_url || steamIconUrl || hashIconUrl;
    return {
        ...raw,
        appid,
        game_name: raw?.game_name || overview?.display_name || overview?.localized_name || overview?.name || "",
        app_name: raw?.app_name || overview?.display_name || overview?.localized_name || overview?.name || "",
        // Never replace the achievement's own image_url with the app icon. The native
        // achievement protobuf already carries the exact unlocked achievement artwork.
        image_url: raw?.image_url || "",
        app_icon: appIcon,
        icon_url: raw?.icon_url || appIcon,
        icon_hash: raw?.icon_hash || iconHash,
    };
}
let steamWebpackRequireRef = null;
let steamControllerStoreRef = null;
let steamInputServiceRef = null;
let steamLocalizeRef = null;
let steamFriendStoreRef = null;
function getSteamWebpackRequire() {
    if (steamWebpackRequireRef)
        return steamWebpackRequireRef;
    try {
        const chunks = window?.webpackChunksteamui;
        if (!chunks || typeof chunks.push !== "function")
            return null;
        const chunkId = Math.floor(900000000 + Math.random() * 90000000);
        chunks.push([[chunkId], {}, (req) => { steamWebpackRequireRef = req; }]);
    }
    catch { /* Steam webpack runtime not available yet */ }
    return steamWebpackRequireRef;
}
function getSteamLocalize() {
    if (typeof steamLocalizeRef === "function")
        return steamLocalizeRef;
    const req = getSteamWebpackRequire();
    if (!req)
        return null;
    try {
        // In the supplied SteamUI build, module 46108 exports the same localization
        // function (`we`) that Steam's native controller toast uses for both the
        // controller name and #Notification_ControllerConnected/Disconnected.
        const known = req(46108);
        if (typeof known?.we === "function") {
            steamLocalizeRef = known.we;
            return steamLocalizeRef;
        }
    }
    catch { /* module id can change */ }
    return null;
}
function steamLocalize(value) {
    const raw = String(value || "").trim();
    if (!raw)
        return "";
    if (!raw.startsWith("#"))
        return raw;
    try {
        const fn = getSteamLocalize();
        if (typeof fn === "function") {
            const localized = String(fn(raw) || "").trim();
            if (localized && localized !== raw && !localized.startsWith("#"))
                return localized;
        }
    }
    catch { /* fail open */ }
    return raw;
}
function isSteamIdentifierText(value) {
    const v = String(value || "").trim();
    if (!v)
        return false;
    // Friend notification payloads can expose either the 64-bit SteamID or the
    // shorter 32-bit AccountID. Neither is ever acceptable as a visible name.
    return /^\d{1,20}$/.test(v)
        || /^STEAM_[0-5]:[01]:\d+$/i.test(v)
        || /^\[U:1:\d+\]$/i.test(v);
}
function steamIdToAccountId(value) {
    const raw = String(value || "").trim();
    if (!raw)
        return 0;
    const bracket = raw.match(/^\[U:1:(\d+)\]$/i);
    if (bracket)
        return Number(bracket[1]) || 0;
    if (/^\d{1,10}$/.test(raw))
        return Number(raw) || 0;
    if (/^\d{12,20}$/.test(raw)) {
        try {
            return Number(BigInt(raw) & 0xffffffffn);
        }
        catch {
            return 0;
        }
    }
    return 0;
}
function isSteamFriendStore(candidate) {
    return Boolean(candidate && typeof candidate.GetFriendState === "function");
}
function getSteamFriendStore() {
    if (isSteamFriendStore(steamFriendStoreRef))
        return steamFriendStoreRef;
    try {
        const globalStore = window?.friendStore;
        if (isSteamFriendStore(globalStore)) {
            steamFriendStoreRef = globalStore;
            return steamFriendStoreRef;
        }
    }
    catch { /* ignore */ }
    const req = getSteamWebpackRequire();
    if (!req)
        return null;
    try {
        // Supplied SteamUI: module 48289 exports the same singleton used by the
        // native FriendOnline/FriendInGame toast as O$.
        const known = req(48289);
        if (isSteamFriendStore(known?.O$)) {
            steamFriendStoreRef = known.O$;
            return steamFriendStoreRef;
        }
    }
    catch { /* module ids can change */ }
    try {
        const cache = req.c || {};
        for (const module of Object.values(cache)) {
            const exported = module?.exports;
            const candidates = [exported];
            if (exported && typeof exported === "object") {
                try {
                    candidates.push(...Object.values(exported));
                }
                catch { /* ignore */ }
            }
            for (const candidate of candidates) {
                if (isSteamFriendStore(candidate)) {
                    steamFriendStoreRef = candidate;
                    return steamFriendStoreRef;
                }
            }
        }
    }
    catch { /* ignore */ }
    return null;
}
function friendStateIsNameReady(state) {
    try {
        if (state?.is_ready === true)
            return true;
        if (state?.mutable_persona?.m_bNameInitialized === true)
            return true;
        if (state?.mutable_persona?.m_bInitialized === true && String(state?.mutable_persona?.m_strPlayerName || "").trim())
            return true;
    }
    catch { /* ignore */ }
    return false;
}
function friendNameFromState(state, steamId, accountId) {
    if (!state)
        return "";
    try {
        state?.LoadIfNecessary?.();
    }
    catch { /* ignore */ }
    // Steam's native notification is reactive and waits until FriendState.is_ready.
    // Our toast is one-shot, so never accept the temporary numeric placeholder that
    // may be exposed before the persona name has initialized.
    if (!friendStateIsNameReady(state))
        return "";
    const values = [
        state?.display_name,
        state?.primary_display_name,
        state?.nickname,
        state?.mutable_persona?.m_strPlayerName,
        state?.persona_name,
    ];
    const forbidden = new Set([String(steamId || "").trim(), String(accountId || "").trim()]);
    for (const value of values) {
        const name = String(value || "").trim();
        if (!name || forbidden.has(name) || isSteamIdentifierText(name) || /^friend$/i.test(name))
            continue;
        return name;
    }
    return "";
}
function readFriendStates(accountId, steamId) {
    if (!Number.isFinite(accountId) || accountId <= 0)
        return [];
    const states = [];
    try {
        const store = getSteamFriendStore();
        if (!store)
            return states;
        try {
            states.push(store.GetFriendState?.(accountId));
        }
        catch { /* ignore */ }
        try {
            const all = Array.isArray(store.allFriends) ? store.allFriends : [];
            const match = all.find((friend) => Number(friend?.accountid) === accountId || String(friend?.steamid64 || "") === steamId);
            if (match)
                states.push(match);
        }
        catch { /* ignore */ }
    }
    catch { /* ignore */ }
    return states.filter(Boolean);
}
function readFriendDisplayName(accountId, steamId) {
    for (const state of readFriendStates(accountId, steamId)) {
        const name = friendNameFromState(state, steamId, accountId);
        if (name)
            return name;
    }
    return "";
}
function avatarUrlFromState(state) {
    const values = [
        state?.avatar_url,
        state?.avatarUrl,
        state?.mutable_persona?.m_strAvatarURL,
        state?.persona?.m_strAvatarURL,
    ];
    for (const value of values) {
        const url = String(value || "").trim();
        if (/^https?:\/\//i.test(url) || /^\/\//.test(url))
            return url;
    }
    const hashes = [
        state?.avatar_hash,
        state?.avatarHash,
        state?.mutable_persona?.m_strAvatarHash,
        state?.persona?.m_strAvatarHash,
        state?.m_persona?.m_strAvatarHash,
    ];
    for (const value of hashes) {
        const hash = String(value || "").trim().toLowerCase();
        if (/^[a-f0-9]{40}$/.test(hash) && !/^0+$/.test(hash)) {
            return `https://avatars.fastly.steamstatic.com/${hash}_full.jpg`;
        }
    }
    return "";
}
function readFriendAvatarUrl(accountId, steamId) {
    for (const state of readFriendStates(accountId, steamId)) {
        try {
            state?.LoadIfNecessary?.();
        }
        catch { /* ignore */ }
        const url = avatarUrlFromState(state);
        if (url)
            return url;
    }
    return "";
}
function cacheFriendAvatar(url) {
    const source = String(url || "").trim();
    if (!source)
        return Promise.resolve("");
    const existing = friendAvatarCache.get(source);
    if (existing)
        return existing;
    if (friendAvatarCache.size >= 96) {
        const oldest = friendAvatarCache.keys().next().value;
        if (oldest)
            friendAvatarCache.delete(oldest);
    }
    const pending = fetchImageDataUrl(source, 1200).then((data) => {
        if (!data)
            friendAvatarCache.delete(source);
        return data;
    });
    friendAvatarCache.set(source, pending);
    return pending;
}
function warmFriendAvatars() {
    try {
        const store = getSteamFriendStore();
        const friends = Array.isArray(store?.allFriends) ? store.allFriends : [];
        for (const friend of friends) {
            const url = avatarUrlFromState(friend);
            if (url)
                void cacheFriendAvatar(url);
        }
    }
    catch { /* ignore */ }
}
function scheduleFriendAvatarWarmup() {
    if (avatarWarmTimer != null)
        return;
    avatarWarmTimer = window.setTimeout(() => {
        avatarWarmTimer = null;
        warmFriendAvatars();
    }, 700);
}
async function resolveFriendDisplayNameAsync(steamId) {
    const accountId = steamIdToAccountId(steamId);
    if (!accountId)
        return "";
    const store = getSteamFriendStore();
    try {
        store?.GetFriendState?.(accountId)?.LoadIfNecessary?.();
    }
    catch { /* ignore */ }
    let name = readFriendDisplayName(accountId, steamId);
    if (name)
        return name;
    let loadPromise = null;
    try {
        if (typeof store?.LoadPersonaState === "function") {
            loadPromise = Promise.resolve(store.LoadPersonaState(accountId)).catch(() => null);
        }
    }
    catch { /* ignore */ }
    // Give Steam's persona store time to finish the same name initialization that
    // causes its native React toast to re-render from the ID placeholder to display_name.
    for (const delay of [50, 90, 140, 220, 320, 450]) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        name = readFriendDisplayName(accountId, steamId);
        if (name)
            return name;
    }
    if (loadPromise) {
        try {
            await Promise.race([loadPromise, new Promise((resolve) => setTimeout(resolve, 300))]);
        }
        catch { /* ignore */ }
        name = readFriendDisplayName(accountId, steamId);
        if (name)
            return name;
    }
    return "";
}
function steamControllerStateText(connected) {
    const token = connected ? "#Notification_ControllerConnected" : "#Notification_ControllerDisconnected";
    const localized = steamLocalize(token);
    if (localized && localized !== token && !localized.startsWith("#"))
        return localized;
    return connected ? "Controller connected" : "Controller disconnected";
}
function nativeNotificationClassName(data) {
    return directString(data, ["getClassName"]);
}
function isControllerStore(candidate) {
    return Boolean(candidate
        && typeof candidate.GetController === "function"
        && typeof candidate.GetControllers === "function");
}
function getSteamControllerStore() {
    if (isControllerStore(steamControllerStoreRef))
        return steamControllerStoreRef;
    const req = getSteamWebpackRequire();
    if (!req)
        return null;
    // Current supplied SteamUI exports its controller singleton from module 2064
    // as `sY`. Keep this as a fast path, but do not depend on the module id alone.
    try {
        const known = req(2064);
        if (isControllerStore(known?.sY)) {
            steamControllerStoreRef = known.sY;
            return steamControllerStoreRef;
        }
    }
    catch { /* module ids can change between Steam builds */ }
    // Generic fallback: scan already-loaded webpack exports for the controller
    // store shape. This survives module-id churn without hooking input APIs.
    try {
        const cache = req.c || {};
        for (const module of Object.values(cache)) {
            const exported = module?.exports;
            const candidates = [exported];
            if (exported && typeof exported === "object") {
                try {
                    candidates.push(...Object.values(exported));
                }
                catch { /* ignore */ }
            }
            for (const candidate of candidates) {
                if (isControllerStore(candidate)) {
                    steamControllerStoreRef = candidate;
                    return steamControllerStoreRef;
                }
            }
        }
    }
    catch { /* ignore cache scan failures */ }
    return null;
}
function isSteamInputService(candidate) {
    return Boolean(candidate && typeof candidate.GetControllerList === "function");
}
function getSteamInputService() {
    if (isSteamInputService(steamInputServiceRef))
        return steamInputServiceRef;
    const req = getSteamWebpackRequire();
    if (!req)
        return null;
    try {
        const known = req(22523);
        if (isSteamInputService(known?.f_)) {
            steamInputServiceRef = known.f_;
            return steamInputServiceRef;
        }
    }
    catch { /* module ids can change */ }
    try {
        const cache = req.c || {};
        for (const module of Object.values(cache)) {
            const exported = module?.exports;
            const candidates = [exported];
            if (exported && typeof exported === "object") {
                try {
                    candidates.push(...Object.values(exported));
                }
                catch { /* ignore */ }
            }
            for (const candidate of candidates) {
                if (isSteamInputService(candidate)) {
                    steamInputServiceRef = candidate;
                    return steamInputServiceRef;
                }
            }
        }
    }
    catch { /* ignore */ }
    return null;
}
async function resolveConnectedControllerNameAsync(controllerIndex) {
    // Steam creates the connected toast immediately after updating its controller
    // list. Decky can observe BShowToast a few milliseconds earlier than the native
    // React renderer, so retry the exact same store lookup briefly before falling
    // back to the Steam Input service.
    for (const delay of [0, 60, 140, 260, 450]) {
        if (delay)
            await new Promise((resolve) => setTimeout(resolve, delay));
        const name = resolveConnectedControllerName(controllerIndex);
        if (name)
            return name;
    }
    try {
        const service = getSteamInputService();
        if (!service)
            return "";
        const response = await service.GetControllerList({});
        if (typeof response?.BSuccess === "function" && !response.BSuccess())
            return "";
        const body = typeof response?.Body === "function" ? response.Body() : response?.body;
        const objectified = typeof body?.toObject === "function" ? body.toObject() : body;
        const controllers = Array.isArray(objectified?.controllers) ? objectified.controllers : [];
        const match = controllers.find((entry) => Number(entry?.controller_index ?? entry?.nControllerIndex) === controllerIndex);
        const rawName = String(match?.name || match?.strName || "").trim();
        const name = steamLocalize(rawName);
        return name && !name.startsWith("#") ? name : "";
    }
    catch {
        return "";
    }
}
function resolveConnectedControllerName(controllerIndex) {
    if (!Number.isFinite(controllerIndex) || controllerIndex < 0)
        return "";
    try {
        const store = getSteamControllerStore();
        let controller = store?.GetController?.(controllerIndex);
        if (!controller) {
            const list = store?.GetControllers?.();
            if (Array.isArray(list))
                controller = list.find((entry) => Number(entry?.nControllerIndex ?? entry?.controller_index) === controllerIndex);
        }
        const rawName = String(controller?.strName || controller?.name || "").trim();
        const name = steamLocalize(rawName);
        if (name && !name.startsWith("#"))
            return name;
    }
    catch { /* fail open */ }
    return "";
}
function enrichNativeControllerData(originalData, out) {
    if (!originalData || !out)
        return;
    // Do not infer controller state from user-facing strings. Steam gives us two
    // distinct protobuf classes and its native renderer branches on exactly those:
    // CClientNotificationControllerConnected    -> controller_index()
    // CClientNotificationControllerDisconnected -> controller_type()+controller_name()
    const className = nativeNotificationClassName(originalData);
    const isConnected = className === "CClientNotificationControllerConnected";
    const isDisconnected = className === "CClientNotificationControllerDisconnected";
    try {
        const indexRaw = directField(originalData, "controller_index");
        if (isConnected || (!isDisconnected && indexRaw != null && indexRaw !== "")) {
            const controllerIndex = Number(indexRaw);
            if (Number.isFinite(controllerIndex) && controllerIndex >= 0) {
                out.controller_index = controllerIndex;
                out.connected = true;
                out.controller_event = "connected";
                const resolvedName = resolveConnectedControllerName(controllerIndex);
                if (resolvedName)
                    out.controller_name = resolvedName;
            }
        }
    }
    catch { /* ignore */ }
    try {
        const disconnectedRawName = directString(originalData, ["controller_name", "controllerName"]);
        if (isDisconnected || (!isConnected && disconnectedRawName)) {
            const disconnectedName = steamLocalize(disconnectedRawName);
            if (disconnectedName && !disconnectedName.startsWith("#"))
                out.controller_name = disconnectedName;
            out.connected = false;
            out.controller_event = "disconnected";
            const typeRaw = directField(originalData, "controller_type");
            const controllerType = Number(typeRaw);
            if (Number.isFinite(controllerType))
                out.controller_type = controllerType;
        }
    }
    catch { /* ignore */ }
}
/*
  Steam's notification DESCRIPTOR, read and never called.

  This is the fix for the bug reports of 1.1.0: phantom "DOTA 2 installed" toasts after
  every download, and bursts of ten-or-so friends "coming online" - several of them not
  online at all - every time a real friend connected.

  `target` is not data: it is the descriptor Steam keeps for each notification type, in
  `chunk~2dcc5aaf7.js`:

      [Download Complete]: { showToast: true, ..., fnTest: () => ne().TestDownloadComplete(570) }
      [Friend Online]:     { showToast: ge(...), ..., fnTest: () => ne().TestFriendOnline() }
      [Achievement]:       { ..., fnTest: () => ne().TestAchievement(550) }

  The previous version walked `Object.keys(target)` and CALLED every zero-argument
  function it found, to snapshot its value. `fnTest` is exactly such a function, and
  calling it makes Steam inject a REAL notification through `OnNotification`:

      TestFriendOnline(e) { let t = se(e); ... this.OnNotification(id, OK, ...) }
      function se(e) { ... let i = random(0, allFriends.length - 1);
                       t = InitFromAccountID(allFriends[i].persona.GetAccountID()) }

  A random friend out of ALL friends, online or not - and appid 570 is Dota 2, Valve's
  own placeholder for the download test. Worse, the injected notification comes back
  through this same hook, which called `fnTest` again: a feedback loop that filled the
  toast queue ("Notification queue full" hundreds of times in the user logs) and wrote
  every fake event into Steam's real notification tray, because `ProcessNotification`
  fills the tray BEFORE it ever asks whether to show a toast.

  So the descriptor is now read through a fixed list of primitive fields. Nothing on it is
  ever invoked, whatever a future Steam build puts there.
*/
const DESCRIPTOR_FIELDS = [
    "strTest", "eFeature", "sound", "toastDurationMS", "nRemoveFromTraySec",
    "bCritical", "bEnableInReducedUI"
];
function summarizeNativeTarget(target) {
    const out = {};
    if (!target || typeof target !== "object")
        return out;
    for (const key of DESCRIPTOR_FIELDS) {
        let value;
        try {
            value = target[key];
        }
        catch {
            continue;
        }
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            if (value === "")
                continue;
            out[key] = value;
        }
    }
    /*
      `showToast` and `playSound` are booleans on some types and predicates on others
      (`showToast: ge("bNotifications_ShowOnline", ...)`). Only the boolean form is worth
      recording, and the predicate form must not be called: Steam's own dedup state lives
      inside it and has already been updated once by the real BShowToast call.
    */
    for (const key of ["showToast", "playSound"]) {
        try {
            const value = target[key];
            if (typeof value === "boolean")
                out[key] = value;
        }
        catch { /* ignore */ }
    }
    return out;
}
/*
  A last line of defence against notification storms.

  1.1.0 could feed itself: one intercepted toast made Steam inject another (see
  `summarizeNativeTarget`), which came straight back here. That specific loop is closed,
  but the shape of the bug - this plugin turning one Steam event into many toasts - is bad
  enough that the boundary is now guarded on its own terms:

    - the SAME notification (kind, title, body, app, achievement) is shown once, and
      repeats within four seconds are dropped;
    - no more than twenty toasts are forwarded in any ten seconds, whatever produced them,
      so a runaway can never fill the backend queue again;
    - re-entering the hook while a toast is being built is recorded, because that is the
      signature of a feedback loop and it must never pass silently.

  Every drop is logged once with a reason: a guard nobody can see is a guard nobody can
  trust.
*/
const DEDUP_WINDOW_MS = 4000;
const RATE_WINDOW_MS = 10000;
const RATE_LIMIT = 20;
const recentPayloads = new Map();
let rateWindowStart = 0;
let rateWindowCount = 0;
let rateWarned = false;
let insideSend = 0;
let reentryWarned = false;
function payloadKey(payload) {
    return [
        String(payload?.kind || ""),
        String(payload?.title || ""),
        String(payload?.body || ""),
        String(payload?.appid || ""),
        String(payload?.achievement_id || "")
    ].join("|");
}
function shouldForward(payload) {
    const now = Date.now();
    for (const [key, stamp] of recentPayloads) {
        if (now - stamp > DEDUP_WINDOW_MS)
            recentPayloads.delete(key);
    }
    const key = payloadKey(payload);
    const seen = recentPayloads.get(key);
    if (seen != null && now - seen <= DEDUP_WINDOW_MS) {
        void debugLog(`duplicate toast dropped (${Math.round((now - seen))}ms apart): ${key.slice(0, 180)}`);
        return false;
    }
    recentPayloads.set(key, now);
    if (now - rateWindowStart > RATE_WINDOW_MS) {
        rateWindowStart = now;
        rateWindowCount = 0;
        rateWarned = false;
    }
    rateWindowCount += 1;
    if (rateWindowCount > RATE_LIMIT) {
        if (!rateWarned) {
            rateWarned = true;
            void debugLog(`toast rate limit reached (${RATE_LIMIT} in ${RATE_WINDOW_MS}ms); extra toasts dropped until the burst ends`);
        }
        return false;
    }
    return true;
}
function send(target, notification) {
    insideSend += 1;
    try {
        const originalData = notification?.data;
        const directAchievement = String(target?.strTest || "").toLowerCase().includes("achievement")
            || directString(originalData, ["achievement_id", "achievementId"]) !== "";
        const objectified = objectify(originalData);
        enrichNativeControllerData(originalData, objectified);
        if (directAchievement) {
            // This is the exact boundary used by Steam itself. In the supplied SteamUI
            // build, ProcessNotification calls BShowToast(target, notification) and the
            // native achievement renderer reads notification.data.image_url() directly.
            // Read the protobuf here BEFORE any JSON/toObject conversion.
            const directImage = directString(originalData, ["image_url", "imageUrl"]);
            const directId = directString(originalData, ["achievement_id", "achievementId"]);
            const directName = directString(originalData, ["name"]);
            const directDescription = directString(originalData, ["description"]);
            const directAppid = directNumber(originalData, ["appid", "appId"]);
            if (directImage)
                objectified.image_url = directImage;
            if (directId)
                objectified.achievement_id = directId;
            if (directName)
                objectified.name = directName;
            if (directDescription)
                objectified.description = directDescription;
            if (directAppid)
                objectified.appid = directAppid;
        }
        const nativeTarget = summarizeNativeTarget(target);
        if (Object.keys(nativeTarget).length)
            objectified.native_target = nativeTarget;
        const raw = enrichSteamApp(objectified);
        const payload = makeDisplayPayload(String(target?.strTest || ""), raw, notification);
        if (!payload.image && payload.kind === "achievement") {
            const inferred = inferBestImage(originalData, String(payload.kind || ""))
                || inferBestImage(raw, String(payload.kind || ""))
                || inferBestImage(notification, String(payload.kind || ""));
            if (inferred)
                payload.image = inferred;
        }
        void (async () => {
            if (payload.kind === "controller") {
                const className = nativeNotificationClassName(originalData);
                const nativeConnected = className === "CClientNotificationControllerConnected" || raw?.controller_event === "connected";
                const nativeDisconnected = className === "CClientNotificationControllerDisconnected" || raw?.controller_event === "disconnected";
                if (nativeConnected) {
                    const controllerIndex = Number(raw?.controller_index);
                    let resolvedName = "";
                    if (Number.isFinite(controllerIndex) && controllerIndex >= 0) {
                        resolvedName = await resolveConnectedControllerNameAsync(controllerIndex);
                    }
                    if (!resolvedName)
                        resolvedName = steamLocalize(String(raw?.controller_name || ""));
                    payload.title = resolvedName && !resolvedName.startsWith("#") ? resolvedName : "Controller";
                    payload.body = steamControllerStateText(true);
                }
                else if (nativeDisconnected) {
                    const resolvedName = steamLocalize(String(raw?.controller_name || directString(originalData, ["controller_name", "controllerName"]) || ""));
                    payload.title = resolvedName && !resolvedName.startsWith("#") ? resolvedName : "Controller";
                    payload.body = steamControllerStateText(false);
                }
            }
            if (payload.kind === "friend") {
                const className = nativeNotificationClassName(originalData);
                const friendInGame = className === "CClientNotificationFriendInGame";
                const friendOnline = className === "CClientNotificationFriendOnline";
                const steamId = String(raw?.steamid
                    || raw?.friend_steamid
                    || raw?.accountid
                    || raw?.account_id
                    || directString(originalData, ["steamid", "steam_id", "steamid64", "friend_steamid", "friendSteamId"])
                    || directNumber(originalData, ["accountid", "account_id"])
                    || "").trim();
                const accountId = steamIdToAccountId(steamId);
                const rawAvatar = String(payload.image
                    || raw?.avatar_url
                    || raw?.avatarUrl
                    || directString(originalData, ["avatar_url", "avatarUrl", "image_url", "imageUrl"])
                    || "").trim();
                const avatarUrl = rawAvatar || avatarUrlFromState(raw) || readFriendAvatarUrl(accountId, steamId);
                const [resolvedName, avatarData] = await Promise.all([
                    resolveFriendDisplayNameAsync(steamId),
                    cacheFriendAvatar(avatarUrl),
                ]);
                const gameName = String(raw?.game_name || raw?.app_name || "").trim();
                if (avatarUrl)
                    payload.image = avatarUrl;
                if (avatarData)
                    payload.image_data = avatarData;
                if (resolvedName) {
                    payload.title = friendInGame || gameName ? `${resolvedName} is now playing` : resolvedName;
                    if ((friendInGame || gameName) && gameName)
                        payload.body = gameName;
                }
                else if (friendInGame || friendOnline) {
                    // Never expose a SteamID/account ID as the visible friend name. Steam's
                    // own renderer resolves steamid -> friendStore.display_name first.
                    payload.title = friendInGame ? "Friend is now playing" : "Friend";
                    if (friendInGame && gameName)
                        payload.body = gameName;
                }
                else {
                    const currentTitle = String(payload.title || "");
                    const namePart = currentTitle.split(/\bis (?:now )?playing\b/i)[0]?.trim() || currentTitle;
                    if (isSteamIdentifierText(namePart))
                        payload.title = gameName ? "Friend is now playing" : "Friend";
                }
                // Last-line safety: account IDs and SteamIDs must never reach the WPF renderer.
                const visibleTitle = String(payload.title || "").trim();
                const visibleBody = String(payload.body || "").trim();
                const titleNamePart = visibleTitle.split(/\bis (?:now )?playing\b/i)[0]?.trim() || visibleTitle;
                if (isSteamIdentifierText(titleNamePart))
                    payload.title = gameName ? "Friend is now playing" : "Friend";
                if (isSteamIdentifierText(visibleBody))
                    payload.body = gameName || (friendOnline ? "Friend is online" : "Friend status changed");
            }
            // Keep the original Steam CDN URL in payload.image even when browser-side
            // fetch is blocked by CORS. The Python backend has its own no-CORS downloader
            // and an independent Steam Community XML fallback.
            if (payload.image && !payload.image_data) {
                const encoded = await fetchImageDataUrl(String(payload.image));
                if (encoded)
                    payload.image_data = encoded;
            }
            if (payload.kind === "achievement") {
                try {
                    void debugLog(`achievement native image=${String(payload.image || "<empty>").slice(0, 300)} appid=${payload.appid || 0} id=${payload.achievement_id || ""}`);
                }
                catch { }
            }
            else if (payload.kind === "controller" || payload.kind === "friend") {
                try {
                    const imageState = payload.kind === "friend" ? ` image=${payload.image_data ? "cached-avatar" : (payload.image ? "avatar-url" : "fallback")}` : "";
                    void debugLog(`${payload.kind} resolved title=${String(payload.title || "").slice(0, 160)} body=${String(payload.body || "").slice(0, 180)}${imageState} target=${JSON.stringify(nativeTarget).slice(0, 900)}`);
                }
                catch { }
            }
            if (!shouldForward(payload))
                return;
            const result = await emitNotification(payload);
            if (result?.queued) notifyGameHubDelivered(payload);
        })().catch((error) => {
            console.warn("Playhub Notifications could not queue toast", error);
        });
    }
    catch (error) {
        console.warn("Playhub Notifications could not serialize toast", error);
    }
    finally {
        insideSend -= 1;
    }
}
function getStore() {
    return window.NotificationStore;
}
/**
 * Patch only ordinary writable methods on the NotificationStore instance.
 * Steam decorates ProcessNotification / AddAppOverlayNotification as MobX
 * actions in current Big Picture builds; those become read-only and MUST NOT
 * be assigned to. BShowToast and ChooseSound are intentionally undecorated
 * in the supplied SteamUI build and are the safe interception boundary.
 *
 * Reflect.set is used deliberately: a future Steam build can make either
 * method read-only without crashing Decky. In that case installation simply
 * fails open and Steam notifications are left untouched.
 */
/*
  The layer left behind by an older bundle.

  The Steam javascript context outlives the plugin: Decky reloads the plugin, but whatever
  was assigned to `NotificationStore.BShowToast` stays exactly where it was. If a previous
  bundle's cleanup did not run - a crash, a hard reload, an update applied while Steam kept
  running - its wrapper is still there, with its own closure and its own state. Wrapping it
  again would stack the new code ON TOP of the old bug rather than replacing it: the storm
  would go on, from code nobody can reach any more.

  So the original is stashed ON THE STORE under a marker. Any bundle, of any version, can
  find it and put Steam's own method back before installing its own single layer.
*/
const ORIGINAL_MARKER = (name) => `__playhubNotificationsOriginal_${name}`;
const WRAPPED_FLAG = "__playhubNotificationsWrapped";
/** Text that only ever appears inside 1.1.0's wrapper, which left no marker behind. */
const LEGACY_WRAPPER = /Playhub Notifications could not evaluate Steam toast visibility/;
function takeBackMethod(store, name) {
    const current = store?.[name];
    if (typeof current !== "function")
        return "clean";
    const marker = ORIGINAL_MARKER(name);
    const stashed = store?.[marker];
    if (current[WRAPPED_FLAG] && typeof stashed === "function") {
        try {
            Reflect.set(store, name, stashed);
            delete store[marker];
            return "recovered";
        }
        catch {
            return "foreign";
        }
    }
    if (LEGACY_WRAPPER.test(String(current)))
        return "foreign";
    return "clean";
}
function patchMethod(store, name, replacement) {
    const state = takeBackMethod(store, name);
    if (state === "recovered") {
        void debugLog(`removed a previous Playhub layer from ${name} before installing this one`);
    }
    if (state === "foreign") {
        /*
          A 1.1.0 wrapper is still installed and its original is unreachable, so there is no way
          to replace it - only to pile on top of it, which is exactly what must not happen.
        */
        void debugLog(`a previous Playhub Notifications build is still attached to ${name}; restart Steam to finish the update`);
        return null;
    }
    const original = store?.[name];
    if (typeof original !== "function")
        return null;
    const hadOwn = Object.prototype.hasOwnProperty.call(store, name);
    const ownDescriptor = hadOwn ? Object.getOwnPropertyDescriptor(store, name) : undefined;
    const wrapped = replacement(original);
    wrapped[WRAPPED_FLAG] = true;
    try {
        Object.defineProperty(store, ORIGINAL_MARKER(name), {
            value: original, configurable: true, writable: true, enumerable: false,
        });
    }
    catch {
        // Without the marker a future bundle cannot recover Steam's method, but nothing breaks now.
    }
    let installed = false;
    try {
        installed = Reflect.set(store, name, wrapped);
    }
    catch {
        installed = false;
    }
    if (!installed || store[name] !== wrapped)
        return null;
    return {
        restore: () => {
            if (store[name] !== wrapped) return;
            try {
                try {
                    delete store[ORIGINAL_MARKER(name)];
                }
                catch { /* non-configurable */ }
                if (hadOwn) {
                    if (ownDescriptor)
                        Object.defineProperty(store, name, ownDescriptor);
                    else
                        Reflect.set(store, name, original);
                }
                else {
                    delete store[name];
                }
            }
            catch {
                // Never let cleanup of a Steam internals hook break Decky unload.
            }
        }
    };
}
function replacementActive() {
    return state.enabled && state.overlayReady && state.interceptionReady;
}
function installOnce() {
    if (cleanupFn)
        return true;
    const store = getStore();
    if (!store || typeof store.BShowToast !== "function" || typeof store.ChooseSound !== "function")
        return false;
    // IMPORTANT: do not assign ProcessNotification or AddAppOverlayNotification.
    // Both are decorated/read-only in the SteamUI build supplied by the user.
    const showPatch = patchMethod(store, "BShowToast", (originalBShowToast) => function (target, notification) {
        let nativeWouldShow = false;
        try {
            nativeWouldShow = Boolean(originalBShowToast.call(this, target, notification));
        }
        catch (error) {
            console.warn("Playhub Notifications could not evaluate Steam toast visibility", error);
            // Fail open: if Steam internals changed, prefer a native toast over losing the notification.
            return true;
        }
        if (replacementActive() && nativeWouldShow && !notification?.decky) {
            /*
              Re-entering while a toast is being built means something we did produced another
              Steam notification. Nothing should do that any more, so it is reported and handed
              back to Steam rather than being taken over - a loop must never be able to close
              through this plugin.
            */
            if (insideSend > 0) {
                if (!reentryWarned) {
                    reentryWarned = true;
                    void debugLog("re-entered BShowToast while building a toast; that notification was left to Steam");
                }
                return nativeWouldShow;
            }
            send(target, notification);
            return false;
        }
        return nativeWouldShow;
    });
    if (!showPatch) {
        void debugLog("Playhub Notifications: BShowToast is not patchable; Steam notifications left untouched.");
        return false;
    }
    const soundPatch = patchMethod(store, "ChooseSound", (originalChooseSound) => function (target, notification) {
        if (replacementActive() && !notification?.decky)
            return null;
        return originalChooseSound.call(this, target, notification);
    });
    if (!soundPatch) {
        showPatch.restore();
        void debugLog("Playhub Notifications: ChooseSound is not patchable; Steam notifications left untouched.");
        return false;
    }
    state.interceptionReady = true;
    cleanupFn = () => {
        state.interceptionReady = false;
        soundPatch.restore();
        showPatch.restore();
        cleanupFn = null;
    };
    void debugLog("Steam notification interception installed at BShowToast + ChooseSound; decorated read-only methods were not modified.");
    return true;
}
function cleanupNotificationHook() {
    if (retryTimer != null)
        window.clearInterval(retryTimer);
    if (avatarWarmTimer != null)
        window.clearTimeout(avatarWarmTimer);
    retryTimer = null;
    avatarWarmTimer = null;
    friendAvatarCache.clear();
    cleanupFn?.();
    cleanupFn = null;
    state.interceptionReady = false;
}

function notifyGameHubDelivered(payload) {
    const {steam_notification_id, title, body, kind, image} = payload;
    window.dispatchEvent(new CustomEvent("game-hub:playhub-notice", {
        detail: {id: String(steam_notification_id || ""), title, body, kind, image}
    }));
}

export function startBundledNotifications() {
    const linux = /Linux.*x86_64/i.test(navigator.platform);
    if (!linux && !/^Win/i.test(navigator.platform)) return () => {};
    let disposed = false;
    const key = '__playhubNotificationsHookOwner';
    const owner = { cleanup: cleanupNotificationHook, handlesSteamToasts: replacementActive };
    function attach() {
        if (disposed || (linux && !linuxPopupAvailable()) || (window[key] && window[key] !== owner)) return;
        if (installOnce()) {
            window[key] = owner;
            state.enabled = state.overlayReady = true;
        }
    }
    let interval;
    (linux ? Promise.resolve(true) : rendererReady()).then(ready => {
        if (!ready || disposed) return;
        attach();
        interval = window.setInterval(attach, 2000);
    }).catch(error => console.warn('[Game Hub] Notification renderer unavailable', error));
    return () => {
        disposed = true;
        clearInterval(interval);
        cleanupNotificationHook();
        state.enabled = state.overlayReady = false;
        if (window[key] === owner) delete window[key];
    };
}
