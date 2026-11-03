"""UK calendar date and puzzle numbering.

Every game resets at midnight UK time, so all players share one puzzle number.
The site's TypeScript twin of this module must agree with it; both are tested
against the same clock-change cases.
"""

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

UK = ZoneInfo("Europe/London")


def uk_date(instant: datetime) -> date:
    """The UK calendar date at a given moment."""
    if instant.tzinfo is None:
        raise ValueError("instant must be timezone-aware")
    return instant.astimezone(UK).date()


def puzzle_number(day: date, launch: date) -> int:
    """Puzzle #1 is the launch day; one puzzle per UK calendar day after that."""
    n = (day - launch).days + 1
    if n < 1:
        raise ValueError(f"{day} is before launch ({launch})")
    return n


def date_for_puzzle(n: int, launch: date) -> date:
    if n < 1:
        raise ValueError("puzzle numbers start at 1")
    return launch + timedelta(days=n - 1)
