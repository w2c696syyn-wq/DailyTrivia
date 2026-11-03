from datetime import date, timedelta

import pytest

from trivia.schedule import schedule

START = date(2027, 3, 1)


def bank(n_per_group, groups):
    return [{"id": f"{g}-{i}", "group": g} for g in groups for i in range(n_per_group)]


def test_fills_every_day_once_and_never_repeats_an_item():
    items = bank(10, "abcdefgh")
    plan = schedule(items, START, days=60, group=lambda x: x["group"], seed=1)
    assert [d for d, _ in plan] == [START + timedelta(days=i) for i in range(60)]
    ids = [x["id"] for _, x in plan]
    assert len(set(ids)) == 60


def test_same_group_never_within_gap():
    plan = schedule(bank(10, "abcdefgh"), START, days=60, group=lambda x: x["group"], gap=7, seed=2)
    groups = [x["group"] for _, x in plan]
    for i in range(len(groups)):
        assert groups[i] not in groups[max(0, i - 6):i]


def test_respects_recent_history():
    items = bank(5, "abcdefgh")
    plan = schedule(items, START, days=1, group=lambda x: x["group"], gap=7, seed=3,
                    recent=["a", "b", "c", "d", "e", "f"], used={"g-0", "g-1", "g-2", "g-3", "g-4"})
    assert plan[0][1]["group"] == "h"


def test_same_seed_same_plan():
    items = bank(10, "abcdefgh")
    one = schedule(items, START, days=20, group=lambda x: x["group"], seed=9)
    two = schedule(items, START, days=20, group=lambda x: x["group"], seed=9)
    assert one == two


def test_runs_out_loudly():
    with pytest.raises(ValueError, match="2027-03-0"):
        schedule(bank(1, "abc"), START, days=5, group=lambda x: x["group"], seed=1)
