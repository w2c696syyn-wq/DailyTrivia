"use client";

import { useEffect, useState } from "react";
import { Countdown } from "@/components/Countdown";
import { NextGame } from "@/components/NextGame";
import { ShareButtons } from "@/components/ShareButtons";
import { StatsPanel, useHistory } from "@/components/StatsPanel";
import { playSound } from "@/components/sound";
import { useSettings } from "@/components/useSettings";
import { loadToday } from "@/core/puzzleSource";
import { TRENDING_POINTS_PER_REVEAL, trendingShare, trendingTier } from "@/core/scoring";
import { TRENDING_STATS } from "@/core/stats";
import { load, save } from "@/core/storage";
import {
  MAX_REVEALS,
  START_SHOWN,
  type TrendingMove,
  type TrendingPuzzle,
  type TrendingState,
  play,
  result,
  start,
  weekAt,
  weekCount,
} from "@/core/trending";
import styles from "./Trending.module.css";

const progressKey = (p: TrendingPuzzle) => `tr:progress:${p.date}`;
const title = (t: string) => t.replaceAll("_", " ");
const weekLabel = (monday: string) =>
  new Date(`${monday}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

export function TrendingGame() {
  const [puzzle, setPuzzle] = useState<TrendingPuzzle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<TrendingState>(start);
  const [pick, setPick] = useState(0);
  const [settings] = useSettings();

  useEffect(() => {
    loadToday<TrendingPuzzle>("trending")
      .then(({ puzzle: p }) => {
        setPuzzle(p);
        setState(load<TrendingState>(progressKey(p)) ?? start());
        setPick(Math.floor(weekCount(p.date) / 2));
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p className={styles.message}>This week isn&apos;t ready. {error}</p>;
  if (!puzzle) return <p className={styles.message}>Loading the charts…</p>;

  function move(m: TrendingMove) {
    const next = play(puzzle!, state, m);
    setState(next);
    save(progressKey(puzzle!), next);
    const score = result(puzzle!, next)?.score;
    playSound(score === undefined ? "reveal" : score >= 50 ? "right" : "wrong", settings.sound);
  }

  const done = state.status === "done";
  const shown = done ? puzzle.articles.length : START_SHOWN + state.reveals;
  const total = weekCount(puzzle.date);

  return (
    <div className={styles.game}>
      <section className={styles.search} aria-label="Most-read articles that week">
        <div className={styles.box}>
          <span aria-hidden>🔍</span> most read this week…
        </div>
        <ol className={styles.suggestions}>
          {puzzle.articles.slice(0, shown).map((a, i) => (
            <li key={a.title} className={i >= START_SHOWN ? styles.revealed : undefined}>
              <span className={styles.articleTitle}>{title(a.title)}</span>
              {done && <span className={styles.note}>{a.note}</span>}
            </li>
          ))}
        </ol>
      </section>

      {done ? (
        <Result puzzle={puzzle} state={state} />
      ) : (
        <div className={styles.controls}>
          {state.reveals < MAX_REVEALS && (
            <button className={styles.reveal} onClick={() => move({ reveal: true })}>
              Reveal another article (−{TRENDING_POINTS_PER_REVEAL} points)
            </button>
          )}
          <label className={styles.pickLabel} htmlFor="week">
            Your guess: week of <strong>{weekLabel(weekAt(pick))}</strong>
          </label>
          <input
            id="week"
            className={styles.slider}
            type="range"
            min={0}
            max={total - 1}
            value={pick}
            onChange={(e) => setPick(Number(e.target.value))}
            aria-valuetext={`Week of ${weekLabel(weekAt(pick))}`}
          />
          <div className={styles.ends}>
            <span>{weekAt(0).slice(0, 4)}</span>
            <span>{weekAt(total - 1).slice(0, 4)}</span>
          </div>
          <div className={styles.nudge}>
            <button onClick={() => setPick((p) => Math.max(0, p - 1))}>− 1 week</button>
            <button onClick={() => setPick((p) => Math.min(total - 1, p + 1))}>+ 1 week</button>
          </div>
          <button className={styles.lock} onClick={() => move({ guess: weekAt(pick) })}>
            Lock in my guess
          </button>
        </div>
      )}
    </div>
  );
}

function Result({ puzzle, state }: { puzzle: TrendingPuzzle; state: TrendingState }) {
  const r = result(puzzle, state)!;
  const today = { date: puzzle.date, number: puzzle.number, score: r.score };
  const history = useHistory("trending", today);
  const [settings] = useSettings();
  const url = settings.shareLink ? location.origin + location.pathname : undefined;
  return (
    <section className={styles.result} aria-live="polite">
      <p className={styles.tier}>{trendingTier(r.score)}</p>
      <h2 className={styles.answer}>Week of {weekLabel(puzzle.week)}</h2>
      <p>
        You guessed {weekLabel(state.guess!)}:{" "}
        {r.weeksOff === 0 ? "the exact week!" : `${r.weeksOff} week${r.weeksOff === 1 ? "" : "s"} off.`}
      </p>
      <p className={styles.score}>{r.score}/100</p>
      <ShareButtons text={trendingShare(puzzle.number, r.weeksOff, state.reveals, { url })} />
      <Countdown />
      <NextGame current="trending" />
      <StatsPanel
        title="Your Search History"
        history={history}
        spec={TRENDING_STATS}
        today={today}
        format={(n) => `${n}/100`}
      />
    </section>
  );
}
