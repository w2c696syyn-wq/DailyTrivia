// Scores, tiers and share text. The browser and the Worker both import this,
// so a score the player sees is always the score the server records.

const MS_PER_WEEK = 7 * 86_400_000;

function tier<T extends string>(score: number, bands: [number, T][], lowest: T): T {
  return bands.find(([min]) => score >= min)?.[1] ?? lowest;
}

// ── Ingredient X ────────────────────────────────────────────────────────────
// Score = the label line the player solved on (lower is better); null = not solved.

export function ingredientXTier(solvedOn: number | null) {
  if (solvedOn === null) return "Still Peckish";
  if (solvedOn <= 2) return "Food Scientist";
  if (solvedOn <= 4) return "Label Reader";
  if (solvedOn <= 6) return "Shopper";
  return "Snacker";
}

export function ingredientXShare(puzzle: number, solvedOn: number | null, totalLines: number): string {
  const squares = solvedOn === null ? "⬛".repeat(totalLines) : "⬛".repeat(solvedOn - 1) + "🟥";
  return `🧾 Ingredient X #${puzzle}  ${squares} ${solvedOn ?? "X"}/${totalLines}`;
}

// ── Trending ────────────────────────────────────────────────────────────────

export const TRENDING_POINTS_PER_WEEK = 2;
export const TRENDING_POINTS_PER_REVEAL = 4;

export function weeksBetween(a: string, b: string): number {
  return Math.round(Math.abs(Date.parse(a) - Date.parse(b)) / MS_PER_WEEK);
}

export function trendingScore(weeksOff: number, reveals: number): number {
  return Math.max(0, 100 - TRENDING_POINTS_PER_WEEK * weeksOff - TRENDING_POINTS_PER_REVEAL * reveals);
}

export function trendingTier(score: number) {
  return tier(
    score,
    [[90, "Time Traveller"], [75, "Historian"], [50, "Regular"], [25, "Tourist"]],
    "Living Under a Rock",
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function trendingShare(puzzle: number, weeksOff: number, reveals: number): string {
  const distance = weeksOff === 0 ? "Exact week!" : `${plural(weeksOff, "week")} off`;
  return `🔥 Trending #${puzzle}  📍 ${distance} · ${plural(reveals, "reveal")}  ${trendingScore(weeksOff, reveals)}/100`;
}
