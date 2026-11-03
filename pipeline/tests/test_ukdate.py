import json
from datetime import date, datetime, timezone
from pathlib import Path

import pytest

from trivia.ukdate import date_for_puzzle, puzzle_number, uk_date


def utc(*args):
    return datetime(*args, tzinfo=timezone.utc)


class TestUkDate:
    def test_winter_midnight_is_utc_midnight(self):
        assert uk_date(utc(2027, 1, 14, 23, 59, 59)) == date(2027, 1, 14)
        assert uk_date(utc(2027, 1, 15, 0, 0, 0)) == date(2027, 1, 15)

    def test_summer_day_starts_at_2300_utc(self):
        assert uk_date(utc(2027, 6, 30, 22, 59, 59)) == date(2027, 6, 30)
        assert uk_date(utc(2027, 6, 30, 23, 0, 0)) == date(2027, 7, 1)

    def test_night_clocks_go_forward(self):
        # BST starts 01:00 UTC on 28 Mar 2027; the day before is still GMT.
        assert uk_date(utc(2027, 3, 27, 23, 59, 59)) == date(2027, 3, 27)
        assert uk_date(utc(2027, 3, 28, 0, 0, 0)) == date(2027, 3, 28)

    def test_night_clocks_go_back(self):
        # BST ends 01:00 UTC on 31 Oct 2027; that day began at 23:00 UTC on the 30th.
        assert uk_date(utc(2027, 10, 30, 22, 59, 59)) == date(2027, 10, 30)
        assert uk_date(utc(2027, 10, 30, 23, 0, 0)) == date(2027, 10, 31)
        assert uk_date(utc(2027, 10, 31, 23, 59, 59)) == date(2027, 10, 31)
        assert uk_date(utc(2027, 11, 1, 0, 0, 0)) == date(2027, 11, 1)

    def test_rejects_naive_datetime(self):
        with pytest.raises(ValueError):
            uk_date(datetime(2027, 1, 1, 12, 0))


class TestPuzzleNumber:
    LAUNCH = date(2027, 3, 1)

    def test_launch_day_is_puzzle_one(self):
        assert puzzle_number(self.LAUNCH, self.LAUNCH) == 1

    def test_counts_calendar_days_across_clock_change(self):
        # 23-hour day on 28 Mar must still count as one puzzle.
        assert puzzle_number(date(2027, 3, 28), self.LAUNCH) == 28
        assert puzzle_number(date(2027, 3, 29), self.LAUNCH) == 29

    def test_before_launch_is_an_error(self):
        with pytest.raises(ValueError):
            puzzle_number(date(2027, 2, 28), self.LAUNCH)

    def test_round_trip(self):
        for n in (1, 2, 28, 245, 1000):
            assert puzzle_number(date_for_puzzle(n, self.LAUNCH), self.LAUNCH) == n


SHARED = json.loads((Path(__file__).parents[2] / "shared/ukdate-cases.json").read_text(encoding="utf-8"))


@pytest.mark.parametrize("case", SHARED["ukDate"], ids=lambda c: c["utc"])
def test_shared_uk_date_cases(case):
    instant = datetime.fromisoformat(case["utc"].replace("Z", "+00:00"))
    assert uk_date(instant).isoformat() == case["uk"], case["why"]


@pytest.mark.parametrize("case", SHARED["puzzleNumber"], ids=lambda c: c["day"])
def test_shared_puzzle_number_cases(case):
    assert puzzle_number(date.fromisoformat(case["day"]), date.fromisoformat(case["launch"])) == case["n"]
