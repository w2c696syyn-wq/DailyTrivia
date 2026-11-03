import json
from datetime import date, timedelta

import pytest

from trivia.build import build, check, main

LAUNCH = date(2027, 3, 1)
CRISPS = "Potatoes, sunflower oil (30%), salt (1.5%), dextrose"


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data), encoding="utf-8")


@pytest.fixture
def root(tmp_path):
    write(tmp_path / "content/games.json", {
        "ingredient-x": {"launch": LAUNCH.isoformat()},
        "trending": {"launch": LAUNCH.isoformat()},
    })
    cats = ["crisps", "spreads", "biscuits", "cereals", "drinks", "sweets", "sauces", "yoghurts"]
    write(tmp_path / "content/ingredient-x/bank.json", [
        {"name": f"Product {c} {i}", "aliases": [], "category": c, "ingredients": CRISPS,
         "fact": "A fact.", "labelChecked": "2026"}
        for c in cats for i in range(3)
    ])
    weeks = [date(2016, 1, 4) + timedelta(weeks=26 * i) for i in range(20)]
    write(tmp_path / "content/trending/bank.json", [
        {"week": w.isoformat(), "articles": [{"title": f"A{j}", "note": "n"} for j in range(10)]}
        for w in weeks
    ])
    return tmp_path


def test_build_writes_one_valid_file_per_day(root):
    written = build(root, "ingredient-x", LAUNCH, days=10, seed=1)
    assert len(written) == 10
    p = json.loads((root / "puzzles/ingredient-x/2027-03-01.json").read_text(encoding="utf-8"))
    assert p["number"] == 1
    assert p["lines"] == ["salt, dextrose", "sunflower oil", "Potatoes"]
    assert check(root, "ingredient-x", today=LAUNCH, days=10) == []


def test_hand_edited_lines_win(root):
    path = root / "content/ingredient-x/bank.json"
    bank = json.loads(path.read_text(encoding="utf-8"))
    for item in bank:
        item["lines"] = ["vitamins", "corn"]
    write(path, bank)
    build(root, "ingredient-x", LAUNCH, days=1, seed=1)
    p = json.loads((root / "puzzles/ingredient-x/2027-03-01.json").read_text(encoding="utf-8"))
    assert p["lines"] == ["vitamins", "corn"]


def test_build_writes_answer_list(root):
    build(root, "ingredient-x", LAUNCH, days=1, seed=1)
    answers = json.loads((root / "site/public/answers/ingredient-x.json").read_text(encoding="utf-8"))
    assert len(answers) == 24
    assert {"id", "name", "aliases"} <= set(answers[0])


def test_second_month_continues_without_repeats(root):
    build(root, "ingredient-x", LAUNCH, days=10, seed=1)
    build(root, "ingredient-x", LAUNCH + timedelta(days=10), days=10, seed=2)
    ids = [json.loads(f.read_text(encoding="utf-8"))["answerId"]
           for f in sorted((root / "puzzles/ingredient-x").glob("*.json"))]
    assert len(ids) == 20 == len(set(ids))


def test_build_refuses_to_overwrite(root):
    build(root, "ingredient-x", LAUNCH, days=3, seed=1)
    with pytest.raises(FileExistsError):
        build(root, "ingredient-x", LAUNCH + timedelta(days=2), days=3, seed=1)


def test_trending_build(root):
    build(root, "trending", LAUNCH, days=7, seed=1)
    years = [json.loads(f.read_text(encoding="utf-8"))["week"][:4]
             for f in sorted((root / "puzzles/trending").glob("*.json"))]
    assert len(set(years)) == 7  # a spread of years within any week
    assert check(root, "trending", today=LAUNCH, days=7) == []


def test_check_reports_gaps_and_bad_files(root):
    build(root, "ingredient-x", LAUNCH, days=3, seed=1)
    bad = root / "puzzles/ingredient-x/2027-03-02.json"
    p = json.loads(bad.read_text(encoding="utf-8"))
    p["lines"] = []
    bad.write_text(json.dumps(p), encoding="utf-8")
    problems = check(root, "ingredient-x", today=LAUNCH, days=5)
    assert any("2027-03-02" in s and "lines" in s for s in problems)
    assert any("2027-03-04" in s and "missing" in s for s in problems)


def test_check_ignores_days_before_launch(root):
    assert check(root, "ingredient-x", today=LAUNCH - timedelta(days=30), days=7) == []
    assert check(root, "ingredient-x", today=LAUNCH - timedelta(days=2), days=3) == [
        "ingredient-x 2027-03-01: missing"]


def test_unlaunched_game_needs_nothing_and_cannot_build(root):
    write(root / "content/games.json", {"ingredient-x": {"launch": None}, "trending": {"launch": None}})
    assert check(root, "ingredient-x", today=LAUNCH) == []
    with pytest.raises(ValueError, match="launch date"):
        build(root, "ingredient-x", LAUNCH, days=3)


def test_cli_check_exit_code(root, capsys):
    assert main(["check", "--root", str(root), "--today", "2027-03-01"]) == 1
    build(root, "ingredient-x", LAUNCH, days=7, seed=1)
    build(root, "trending", LAUNCH, days=7, seed=1)
    assert main(["check", "--root", str(root), "--today", "2027-03-01"]) == 0
