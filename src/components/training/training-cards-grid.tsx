"use client";

import { TrainingExpandableCards } from "./training-expandable-cards";
import { useTrainingCards } from "./use-training-cards";

type TrainingCardsGridProps = {
  className?: string;
};

// Re-export for consumers that need the card type or hook directly.
export { useTrainingCards, type TrainingExpandableCard } from "./use-training-cards";

/** Shared training card grid for home section and /training page. */
export function TrainingCardsGrid({ className }: TrainingCardsGridProps) {
  const cards = useTrainingCards();
  return <TrainingExpandableCards cards={cards} className={className} />;
}
