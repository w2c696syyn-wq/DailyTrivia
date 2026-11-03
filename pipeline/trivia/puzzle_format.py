"""The daily puzzle file format, one JSON object per game per day.

This is the source of truth for the format; the site checks files against it
and the nightly job runs validate_puzzle over the next 7 days.
"""

from datetime import date, timedelta

from trivia.ukdate import puzzle_number

MAX_LABEL_LINES = 8
TRENDING_ARTICLES = 10

COMMON_FIELDS = {"game": str, "number": int, "date": str}
GAME_FIELDS = {
    "ingredient-x": {"answerId": str, "category": str, "lines": list, "fact": str, "labelChecked": str},
    "trending": {"week": str, "articles": list},
}


def _parse_date(value, field, errors):
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        errors.append(f"{field}: not an ISO date ({value!r})")
        return None


def validate_puzzle(p: dict, launch: date, answer_ids: set[str]) -> list[str]:
    """Every problem with one puzzle, as readable messages. Empty list = valid."""
    errors: list[str] = []
    game = p.get("game")
    if game not in GAME_FIELDS:
        return [f"game: unknown game {game!r}"]

    for field, kind in {**COMMON_FIELDS, **GAME_FIELDS[game]}.items():
        if not isinstance(p.get(field), kind):
            errors.append(f"{field}: missing or not a {kind.__name__}")
    if errors:
        return errors

    day = _parse_date(p["date"], "date", errors)
    if day and day >= launch and p["number"] != puzzle_number(day, launch):
        errors.append(f"number: {p['number']} does not match date {day} (expected {puzzle_number(day, launch)})")
    elif day and day < launch:
        errors.append(f"date: {day} is before launch")

    if game == "ingredient-x":
        if p["answerId"] not in answer_ids:
            errors.append(f"answerId: {p['answerId']!r} is not in the answer list")
        lines = p["lines"]
        if not 1 <= len(lines) <= MAX_LABEL_LINES:
            errors.append(f"lines: {len(lines)} lines, need 1 to {MAX_LABEL_LINES}")
        if any(not isinstance(s, str) or not s.strip() for s in lines):
            errors.append("lines: blank line")

    elif game == "trending":
        week = _parse_date(p["week"], "week", errors)
        if week and week.weekday() != 0:
            errors.append(f"week: {week} is not a Monday")
        if week and day and week + timedelta(days=7) > date(day.year, 1, 1):
            errors.append(f"week: {week} is not from a past year")
        arts = p["articles"]
        if len(arts) != TRENDING_ARTICLES:
            errors.append(f"articles: {len(arts)} articles, need {TRENDING_ARTICLES}")
        if any(not (isinstance(a, dict) and a.get("title") and a.get("note")) for a in arts):
            errors.append("articles: each needs a title and a note")

    return errors


def check_upcoming(have: set[date], today: date, days: int = 7) -> list[date]:
    """UK dates in the next `days` (today included) with no puzzle file."""
    return [d for d in (today + timedelta(days=i) for i in range(days)) if d not in have]
