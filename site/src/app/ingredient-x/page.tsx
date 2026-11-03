import type { Metadata } from "next";
import { GameFrame } from "@/components/GameFrame";
import { IngredientXGame } from "@/games/ingredient-x/IngredientXGame";

export const metadata: Metadata = {
  title: "Ingredient X",
  description: "Name the product from its ingredients label, smallest ingredient first.",
};

export default function Page() {
  return (
    <GameFrame
      game="ingredient-x"
      howToPlay={[
        "Name the product from its ingredients label.",
        "The smallest ingredient shows first. Labels list ingredients by weight, so the giveaways come last.",
        "A wrong guess or a skip reveals the next line. After line 4 you get the category.",
        "Solve it in as few lines as you can.",
      ]}
    >
      <IngredientXGame />
    </GameFrame>
  );
}
