// UK calendar date and puzzle numbering: the TypeScript twin of
// pipeline/trivia/ukdate.py. Both are tested against shared/ukdate-cases.json.
//
// Dates are "YYYY-MM-DD" strings throughout, never Date objects, so a
// player's own time zone can never leak in.

const MS_PER_DAY = 86_400_000;

const ukParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function partsAt(instant: Date) {
  const p = Object.fromEntries(ukParts.formatToParts(instant).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour), minute: Number(p.minute) };
}

/** The UK calendar date at a given moment. */
export function ukDate(instant: Date): string {
  return partsAt(instant).day;
}

function utcMidnight(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(day: string, n: number): string {
  return new Date(utcMidnight(day) + n * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Puzzle #1 is the launch day; one puzzle per UK calendar day after that. */
export function puzzleNumber(day: string, launch: string): number {
  const n = Math.round((utcMidnight(day) - utcMidnight(launch)) / MS_PER_DAY) + 1;
  if (n < 1) throw new RangeError(`${day} is before launch (${launch})`);
  return n;
}

/** The moment a UK day begins: 00:00 UTC in winter, 23:00 UTC the day before in summer. */
export function ukMidnight(day: string): Date {
  for (const offsetHours of [0, -1]) {
    const candidate = new Date(utcMidnight(day) + offsetHours * 3_600_000);
    const p = partsAt(candidate);
    if (p.day === day && p.hour === 0 && p.minute === 0) return candidate;
  }
  throw new Error(`no UK midnight found for ${day}`);
}

/** Milliseconds until the next puzzle, for the countdown. */
export function msUntilNextPuzzle(now: Date): number {
  return ukMidnight(addDays(ukDate(now), 1)).getTime() - now.getTime();
}
