"""Write review queues: raw candidates waiting for a human yes or no.

  python -m trivia.candidates ingredient-x [--parquet PATH_OR_URL] [--min-scans N]
  python -m trivia.candidates trending --from 2016-01-04 --to 2025-12-28

Queues land in review/<game>.json. Open review/review.html to work through
one, then merge its accepted items into content/<game>/bank.json.
"""

import argparse
import json
import sys
from dataclasses import asdict
from datetime import date
from pathlib import Path

from trivia.answers import normalise
from trivia.ingredients import label_lines
from trivia.off_candidates import DEFAULT_MIN_SCANS, find_candidates
from trivia.trending import weekly_top
from trivia.wikimedia import fetch_range

MIN_LINES = 3  # fewer and there is nothing to reveal
OFF_PARQUET = "https://huggingface.co/datasets/openfoodfacts/product-database/resolve/main/food.parquet"


def _bank(root: Path, game: str) -> list[dict]:
    path = root / "content" / game / "bank.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else []


def _write_queue(root: Path, game: str, items: list[dict]) -> Path:
    out = root / "review" / f"{game}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(items, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return out


def ingredient_x_queue(root: Path, parquet: str = OFF_PARQUET, min_scans: int = DEFAULT_MIN_SCANS) -> Path:
    root = Path(root)
    banked = {normalise(x["name"]) for x in _bank(root, "ingredient-x")}
    queue = [
        {**asdict(c), "lines": label_lines(c.ingredients), "status": "pending"}
        for c in find_candidates(parquet, min_scans=min_scans)
        if normalise(c.name) not in banked and len(label_lines(c.ingredients)) >= MIN_LINES
    ]
    return _write_queue(root, "ingredient-x", queue)


def trending_queue(root: Path, start: date, end: date) -> Path:
    root = Path(root)
    banked = {x["week"] for x in _bank(root, "trending")}
    weeks = weekly_top(fetch_range(start, end, root / "pipeline/data/wikimedia"))
    queue = [
        {"week": monday.isoformat(), "top": [list(r) for r in top], "status": "pending"}
        for monday, top in weeks.items()
        if monday.isoformat() not in banked
    ]
    return _write_queue(root, "trending", queue)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="trivia.candidates")
    sub = ap.add_subparsers(dest="game", required=True)
    ix = sub.add_parser("ingredient-x")
    ix.add_argument("--parquet", default=OFF_PARQUET)
    ix.add_argument("--min-scans", type=int, default=DEFAULT_MIN_SCANS)
    tr = sub.add_parser("trending")
    tr.add_argument("--from", dest="start", type=date.fromisoformat, required=True)
    tr.add_argument("--to", dest="end", type=date.fromisoformat, required=True)
    for p in (ix, tr):
        p.add_argument("--root", type=Path, default=Path.cwd())
    args = ap.parse_args(argv)

    if args.game == "ingredient-x":
        out = ingredient_x_queue(args.root, args.parquet, args.min_scans)
    else:
        out = trending_queue(args.root, args.start, args.end)
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
