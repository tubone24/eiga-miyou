export interface ScrapedShowtime {
  movieTitle: string;
  startTime: string; // "HH:mm"
  endTime?: string; // "HH:mm"
  screen?: string; // "シアター1" etc.
  format?: string; // "2D", "IMAX", "4DX" etc.
  isAvailable?: boolean;
  ticketUrl?: string;
}

export interface ScrapeResult {
  success: boolean;
  showtimes: ScrapedShowtime[];
  scrapedAt: string; // ISO 8601
  error?: string;
}

export interface TheaterScraper {
  chain: string;
  scrape(
    siteCode: string,
    date: string,
    movieTitle?: string,
  ): Promise<ScrapeResult>;
}
