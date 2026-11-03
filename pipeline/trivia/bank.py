"""Merge items accepted in review into a game's bank.

  python -m trivia.bank merge ingredient-x path/to/ingredient-x.accepted.json
"""

import argparse
import json
import sys
from pathlib import Path

from trivia.answers import build_answer_list, normalise

KEY = {
    "ingredient-x": lambda x: normalise(x["name"]),
    "trending": lambda x: x["week"],
}


def merge(root: Path, game: str, accepted: Path) -> tuple[int, int]:
    """Append new items to content/<game>/bank.json. Returns (added, skipped)."""
    path = Path(root) / "content" / game / "bank.json"
    bank = json.loads(path.read_text(encoding="utf-8")) if path.exists() else []
    key = KEY[game]
    seen = {key(x) for x in bank}

    added = skipped = 0
    for item in json.loads(Path(accepted).read_text(encoding="utf-8")):
        if key(item) in seen:
            skipped += 1
            continue
        seen.add(key(item))
        bank.append(item)
        added += 1

    if game == "ingredient-x":
        build_answer_list(bank)  # raises on alias clashes before anything is written

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(bank, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return added, skipped


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="trivia.bank")
    sub = ap.add_subparsers(dest="cmd", required=True)
    m = sub.add_parser("merge")
    m.add_argument("game", choices=sorted(KEY))
    m.add_argument("accepted", type=Path)
    m.add_argument("--root", type=Path, default=Path.cwd())
    args = ap.parse_args(argv)
    added, skipped = merge(args.root, args.game, args.accepted)
    print(f"added {added}, skipped {skipped} already in the bank")
    return 0


if __name__ == "__main__":
    sys.exit(main())
