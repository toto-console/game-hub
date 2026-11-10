import {lastPlayed} from "../../library-data";
import { Focusable } from "@decky/ui";
import { ReactNode } from "react";
import { MdEmojiEvents, MdSchedule, MdStarRate, MdTimer } from "react-icons/md";

import { FOCUSED_CLASS, useFocusHook } from "./components";
import { formatBytes, formatDuration, useAchievements, useHltb } from "./gameinfo";
import { t } from "./i18n";
import { currentSettings } from "./settings";
import { APP_TYPE_SHORTCUT, App, lastPlayedText, openAchievements, openDetails, openExternal, openStore } from "./steam";

/** A shortcut card shown under the Store and Game Library tiles. */
export interface ActionCard {
  icon: ReactNode;
  title: string;
  caption: string;
  go: () => void;
}

/** One PS5-style card: dark glass panel, title row with an icon, white glow when focused. */
function InfoCard({
  icon,
  title,
  size = "m",
  label,
  onActivate,
  onFocus,
  children,
}: {
  icon: ReactNode;
  title: string;
  size?: "s" | "m" | "l";
  label: string;
  onActivate: () => void;
  onFocus: () => void;
  children: ReactNode;
}) {
  const ref = useFocusHook(onFocus);
  return (
    <Focusable
      ref={ref}
      className={`ghd-infocard ghd-infocard-${size}`}
      focusClassName={FOCUSED_CLASS}
      noFocusRing
      onActivate={onActivate}
      onOKActionDescription={label}
    >
      <div className="ghd-infocard-head">
        <span className="ghd-infocard-icon">{icon}</span>
        {title}
      </div>
      <div className="ghd-infocard-body">{children}</div>
    </Focusable>
  );
}

function Bar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="ghd-bar">
      <div className="ghd-bar-fill" style={{ transform: `scaleX(${pct})` }} />
    </div>
  );
}

function HltbCard({ app, onFocus }: { app: App; onFocus: () => void }) {
  const hltb = useHltb(app);
  const times = hltb.state === "done" ? hltb.value : null;
  const played = (app.minutes_playtime_forever ?? 0) * 60;
  const open = () =>
    openExternal(times?.id ? `https://howlongtobeat.com/game/${times.id}` : `https://howlongtobeat.com/?q=${encodeURIComponent(app.display_name)}`);
  return (
    <InfoCard icon={<MdTimer />} title={t.cardHltb} size="l" label={t.open} onActivate={open} onFocus={onFocus}>
      {hltb.state === "loading" ? (
        <div className="ghd-infocard-muted ghd-pulse">{t.cardHltbLoading}</div>
      ) : !times ? (
        <div className="ghd-infocard-muted">{t.cardHltbNone}</div>
      ) : (
        <>
          <div className="ghd-hltb">
            {[
              [t.cardHltbMain, times.main],
              [t.cardHltbPlus, times.plus],
              [t.cardHltbFull, times.full],
            ].map(([label, secs]) => (
              <div key={label as string} className="ghd-hltb-col">
                <div className="ghd-hltb-time">{(secs as number) > 0 ? formatDuration(secs as number) : "—"}</div>
                <div className="ghd-hltb-label">{label}</div>
              </div>
            ))}
          </div>
          {times.main > 0 && played > 0 && (
            <>
              <Bar value={played / times.main} />
              <div className="ghd-infocard-caption">
                {t.cardHltbYou(formatDuration(played), Math.min(999, Math.round((played / times.main) * 100)))}
              </div>
            </>
          )}
        </>
      )}
    </InfoCard>
  );
}

function PlaytimeCard({ app, onFocus }: { app: App; onFocus: () => void }) {
  const total = (app.minutes_playtime_forever ?? 0) * 60;
  const recent = (app.minutes_playtime_last_two_weeks ?? 0) * 60;
  return (
    <InfoCard icon={<MdSchedule />} title={t.cardPlaytime} size="s" label={t.details} onActivate={() => openDetails(app)} onFocus={onFocus}>
      <div className="ghd-infocard-big">{total > 0 ? formatDuration(total) : "—"}</div>
      {/* Steam often doesn't count time in non-Steam shortcuts, but still knows when you last played them. */}
      <div className="ghd-infocard-caption">{lastPlayed(app) > 0 || total > 0 ? lastPlayedText(app) : t.cardPlaytimeNever}</div>
      {recent > 0 && <div className="ghd-infocard-caption">{t.cardTwoWeeks(formatDuration(recent))}</div>}
    </InfoCard>
  );
}

function ReviewsCard({ app, onFocus }: { app: App; onFocus: () => void }) {
  const pct = app.review_percentage_with_bombs ?? 0;
  const size = Number(app.size_on_disk ?? 0);
  if (!pct && !app.metacritic_score && !size) return null;
  return (
    <InfoCard
      icon={<MdStarRate />}
      title={t.cardReviews}
      size="s"
      label={t.storeTitle}
      onActivate={() => openStore(`app/${app.appid}`)}
      onFocus={onFocus}
    >
      <div className="ghd-infocard-big">
        {pct ? `${pct}%` : "—"}
        {pct > 0 && <span className="ghd-infocard-unit">{t.cardReviewsPositive}</span>}
      </div>
      <div className="ghd-chips-mini">
        {!!app.metacritic_score && <span className="ghd-mini">{t.cardMetacritic(app.metacritic_score)}</span>}
        {app.installed && size > 0 && <span className="ghd-mini">{t.cardSize(formatBytes(size))}</span>}
      </div>
    </InfoCard>
  );
}

function AchievementsCard({ app, onFocus }: { app: App; onFocus: () => void }) {
  const ach = useAchievements(app);
  const focusRef=useFocusHook(onFocus);
  // Appears once loaded and only for games that have achievements; it's last, so nothing shifts.
  if (ach.state !== "done" || !ach.value) return null;
  const {done,total}=ach.value;
  if(total<=0)return null;
  return <Focusable className="ghd-trophy" focusClassName={FOCUSED_CLASS} noFocusRing onActivate={()=>openAchievements(app)} onOKActionDescription={t.cardAchievements} ref={focusRef}>
    <MdEmojiEvents/><div><span>Progress</span><strong>{Math.round(done/total*100)}%</strong></div><div><span>Earned</span><strong>{done}/{total}</strong></div>
  </Focusable>;
}
export function GameCards({app,onFocus}:{app:App;onFocus:()=>void}) {
 if(!currentSettings().infoCards||app.app_type===APP_TYPE_SHORTCUT)return null;
 return <AchievementsCard app={app} onFocus={onFocus}/>;
}

/** Shortcut cards under the Store and Game Library tiles. */
export function ActionCards({ cards, onFocus }: { cards: ActionCard[]; onFocus: () => void }) {
  if (!currentSettings().infoCards || cards.length === 0) return null;
  return (
    <Focusable className="ghd-infocards" flow-children="row">
      {cards.map((c) => (
        <InfoCard key={c.title} icon={c.icon} title={c.title} size="s" label={t.open} onActivate={c.go} onFocus={onFocus}>
          <div className="ghd-infocard-caption">{c.caption}</div>
        </InfoCard>
      ))}
    </Focusable>
  );
}

