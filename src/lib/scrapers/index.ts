import { aeonScraper } from "./aeon";
import { cinema109Scraper } from "./cinema109";
import { tohoScraper } from "./toho";
import type { TheaterScraper } from "./types";

const scrapers: Record<string, TheaterScraper> = {
  aeon: aeonScraper,
  cinema109: cinema109Scraper,
  toho: tohoScraper,
};

export function getScraper(chain: string): TheaterScraper | null {
  return scrapers[chain] ?? null;
}

export { buildCacheKey, getCached, setCache, clearExpired } from "./cache";
export type { ScrapeResult, ScrapedShowtime, TheaterScraper } from "./types";
