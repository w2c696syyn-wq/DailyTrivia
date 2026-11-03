import json
from pathlib import Path

import pytest

from trivia.answers import Answer, build_answer_list, normalise, slugify


def test_normalise_ignores_case_accents_and_punctuation():
    assert normalise("  Maltesers®  ") == "maltesers"
    assert normalise("Crème Egg") == "creme egg"
    assert normalise("Ben & Jerry's") == "ben and jerrys"


def test_slugify():
    assert slugify("Walkers Ready Salted") == "walkers-ready-salted"
    assert slugify("Ben & Jerry's Cookie Dough") == "ben-and-jerrys-cookie-dough"


def test_build_answer_list_adds_name_to_its_own_aliases():
    [a] = build_answer_list([{"name": "Nutella", "aliases": ["Nutella hazelnut spread"]}])
    assert a == Answer(id="nutella", name="Nutella", aliases=("nutella", "nutella hazelnut spread"))


def test_alias_clash_between_answers_is_an_error():
    with pytest.raises(ValueError, match="hobnobs"):
        build_answer_list([
            {"name": "McVitie's Hobnobs", "aliases": ["Hobnobs"]},
            {"name": "McVitie's Chocolate Hobnobs", "aliases": ["Hobnobs"]},
        ])


def test_duplicate_id_is_an_error():
    with pytest.raises(ValueError, match="nutella"):
        build_answer_list([{"name": "Nutella"}, {"name": "nutella"}])


SHARED = json.loads((Path(__file__).parents[2] / "shared/normalise-cases.json").read_text(encoding="utf-8"))


@pytest.mark.parametrize("case", SHARED["cases"], ids=lambda c: c["in"])
def test_shared_normalise_cases(case):
    assert normalise(case["in"]) == case["out"]
