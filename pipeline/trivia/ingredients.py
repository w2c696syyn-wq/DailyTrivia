"""Turn an Open Food Facts ingredients string into Ingredient X label lines.

UK labels list ingredients by weight, biggest first, except that anything
under 2% may come in any order at the end. The game reveals smallest first,
so those minor ingredients become one opening line.
"""

import html
import re

from trivia.puzzle_format import MAX_LABEL_LINES

MINOR_PERCENT = 2.0
_PERCENT = re.compile(r"\s*\(?\s*(\d+(?:[.,]\d+)?)\s*%\s*\)?")
_OPEN, _CLOSE = "([{", ")]}"


def clean_text(text: str) -> str:
    """Remove Open Food Facts markup: allergen <span>s, _underscores_, HTML entities."""
    text = re.sub(r"<[^>]+>", "", html.unescape(text))
    return re.sub(r"(?<!\w)_+|_+(?!\w)", "", text)


def _tidy(part: str) -> str:
    part = re.sub(r"\s+", " ", part).strip().rstrip(".").strip()
    if part.isupper():
        part = part.capitalize()
    return part


def split_ingredients(text: str) -> list[str]:
    """Split on commas/semicolons that are not inside brackets; tidy each part."""
    text = clean_text(text)
    parts, depth, current = [], 0, []
    for i, ch in enumerate(text):
        if ch in _OPEN:
            depth += 1
        elif ch in _CLOSE:
            depth = max(0, depth - 1)
        decimal_comma = ch == "," and 0 < i < len(text) - 1 and text[i - 1].isdigit() and text[i + 1].isdigit()
        if ch in ",;" and depth == 0 and not decimal_comma:
            parts.append("".join(current))
            current = []
        else:
            current.append(ch)
    parts.append("".join(current))
    tidy = (_tidy(p) for p in parts)
    return [p for p in tidy if p]


_WORDY_GROUP = re.compile(r"[(\[][^()\[\]]*[A-Za-z][^()\[\]]*[)\]]")


def _own_percent(ingredient: str) -> re.Match | None:
    """The ingredient's own percentage, ignoring ones inside its sub-ingredient
    list: "milk chocolate (cocoa solids 1%)" is not itself 1%."""
    masked = _WORDY_GROUP.sub(lambda m: "#" * len(m.group()), ingredient)
    return _PERCENT.search(masked)


def _percent(ingredient: str) -> float | None:
    m = _own_percent(ingredient)
    return float(m.group(1).replace(",", ".")) if m else None


def _without_percent(ingredient: str) -> str:
    m = _own_percent(ingredient)
    if not m:
        return ingredient
    return re.sub(r"\s+", " ", ingredient[:m.start()] + " " + ingredient[m.end():]).strip()


def label_lines(text: str, max_lines: int = MAX_LABEL_LINES) -> list[str]:
    """Label lines in reveal order: the minor-ingredient group first, biggest last."""
    items = split_ingredients(text)
    # Labels are in weight order, so everything after the first ingredient
    # stated as under 2% is also under 2%.
    minor_from = next((i for i, s in enumerate(items)
                       if (p := _percent(s)) is not None and p < MINOR_PERCENT), len(items))
    shown = [_without_percent(s) for s in items]

    major, minor = shown[:minor_from], shown[minor_from:]
    # Too many lines: fold the smallest majors into the opening group.
    room = max_lines - (1 if minor else 0)
    while len(major) > room:
        minor.insert(0, major.pop())
        room = max_lines - 1

    lines = list(reversed(major))
    if minor:
        lines.insert(0, ", ".join(minor))
    return lines
