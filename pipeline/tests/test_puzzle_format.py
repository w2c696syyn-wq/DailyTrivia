from datetime import date

from trivia.puzzle_format import check_upcoming, validate_puzzle

LAUNCH = date(2027, 3, 1)
ANSWERS = {"nutella", "walkers-ready-salted"}


def ingredient_x(**over):
    p = {
        "game": "ingredient-x",
        "number": 3,
        "date": "2027-03-03",
        "answerId": "nutella",
        "category": "spread",
        "lines": ["vanillin", "emulsifier: lecithins (soya)", "fat-reduced cocoa",
                  "skimmed milk powder", "hazelnuts", "palm oil", "sugar"],
        "fact": "Launched in 1964.",
        "labelChecked": "2026",
    }
    p.update(over)
    return p


def trending(**over):
    p = {
        "game": "trending",
        "number": 3,
        "date": "2027-03-03",
        "week": "2019-07-15",
        "articles": [{"title": f"Article {i}", "note": "why"} for i in range(10)],
    }
    p.update(over)
    return p


class TestValidatePuzzle:
    def test_valid_puzzles_have_no_errors(self):
        assert validate_puzzle(ingredient_x(), LAUNCH, ANSWERS) == []
        assert validate_puzzle(trending(), LAUNCH, ANSWERS) == []

    def test_number_must_match_date(self):
        errs = validate_puzzle(ingredient_x(number=4), LAUNCH, ANSWERS)
        assert any("number" in e for e in errs)

    def test_unknown_answer(self):
        errs = validate_puzzle(ingredient_x(answerId="marmite"), LAUNCH, ANSWERS)
        assert any("answerId" in e for e in errs)

    def test_label_line_limits(self):
        assert validate_puzzle(ingredient_x(lines=["a"] * 9), LAUNCH, ANSWERS)
        assert validate_puzzle(ingredient_x(lines=[]), LAUNCH, ANSWERS)
        assert validate_puzzle(ingredient_x(lines=["a", " "]), LAUNCH, ANSWERS)

    def test_missing_field(self):
        p = ingredient_x()
        del p["category"]
        assert any("category" in e for e in validate_puzzle(p, LAUNCH, ANSWERS))

    def test_trending_needs_ten_articles_and_a_monday(self):
        assert validate_puzzle(trending(articles=trending()["articles"][:9]), LAUNCH, ANSWERS)
        assert validate_puzzle(trending(week="2019-07-16"), LAUNCH, ANSWERS)

    def test_trending_week_must_be_in_the_past(self):
        assert validate_puzzle(trending(week="2027-03-01"), LAUNCH, ANSWERS)

    def test_unknown_game(self):
        assert validate_puzzle(ingredient_x(game="chess"), LAUNCH, ANSWERS)


class TestCheckUpcoming:
    def test_reports_missing_days(self):
        have = {date(2027, 3, 3), date(2027, 3, 4), date(2027, 3, 6)}
        assert check_upcoming(have, today=date(2027, 3, 3), days=4) == [date(2027, 3, 5)]

    def test_full_buffer(self):
        have = {date(2027, 3, d) for d in range(1, 20)}
        assert check_upcoming(have, today=date(2027, 3, 3)) == []
