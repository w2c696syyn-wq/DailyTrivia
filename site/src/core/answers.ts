// Type-ahead search and "Did you mean?" over a game's answer list
// (public/answers/<game>.json, written by the pipeline). Runs in the browser:
// no server call while typing.

export type Answer = { id: string; name: string; aliases: string[] };

/** Same rules as pipeline/trivia/answers.py; tested against shared/normalise-cases.json. */
export function normalise(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[^\x00-\x7f]/g, "")
    .toLowerCase()
    .replaceAll("&", " and ")
    .replaceAll("'", "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Optimal string alignment distance: insertions, deletions, substitutions and adjacent swaps. */
export function editDistance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** Typos forgiven for a query of this length: none under 5 letters, then 1, then 2. */
function typosAllowed(length: number): number {
  return length < 5 ? 0 : length < 9 ? 1 : 2;
}

// Lower rank = better match.
function rank(query: string, alias: string): number | null {
  if (alias.startsWith(query)) return 0;
  if (alias.split(" ").some((w) => w.startsWith(query))) return 1;
  if (alias.includes(query)) return 2;
  const allowed = typosAllowed(query.length);
  if (allowed && editDistance(query, alias.slice(0, query.length)) <= allowed) return 3;
  return null;
}

export function searchAnswers(query: string, answers: Answer[], limit = 8): Answer[] {
  const q = normalise(query);
  if (!q) return [];
  const scored: [number, Answer][] = [];
  for (const answer of answers) {
    const ranks = answer.aliases.map((a) => rank(q, a)).filter((r): r is number => r !== null);
    if (ranks.length) scored.push([Math.min(...ranks), answer]);
  }
  scored.sort(([ra, a], [rb, b]) => ra - rb || a.name.length - b.name.length || a.name.localeCompare(b.name));
  return scored.slice(0, limit).map(([, a]) => a);
}

/** Resolve a typed guess: an exact alias, a near miss to confirm, or null. */
export function didYouMean(typed: string, answers: Answer[]): { answer: Answer; exact: boolean } | null {
  const q = normalise(typed);
  if (!q) return null;
  let best: { answer: Answer; distance: number } | null = null;
  for (const answer of answers) {
    for (const alias of answer.aliases) {
      if (alias === q) return { answer, exact: true };
      const distance = editDistance(q, alias);
      if (!best || distance < best.distance) best = { answer, distance };
    }
  }
  return best && best.distance <= typosAllowed(q.length) ? { answer: best.answer, exact: false } : null;
}
