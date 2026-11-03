"""Trending: turn Wikimedia daily top-article lists into weekly top lists.

The daily lists come from the pageviews "top" endpoint, one call per day:
https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/YYYY/MM/DD
Titles use underscores, exactly as the API returns them.
"""

import re
from collections import defaultdict
from datetime import date, timedelta

WEEKLY_TOP = 50

# Only real namespaces: article titles can contain a colon too ("Avengers:_Endgame").
SITE_NAMESPACES = {"Special", "Wikipedia", "File", "Portal", "Help", "Template", "Category",
                   "User", "Talk", "Draft", "Module", "MediaWiki"}
# A four-digit year standing alone, so "Apollo_11" and "Area_51" survive.
_YEAR = re.compile(r"(?<!\d)(1[89]\d\d|20\d\d)(?!\d)")

# Pages near the top of every week's list, which would make every puzzle look alike.
ALWAYS_POPULAR = {"Google", "YouTube", "Facebook", "Wikipedia", "Cleopatra", "XXX", "Pornhub"}


def is_excluded(title: str) -> bool:
    """True for titles that should never appear in a Trending puzzle.

    The hand check for sensitive weeks happens later; this is the automatic pass.
    """
    if title.split(":", 1)[0] in SITE_NAMESPACES or title in ALWAYS_POPULAR:
        return True
    # Main_Page has no namespace but is a site page all the same.
    if title == "Main_Page":
        return True
    # A year in the title gives the answer away ("2019_Cricket_World_Cup").
    return bool(_YEAR.search(title))


def weekly_top(daily: dict[date, list[tuple[str, int]]], n: int = WEEKLY_TOP) -> dict[date, list[tuple[str, int]]]:
    """Sum each Monday-to-Sunday week's daily views; keep complete weeks only."""
    views: dict[date, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    days_seen: dict[date, set[date]] = defaultdict(set)
    for day, rows in daily.items():
        monday = day - timedelta(days=day.weekday())
        days_seen[monday].add(day)
        for title, count in rows:
            if not is_excluded(title):
                views[monday][title] += count

    return {
        monday: sorted(views[monday].items(), key=lambda kv: (-kv[1], kv[0]))[:n]
        for monday in sorted(views)
        if len(days_seen[monday]) == 7
    }
