// Per-device stats and streaks. Everything here is computed from the list of
// finished games kept in local storage; nothing is sent anywhere.

import { trendingTier } from "./scoring";
import { addDays } from "./ukDate";

/** One finished game. Ingredient X: the line solved on, or null if missed. Trending: points. */
export type Played = { date: string; number: number; score: number | null };
export type History = Record<string, Played>;

export type StatsSpec = {
  /** Whether this result keeps a streak alive. */
  keeps: (p: Played) => boolean;
  lowerIsBetter: boolean;
  buckets: string[];
  bucketOf: (p: Played) => string;
};

export const INGREDIENT_X_STATS: StatsSpec = {
  keeps: (p) => p.score !== null,
  lowerIsBetter: true,
  buckets: ["1", "2", "3", "4", "5", "6", "7", "8", "X"],
  bucketOf: (p) => (p.score === null ? "X" : String(p.score)),
};

export const TRENDING_STATS: StatsSpec = {
  // There is no losing a Trending game, so turning up is what counts.
  keeps: () => true,
  lowerIsBetter: false,
  buckets: ["Time Traveller", "Historian", "Regular", "Tourist", "Living Under a Rock"],
  bucketOf: (p) => trendingTier(p.score ?? 0),
};

/** Add today's finished game. The first result for a day stands, so replays can't improve it. */
export function record(history: History, played: Played): History {
  return history[played.date] ? history : { ...history, [played.date]: played };
}

export function computeStats(history: History, today: string, spec: StatsSpec) {
  const games = Object.values(history).sort((a, b) => a.date.localeCompare(b.date));
  const wins = games.filter(spec.keeps);
  const scores = games.map((g) => g.score).filter((s): s is number => s !== null);

  return {
    played: games.length,
    wins: wins.length,
    winRate: games.length ? Math.round((100 * wins.length) / games.length) : 0,
    average: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    best: scores.length ? (spec.lowerIsBetter ? Math.min(...scores) : Math.max(...scores)) : null,
    currentStreak: currentStreak(history, today, spec),
    bestStreak: bestStreak(games, spec),
    distribution: spec.buckets.map((label) => ({ label, count: games.filter((g) => spec.bucketOf(g) === label).length })),
  };
}

export type Stats = ReturnType<typeof computeStats>;

// Today's puzzle may not be played yet, so a streak counts back from today if
// it has a result, or from yesterday if not.
function currentStreak(history: History, today: string, spec: StatsSpec): number {
  let day = history[today] ? today : addDays(today, -1);
  let n = 0;
  while (history[day] && spec.keeps(history[day])) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

function bestStreak(games: Played[], spec: StatsSpec): number {
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const g of games) {
    const consecutive = previous !== null && addDays(previous, 1) === g.date;
    run = spec.keeps(g) ? (consecutive ? run + 1 : 1) : 0;
    best = Math.max(best, run);
    previous = g.date;
  }
  return best;
}
