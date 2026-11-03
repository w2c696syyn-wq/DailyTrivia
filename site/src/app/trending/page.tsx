import type { Metadata } from "next";
import { GameFrame } from "@/components/GameFrame";
import { TrendingGame } from "@/games/trending/TrendingGame";

export const metadata: Metadata = {
  title: "Trending",
  description: "Guess the week from what everyone was reading on Wikipedia.",
};

export default function Page() {
  return (
    <GameFrame
      game="trending"
      howToPlay={[
        "These were the most-read English Wikipedia articles in one week since 2016.",
        "Reveal up to five more articles if you need them. Each costs 4 points.",
        "Slide to the week you think it was and lock in. You get one guess.",
        "You lose 2 points for every week you're off.",
      ]}
    >
      <TrendingGame />
    </GameFrame>
  );
}
