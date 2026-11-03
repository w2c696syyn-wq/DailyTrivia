"""Pick which reviewed item runs on each day.

One rule serves every game: never reuse an item, and keep a group (Ingredient X
category, Trending year) out of any window of `gap` days. The plan is
seeded, so rebuilding a month gives the same answer.
"""

import random
from collections import deque
from datetime import date, timedelta
from typing import Callable, Hashable, TypeVar

T = TypeVar("T")


def schedule(items: list[T], start: date, days: int, group: Callable[[T], Hashable], *,
             gap: int = 7, seed: int = 0, recent: list[Hashable] = (), used: set[str] = frozenset(),
             item_id: Callable[[T], str] = lambda x: x["id"]) -> list[tuple[date, T]]:
    """`recent` = groups of the days just before `start`, oldest first;
    `used` = ids already scheduled in earlier months."""
    pool = [x for x in items if item_id(x) not in used]
    random.Random(seed).shuffle(pool)
    window = deque(list(recent)[-(gap - 1):] if gap > 1 else [], maxlen=max(gap - 1, 0))

    plan = []
    for i in range(days):
        day = start + timedelta(days=i)
        pick = next((x for x in pool if group(x) not in window), None)
        if pick is None:
            raise ValueError(f"nothing left to schedule on {day}: add to the bank or shorten the gap")
        pool.remove(pick)
        if window.maxlen:
            window.append(group(pick))
        plan.append((day, pick))
    return plan
