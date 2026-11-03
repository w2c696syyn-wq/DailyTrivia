// Trending rules as pure functions, shared by the page and the Worker.

import { trendingScore, weeksBetween } from "./scoring";
import { addDays } from "./ukDate";

export type TrendingPuzzle = {
  game: "trending";
  number: number;
  date: string;
  week: string; // Monday the mystery week starts
  articles: { title: string; note: string }[]; // 10, most-read first
};

export type TrendingState = {
  reveals: number;
  guess: string | null; // Monday of the guessed week
  status: "playing" | "done";
};

export type TrendingMove = { reveal: true } | { guess: string };

export const START_SHOWN = 5;
export const MAX_REVEALS = 5;
export const FIRST_WEEK = "2016-01-04";

/** The last Monday of the year before the puzzle's year. */
export function lastWeek(puzzleDate: string): string {
  const dec31 = `${Number(puzzleDate.slice(0, 4)) - 1}-12-31`;
  const weekday = (new Date(`${dec31}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
  return addDays(dec31, -weekday);
}

export const weekAt = (index: number) => addDays(FIRST_WEEK, index * 7);

export const weekCount = (puzzleDate: string) => weeksBetween(FIRST_WEEK, lastWeek(puzzleDate)) + 1;

export const start = (): TrendingState => ({ reveals: 0, guess: null, status: "playing" });

export function play(puzzle: TrendingPuzzle, state: TrendingState, move: TrendingMove): TrendingState {
  if (state.status !== "playing") return state;
  if ("reveal" in move) return { ...state, reveals: Math.min(MAX_REVEALS, state.reveals + 1) };
  return { ...state, guess: move.guess, status: "done" };
}

export function result(puzzle: TrendingPuzzle, state: TrendingState) {
  if (state.guess === null) return null;
  const weeksOff = weeksBetween(state.guess, puzzle.week);
  return { weeksOff, score: trendingScore(weeksOff, state.reveals) };
}
