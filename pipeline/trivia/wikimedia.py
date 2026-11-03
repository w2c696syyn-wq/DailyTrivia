"""Fetch English Wikipedia's daily most-read lists from the Wikimedia pageviews API.

A one-off backfill (mid-2015 onwards) plus a small top-up each month. Each day
is cached as its own JSON file, so a rerun only asks for what is missing.
Wikimedia asks for a descriptive User-Agent with contact details: set the
TRIVIA_CONTACT environment variable to an email or URL before a real run.
"""

import json
import os
import time
import urllib.error
import urllib.request
from datetime import date, timedelta
from pathlib import Path
from typing import Callable

API = "https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access"
FIRST_DAY = date(2015, 7, 1)

Get = Callable[[str], str]


class NotFound(Exception):
    """The API has no list for that day (a gap in Wikimedia's data)."""


def top_url(day: date) -> str:
    return f"{API}/{day.year}/{day.month:02}/{day.day:02}"


def http_get(url: str) -> str:
    contact = os.environ.get("TRIVIA_CONTACT")
    if not contact:
        raise RuntimeError("Set TRIVIA_CONTACT (an email or URL) so Wikimedia can reach you")
    req = urllib.request.Request(url, headers={"User-Agent": f"DailyTriviaPipeline/0.1 ({contact})"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            raise NotFound(url) from e
        raise
    time.sleep(0.1)  # stay well under the API's rate limit
    return body


def fetch_day(day: date, get: Get = http_get) -> list[tuple[str, int]]:
    body = json.loads(get(top_url(day)))
    return [(a["article"], a["views"]) for a in body["items"][0]["articles"]]


def fetch_range(start: date, end: date, cache_dir: Path, get: Get = http_get) -> dict[date, list[tuple[str, int]]]:
    """Every day from start to end inclusive, from cache where possible."""
    cache_dir = Path(cache_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)
    result = {}
    day = start
    while day <= end:
        path = cache_dir / f"{day.isoformat()}.json"
        if path.exists():
            rows = [tuple(r) for r in json.loads(path.read_text(encoding="utf-8"))]
        else:
            try:
                rows = fetch_day(day, get)
            except NotFound:
                rows = None
            if rows is not None:
                path.write_text(json.dumps(rows), encoding="utf-8")
        if rows is not None:
            result[day] = rows
        day += timedelta(days=1)
    return result
