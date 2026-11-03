from trivia.ingredients import label_lines, split_ingredients

NUTELLA = ("Sugar, palm oil, hazelnuts (13%), skimmed milk powder (8.7%), "
           "fat-reduced cocoa (7.4%), emulsifier: lecithins (soya), vanillin.")


class TestSplit:
    def test_top_level_commas_only(self):
        assert split_ingredients("Flour (wheat, calcium, iron), sugar, salt") == [
            "Flour (wheat, calcium, iron)", "sugar", "salt"]

    def test_tidies_whitespace_and_full_stop(self):
        assert split_ingredients("  Potatoes ,  sunflower   oil ,salt. ") == [
            "Potatoes", "sunflower oil", "salt"]

    def test_semicolons_and_square_brackets(self):
        assert split_ingredients("Milk chocolate [sugar, cocoa]; wheat flour") == [
            "Milk chocolate [sugar, cocoa]", "wheat flour"]

    def test_decimal_comma_does_not_split(self):
        assert split_ingredients("fat-reduced cocoa powder 7,5%, chickpeas") == [
            "fat-reduced cocoa powder 7,5%", "chickpeas"]

    def test_strips_open_food_facts_markup(self):
        text = 'whey powder (<span class="allergen">milk</span>), _hazelnuts_, flavour &amp; colour'
        assert split_ingredients(text) == ["whey powder (milk)", "hazelnuts", "flavour & colour"]

    def test_all_caps_becomes_sentence_case(self):
        assert split_ingredients("SUGAR, PALM OIL, Skimmed MILK") == ["Sugar", "Palm oil", "Skimmed MILK"]

    def test_empty(self):
        assert split_ingredients("") == []


class TestLabelLines:
    def test_smallest_first(self):
        lines = label_lines(NUTELLA)
        assert lines[0] == "vanillin"
        assert lines[-1] == "Sugar"
        assert len(lines) == 7

    def test_groups_ingredients_under_two_percent(self):
        text = "Potatoes, sunflower oil (30%), salt (1.5%), dextrose, flavouring"
        assert label_lines(text) == ["salt, dextrose, flavouring", "sunflower oil", "Potatoes"]

    def test_caps_at_eight_by_folding_smallest_into_first_line(self):
        text = ", ".join(f"i{n}" for n in range(1, 11))  # i1 biggest .. i10 smallest
        lines = label_lines(text)
        assert len(lines) == 8
        assert lines[0] == "i8, i9, i10"
        assert lines[1] == "i7"
        assert lines[-1] == "i1"

    def test_nested_percentage_is_not_the_ingredients_own(self):
        text = "Sugar, milk chocolate (cocoa solids 1%, sugar), wheat flour (30%), salt (0.5%)"
        assert label_lines(text) == ["salt", "wheat flour", "milk chocolate (cocoa solids 1%, sugar)", "Sugar"]

    def test_own_percentage_before_a_bracket(self):
        text = "Potatoes, chocolate 1.5% (cocoa 40%), salt"
        assert label_lines(text) == ["chocolate (cocoa 40%), salt", "Potatoes"]

    def test_percentages_stripped_from_display(self):
        assert "13%" not in " ".join(label_lines(NUTELLA))
