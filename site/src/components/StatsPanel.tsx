"use client";

// Stats and streaks for one game, read from this device only.

import { useState } from "react";
import { type History, type Played, type StatsSpec, computeStats, record } from "@/core/stats";
import { load, save } from "@/core/storage";
import { ukDate } from "@/core/ukDate";
import styles from "./StatsPanel.module.css";

const historyKey = (game: string) => `${game}:history`;

/**
 * Save a finished game to this device's history (first result of the day only)
 * and return the history. Read once on mount: result screens only ever appear
 * in the browser, after a game ends, so there is no server render to match.
 */
export function useHistory(game: string, finished: Played): History {
  const [history] = useState<History>(() => {
    const stored = load<History>(historyKey(game)) ?? {};
    const next = record(stored, finished);
    if (next !== stored) save(historyKey(game), next);
    return next;
  });
  return history;
}

type Props = {
  title: string;
  history: History;
  spec: StatsSpec;
  today: Played | null;
  /** How to show an average or best score, e.g. "line 3" or "86". */
  format: (n: number) => string;
  winLabel?: string;
};

export function StatsPanel({ title, history, spec, today, format, winLabel }: Props) {
  const s = computeStats(history, today?.date ?? ukDate(new Date()), spec);
  if (s.played === 0) return null;
  const top = Math.max(1, ...s.distribution.map((d) => d.count));
  const mine = today ? spec.bucketOf(today) : null;

  return (
    <section className={styles.panel} aria-label={title}>
      <h3 className={styles.title}>{title}</h3>
      <dl className={styles.tiles}>
        <Tile label="Played" value={s.played} />
        {winLabel ? <Tile label={winLabel} value={`${s.winRate}%`} /> : <Tile label="Average" value={format(s.average!)} />}
        <Tile label="Streak" value={s.currentStreak} />
        <Tile label="Best streak" value={s.bestStreak} />
      </dl>
      {s.best !== null && (
        <p className={styles.small}>
          {winLabel && s.average !== null ? `Average ${format(s.average)} · ` : ""}Best {format(s.best)}
        </p>
      )}
      <ol className={styles.bars} aria-label="Your results so far">
        {s.distribution.map((d) => (
          <li key={d.label} className={styles.bar}>
            <span className={styles.label}>{d.label}</span>
            <span className={styles.track}>
              <span
                className={d.label === mine ? `${styles.fill} ${styles.mine}` : styles.fill}
                style={{ width: `${Math.max(d.count ? 8 : 0, (100 * d.count) / top)}%` }}
              />
            </span>
            <span className={styles.count}>{d.count}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={styles.tile}>
      <dd className={styles.value}>{value}</dd>
      <dt className={styles.tileLabel}>{label}</dt>
    </div>
  );
}
