import json
from datetime import date, timedelta

from trivia import candidates
from trivia.off_candidates import Candidate


def test_ingredient_x_queue_has_preview_lines_and_skips_banked(tmp_path, monkeypatch):
    monkeypatch.setattr(candidates, "find_candidates", lambda *a, **k: [
        Candidate("1", "Nutella", "Ferrero", "hazelnut-spreads", "Sugar, palm oil, salt (1%)", 900),
        Candidate("2", "Walkers Ready Salted", "Walkers &amp; Co", "crisps", "Potatoes, oil, salt", 800),
    ])
    bank = tmp_path / "content/ingredient-x/bank.json"
    bank.parent.mkdir(parents=True)
    bank.write_text(json.dumps([{"name": "Nutella", "category": "spreads"}]), encoding="utf-8")

    out = candidates.ingredient_x_queue(tmp_path, "food.parquet", min_scans=1)
    queue = json.loads(out.read_text(encoding="utf-8"))
    assert [q["name"] for q in queue] == ["Walkers Ready Salted"]
    assert queue[0]["lines"] == ["salt", "oil", "Potatoes"]
    assert queue[0]["status"] == "pending"
    assert queue[0]["brands"] == "Walkers & Co"


def test_trending_queue_has_weekly_top_lists(tmp_path, monkeypatch):
    mon = date(2019, 7, 15)
    daily = {mon + timedelta(days=i): [("Area_51", 10), ("Main_Page", 99)] for i in range(7)}
    monkeypatch.setattr(candidates, "fetch_range", lambda *a, **k: daily)

    out = candidates.trending_queue(tmp_path, mon, mon + timedelta(days=6))
    queue = json.loads(out.read_text(encoding="utf-8"))
    assert queue == [{"week": "2019-07-15", "top": [["Area_51", 70]], "status": "pending"}]
