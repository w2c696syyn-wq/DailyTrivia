"""Monthly build and nightly check for the daily puzzle files.

Layout under the repo root:
  content/games.json             launch date per game
  content/<game>/bank.json       reviewed items, ready to schedule
  puzzles/<game>/<date>.json     one file per UK day; private, released by the Worker
  site/public/answers/<game>.json  type-ahead answer list, shipped with the site

  python -m trivia.build build ingredient-x --from 2027-03-01 --days 60
  python -m trivia.build check            (nightly: the next 7 days of every game)
"""

import argparse
import json
import sys
from dataclasses import asdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from trivia.answers import build_answer_list, slugify
from trivia.ingredients import label_lines
from trivia.puzzle_format import GAME_FIELDS, check_upcoming, validate_puzzle
from trivia.schedule import schedule
from trivia.ukdate import puzzle_number, uk_date

CHECK_DAYS = 7


def _read(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _write(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def _launch(root: Path, game: str) -> date | None:
    """None until a launch date is chosen; banks can fill up before then."""
    launch = _read(root / "content/games.json")[game].get("launch")
    return date.fromisoformat(launch) if launch else None


def _existing(root: Path, game: str) -> dict[date, dict]:
    folder = root / "puzzles" / game
    return {date.fromisoformat(f.stem): _read(f) for f in sorted(folder.glob("*.json"))}


# Per game: an item's id, its scheduling group, and the puzzle it becomes.
GAMES = {
    "ingredient-x": {
        "id": lambda x: x.get("id") or slugify(x["name"]),
        "group": lambda x: x["category"],
        "puzzle_id": lambda p: p["answerId"],
        "puzzle_group": lambda p: p["category"],
        "make": lambda x: {
            "answerId": x.get("id") or slugify(x["name"]),
            "category": x["category"],
            # Lines fixed by hand in review win over the automatic split.
            "lines": x.get("lines") or label_lines(x["ingredients"]),
            "fact": x["fact"],
            "labelChecked": x["labelChecked"],
        },
    },
    "trending": {
        "id": lambda x: x["week"],
        "group": lambda x: x["week"][:4],
        "puzzle_id": lambda p: p["week"],
        "puzzle_group": lambda p: p["week"][:4],
        "make": lambda x: {"week": x["week"], "articles": x["articles"]},
    },
}
assert GAMES.keys() == GAME_FIELDS.keys()


def _answer_ids(root: Path, game: str) -> set[str]:
    path = root / "site/public/answers" / f"{game}.json"
    return {a["id"] for a in _read(path)} if path.exists() else set()


def build(root: Path, game: str, start: date, days: int, seed: int = 0) -> list[Path]:
    root, spec, launch = Path(root), GAMES[game], _launch(root, game)
    if launch is None:
        raise ValueError(f"{game} has no launch date yet: set it in content/games.json before building puzzles")
    bank = _read(root / "content" / game / "bank.json")
    existing = _existing(root, game)

    clash = [d for d in existing if start <= d < start + timedelta(days=days)]
    if clash:
        raise FileExistsError(f"{game} already has puzzles from {clash[0]}; pick a later --from")

    if game == "ingredient-x":
        answers = build_answer_list([{"id": spec["id"](x), "name": x["name"], "aliases": x.get("aliases", [])}
                                     for x in bank])
        _write(root / "site/public/answers/ingredient-x.json", [asdict(a) for a in answers])

    before = [p for d, p in sorted(existing.items()) if d < start]
    plan = schedule(bank, start, days, spec["group"], seed=seed, item_id=spec["id"],
                    recent=[spec["puzzle_group"](p) for p in before],
                    used={spec["puzzle_id"](p) for p in existing.values()})

    written = []
    for day, item in plan:
        puzzle = {"game": game, "number": puzzle_number(day, launch), "date": day.isoformat(), **spec["make"](item)}
        path = root / "puzzles" / game / f"{day.isoformat()}.json"
        _write(path, puzzle)
        written.append(path)
    return written


def check(root: Path, game: str, today: date, days: int = CHECK_DAYS) -> list[str]:
    """Problems with the next `days` puzzles of one game, as readable lines."""
    root, launch = Path(root), _launch(Path(root), game)
    if launch is None:
        return []
    existing = _existing(root, game)
    answer_ids = _answer_ids(root, game)
    # Days before launch need no puzzle, so the nightly job stays quiet until then.
    problems = [f"{game} {d}: missing" for d in check_upcoming(set(existing), today, days) if d >= launch]
    for d, p in sorted(existing.items()):
        if today <= d < today + timedelta(days=days):
            problems += [f"{game} {d}: {e}" for e in validate_puzzle(p, launch, answer_ids)]
            if p.get("date") != d.isoformat():
                problems.append(f"{game} {d}: file name and date field disagree")
    return sorted(problems)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="trivia.build")
    sub = ap.add_subparsers(dest="cmd", required=True)
    b = sub.add_parser("build", help="schedule and write puzzles from a reviewed bank")
    b.add_argument("game", choices=sorted(GAMES))
    b.add_argument("--from", dest="start", type=date.fromisoformat, required=True)
    b.add_argument("--days", type=int, default=60)
    b.add_argument("--seed", type=int, default=0)
    c = sub.add_parser("check", help="validate the next days of every game")
    c.add_argument("--days", type=int, default=CHECK_DAYS)
    c.add_argument("--today", type=date.fromisoformat, default=None)
    for p in (b, c):
        p.add_argument("--root", type=Path, default=Path.cwd())
    args = ap.parse_args(argv)

    if args.cmd == "build":
        written = build(args.root, args.game, args.start, args.days, args.seed)
        print(f"wrote {len(written)} {args.game} puzzles")
        problems = check(args.root, args.game, args.start, args.days)
    else:
        today = args.today or uk_date(datetime.now(timezone.utc))
        problems = [s for g in sorted(GAMES) for s in check(args.root, g, today, args.days)]

    for line in problems:
        print(line, file=sys.stderr)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
