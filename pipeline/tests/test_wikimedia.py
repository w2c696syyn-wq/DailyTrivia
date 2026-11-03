import json
from datetime import date

import pytest

from trivia import wikimedia
from trivia.wikimedia import fetch_day, fetch_range, top_url


def api_body(day, rows):
    return json.dumps({"items": [{
        "project": "en.wikipedia", "access": "all-access",
        "year": f"{day.year}", "month": f"{day.month:02}", "day": f"{day.day:02}",
        "articles": [{"article": t, "views": v, "rank": i + 1} for i, (t, v) in enumerate(rows)],
    }]})


class FakeGet:
    def __init__(self, rows=(("Area_51", 5),)):
        self.urls = []
        self.rows = rows

    def __call__(self, url):
        self.urls.append(url)
        y, m, d = url.rsplit("/", 3)[1:]
        return api_body(date(int(y), int(m), int(d)), self.rows)


def test_url_is_zero_padded():
    assert top_url(date(2019, 7, 5)).endswith("/en.wikipedia/all-access/2019/07/05")


def test_fetch_day_parses_articles():
    assert fetch_day(date(2019, 7, 15), FakeGet()) == [("Area_51", 5)]


def test_fetch_range_caches_each_day(tmp_path):
    get = FakeGet()
    first = fetch_range(date(2019, 7, 15), date(2019, 7, 17), tmp_path, get)
    assert sorted(first) == [date(2019, 7, 15), date(2019, 7, 16), date(2019, 7, 17)]
    assert len(get.urls) == 3

    again = fetch_range(date(2019, 7, 15), date(2019, 7, 17), tmp_path, get)
    assert again == first
    assert len(get.urls) == 3  # served from cache


def test_missing_day_is_skipped_not_fatal(tmp_path):
    def get(url):
        raise wikimedia.NotFound(url)
    assert fetch_range(date(2019, 7, 15), date(2019, 7, 15), tmp_path, get) == {}


def test_real_requests_need_a_contact(monkeypatch):
    monkeypatch.delenv("TRIVIA_CONTACT", raising=False)
    with pytest.raises(RuntimeError, match="TRIVIA_CONTACT"):
        wikimedia.http_get("https://example.invalid")
