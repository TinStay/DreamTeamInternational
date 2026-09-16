import { scrollToElement } from "@/lib/smooth-scroll";

export type PortfolioNavigateDetail = {
  category?: string;
};

export const PORTFOLIO_NAVIGATE_EVENT = "dreamteam:portfolio-navigate";

export function navigateToPortfolio(category?: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<PortfolioNavigateDetail>(PORTFOLIO_NAVIGATE_EVENT, {
      detail: { category },
    })
  );

  scrollToElement(document.getElementById("portfolio"));
}
