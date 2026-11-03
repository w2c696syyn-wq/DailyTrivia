"""Answer lists: every accepted answer for a game, with its aliases.

The site fuzzy-searches this list in the browser while the player types, so
aliases must never clash between two different answers.
"""

import re
import unicodedata
from dataclasses import dataclass


@dataclass(frozen=True)
class Answer:
    id: str
    name: str
    aliases: tuple[str, ...]  # normalised, the name's own form first


def normalise(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = text.lower().replace("&", " and ").replace("'", "")
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return text.strip()


def slugify(name: str) -> str:
    return normalise(name).replace(" ", "-")


def build_answer_list(entries: list[dict]) -> list[Answer]:
    """entries: [{"name": ..., "aliases": [...]}] from the reviewed bank."""
    answers, owner_of = [], {}
    for e in entries:
        aid = e.get("id") or slugify(e["name"])
        if any(a.id == aid for a in answers):
            raise ValueError(f"duplicate answer id {aid!r}")
        aliases = tuple(dict.fromkeys(normalise(s) for s in [e["name"], *e.get("aliases", [])]))
        for alias in aliases:
            if alias in owner_of:
                raise ValueError(f"alias {alias!r} belongs to both {owner_of[alias]!r} and {aid!r}")
            owner_of[alias] = aid
        answers.append(Answer(aid, e["name"], aliases))
    return answers
