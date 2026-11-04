"""AI drafts for the reviewer: product names, aliases and facts for Ingredient
X, and "why it trended" notes for Trending.

  python -m trivia.drafts split [--products 400] [--weeks 150]
      writes review/drafts/in/ix-NN.json and tr-NN.json, one per drafting agent
  python -m trivia.drafts merge
      reads review/drafts/out/*.json back into the review queues

Drafts sit beside the queue's own fields ("draft", "draftNotes") so nothing
a person has typed is overwritten. They are only suggestions: the review page
labels them and nothing reaches a bank without being accepted.
"""

import argparse
import json
import sys
from pathlib import Path

TRENDING_NOTE_TOP = 15  # notes for the articles a reviewer realistically picks from
PRODUCT_BATCH = 100
WEEK_BATCH = 25


def _read(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _write(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def spread(items: list, n: int) -> list:
    """n items evenly spaced through the list, first and last included."""
    if n >= len(items):
        return list(items)
    if n == 1:
        return [items[0]]
    return [items[round(i * (len(items) - 1) / (n - 1))] for i in range(n)]


def _chunks(items: list, size: int) -> list[list]:
    return [items[i:i + size] for i in range(0, len(items), size)]


def split_batches(root: Path, products: int = 400, weeks: int = 150,
                  product_batch: int = PRODUCT_BATCH, week_batch: int = WEEK_BATCH) -> list[Path]:
    """Write the inputs for each drafting agent. Products: the most scanned first.
    Weeks: spread across the years so every era gets some."""
    root = Path(root)
    out = root / "review/drafts/in"
    written = []

    queue = [q for q in _read(root / "review/ingredient-x.json") if q["status"] == "pending"]
    picked = [{k: q[k] for k in ("code", "name", "brands", "category", "ingredients")} for q in queue[:products]]
    for i, batch in enumerate(_chunks(picked, product_batch), 1):
        path = out / f"ix-{i:02}.json"
        _write(path, batch)
        written.append(path)

    weeks_q = [w for w in _read(root / "review/trending.json") if w["status"] == "pending"]
    chosen = [{"week": w["week"], "titles": [t for t, _ in w["top"][:TRENDING_NOTE_TOP]]}
              for w in spread(weeks_q, weeks)]
    for i, batch in enumerate(_chunks(chosen, week_batch), 1):
        path = out / f"tr-{i:02}.json"
        _write(path, batch)
        written.append(path)
    return written


def merge_drafts(root: Path) -> dict[str, int]:
    """Attach every finished draft to its queue item. Returns items updated per game."""
    root = Path(root)
    out = root / "review/drafts/out"
    counts = {"ingredient-x": 0, "trending": 0}

    ix_path = root / "review/ingredient-x.json"
    ix = _read(ix_path)
    by_code = {q["code"]: q for q in ix}
    for f in sorted(out.glob("ix-*.json")):
        for d in _read(f):
            item = by_code.get(str(d.get("code")))
            if item is None or not (d.get("name") or d.get("fact")):
                continue
            item["draft"] = {"name": d.get("name", ""), "aliases": d.get("aliases", []), "fact": d.get("fact", "")}
            counts["ingredient-x"] += 1
    _write(ix_path, ix)

    tr_path = root / "review/trending.json"
    tr = _read(tr_path)
    by_week = {w["week"]: w for w in tr}
    for f in sorted(out.glob("tr-*.json")):
        for d in _read(f):
            week = by_week.get(d.get("week"))
            if week is None:
                continue
            titles = {t for t, _ in week["top"]}
            notes = {t: n for t, n in d.get("notes", {}).items() if t in titles and n.strip()}
            if notes:
                week["draftNotes"] = notes
                counts["trending"] += 1
    _write(tr_path, tr)
    return counts


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="trivia.drafts")
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("split")
    s.add_argument("--products", type=int, default=400)
    s.add_argument("--weeks", type=int, default=150)
    sub.add_parser("merge")
    for p in sub.choices.values():
        p.add_argument("--root", type=Path, default=Path.cwd())
    args = ap.parse_args(argv)

    if args.cmd == "split":
        for path in split_batches(args.root, args.products, args.weeks):
            print(path)
    else:
        print(merge_drafts(args.root))
    return 0


if __name__ == "__main__":
    sys.exit(main())
