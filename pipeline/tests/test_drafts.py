import json

import pytest

from trivia.drafts import TRENDING_NOTE_TOP, merge_drafts, spread, split_batches


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data), encoding="utf-8")


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


@pytest.fixture
def root(tmp_path):
    write(tmp_path / "review/ingredient-x.json", [
        {"code": str(i), "name": f"PRODUCT {i}", "brands": "B", "category": "crisps",
         "ingredients": "Potatoes, oil, salt", "scans": 100 - i, "lines": ["salt", "oil", "Potatoes"],
         "status": "pending"}
        for i in range(10)
    ])
    write(tmp_path / "review/trending.json", [
        {"week": f"2019-{m:02}-07", "top": [[f"A{m}_{j}", 100 - j] for j in range(20)], "status": "pending"}
        for m in range(1, 11)
    ])
    return tmp_path


def test_spread_picks_evenly_and_keeps_the_ends():
    assert spread(list(range(10)), 4) == [0, 3, 6, 9]
    assert spread(list(range(3)), 5) == [0, 1, 2]


def test_split_writes_compact_batches(root):
    paths = split_batches(root, products=5, weeks=4, product_batch=2, week_batch=3)
    names = sorted(p.name for p in paths)
    assert names == ["ix-01.json", "ix-02.json", "ix-03.json", "tr-01.json", "tr-02.json"]
    ix = read(root / "review/drafts/in/ix-01.json")
    assert ix == [
        {"code": "0", "name": "PRODUCT 0", "brands": "B", "category": "crisps", "ingredients": "Potatoes, oil, salt"},
        {"code": "1", "name": "PRODUCT 1", "brands": "B", "category": "crisps", "ingredients": "Potatoes, oil, salt"},
    ]
    tr = read(root / "review/drafts/in/tr-01.json")
    assert tr[0]["week"] == "2019-01-07"
    assert len(tr[0]["titles"]) == TRENDING_NOTE_TOP


def test_merge_attaches_drafts_without_touching_reviewed_fields(root):
    write(root / "review/drafts/out/ix-01.json", [
        {"code": "1", "name": "Product One", "aliases": ["one"], "fact": "A fact."},
        {"code": "999", "name": "Ghost", "aliases": [], "fact": "No such product."},
    ])
    write(root / "review/drafts/out/tr-01.json", [
        {"week": "2019-02-07", "notes": {"A2_0": "Why it trended.", "Not_in_top": "x"}},
    ])
    counts = merge_drafts(root)
    assert counts == {"ingredient-x": 1, "trending": 1}

    ix = read(root / "review/ingredient-x.json")
    assert ix[1]["name"] == "PRODUCT 1"  # the reviewer's field is untouched
    assert ix[1]["draft"] == {"name": "Product One", "aliases": ["one"], "fact": "A fact."}
    assert "draft" not in ix[0]

    tr = read(root / "review/trending.json")
    assert tr[1]["draftNotes"] == {"A2_0": "Why it trended."}


def test_merge_skips_blank_drafts(root):
    write(root / "review/drafts/out/ix-01.json", [{"code": "2", "name": "", "aliases": [], "fact": ""}])
    merge_drafts(root)
    assert "draft" not in read(root / "review/ingredient-x.json")[2]


def test_merge_keeps_queue_progress(root):
    q = read(root / "review/ingredient-x.json")
    q[3]["status"] = "rejected"
    write(root / "review/ingredient-x.json", q)
    write(root / "review/drafts/out/ix-02.json", [{"code": "3", "name": "Three", "aliases": [], "fact": "F."}])
    merge_drafts(root)
    assert read(root / "review/ingredient-x.json")[3]["status"] == "rejected"
