import json

import pytest

from trivia.bank import merge


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data), encoding="utf-8")


def bank_of(root, game):
    return json.loads((root / "content" / game / "bank.json").read_text(encoding="utf-8"))


def item(name, **kw):
    return {"name": name, "aliases": [], "category": "crisps", "ingredients": "a, b, c",
            "lines": ["c", "b", "a"], "fact": "f", "labelChecked": "2026", **kw}


def test_merge_into_empty_bank(tmp_path):
    src = tmp_path / "ix.accepted.json"
    write(src, [item("Hula Hoops")])
    assert merge(tmp_path, "ingredient-x", src) == (1, 0)
    assert [x["name"] for x in bank_of(tmp_path, "ingredient-x")] == ["Hula Hoops"]


def test_merge_skips_items_already_banked(tmp_path):
    write(tmp_path / "content/ingredient-x/bank.json", [item("Hula Hoops")])
    src = tmp_path / "ix.accepted.json"
    write(src, [item("HULA HOOPS"), item("Quavers")])
    assert merge(tmp_path, "ingredient-x", src) == (1, 1)
    assert len(bank_of(tmp_path, "ingredient-x")) == 2


def test_merge_rejects_alias_clash(tmp_path):
    write(tmp_path / "content/ingredient-x/bank.json", [item("Quavers", aliases=["Cheesy Quavers"])])
    src = tmp_path / "ix.accepted.json"
    write(src, [item("Cheesy Quavers")])
    with pytest.raises(ValueError, match="cheesy quavers"):
        merge(tmp_path, "ingredient-x", src)
    assert len(bank_of(tmp_path, "ingredient-x")) == 1  # unchanged


def test_merge_trending_by_week(tmp_path):
    week = {"week": "2019-07-15", "articles": [{"title": f"A{i}", "note": "n"} for i in range(10)]}
    src = tmp_path / "tr.accepted.json"
    write(src, [week, week])
    assert merge(tmp_path, "trending", src) == (1, 1)
