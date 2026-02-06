import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  getScraper,
  buildCacheKey,
  getCached,
  setCache,
  clearExpired,
} from "../../lib/scrapers";
import {
  getTheaterSiteCode,
  seedTheaterMappings,
} from "../../lib/db/theater-mapping";
import { normalizeTitle } from "../../lib/scrapers/utils";

const tmdbMovieSchema = z.object({
  title: z.string(),
  originalTitle: z.string(),
  overview: z.string(),
  posterPath: z.string().nullable(),
  runtime: z.number().nullable(),
  releaseDate: z.string(),
  voteAverage: z.number(),
  genres: z.array(z.object({ id: z.number(), name: z.string() })),
});

const scheduleSchema = z.object({
  theaterId: z.string(),
  theaterName: z.string(),
  showtimes: z.array(
    z.object({
      movieTitle: z.string().optional(),
      startTime: z.string(),
      endTime: z.string().optional(),
      screen: z.string().optional(),
      format: z.string().optional(),
      isAvailable: z.boolean().optional(),
      ticketUrl: z.string().optional(),
    }),
  ),
});

export const searchMovieSchedules = createTool({
  id: "search-movie-schedules",
  description:
    "TMDb APIで映画情報を検索し、指定された映画館のスケジュールをスクレイピングで取得します。対応チェーン: TOHOシネマズ (API), 109シネマズ (HTML), イオンシネマ (ブラウザ)。",
  inputSchema: z.object({
    movieTitle: z.string().describe("検索する映画のタイトル"),
    date: z.string().describe("上映日 (YYYY-MM-DD形式)"),
    theaters: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          chain: z.string(),
          url: z.string().optional(),
        }),
      )
      .describe("検索対象の映画館リスト"),
  }),
  outputSchema: z.object({
    movie: tmdbMovieSchema.nullable(),
    schedules: z.array(scheduleSchema),
    note: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ movieTitle, date, theaters }) => {
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) {
      return {
        movie: null,
        schedules: [],
        error: "TMDB_API_KEY environment variable is not set",
      };
    }

    // Seed theater mappings on first use
    try {
      seedTheaterMappings();
    } catch {
      // Non-critical: mappings might already exist
    }

    // Clear expired cache entries
    clearExpired();

    try {
      // Step 1: Search for the movie on TMDb
      const searchUrl = new URL("https://api.themoviedb.org/3/search/movie");
      searchUrl.searchParams.set("query", movieTitle);
      searchUrl.searchParams.set("language", "ja-JP");
      searchUrl.searchParams.set("api_key", apiKey);

      const searchRes = await fetch(searchUrl.toString());
      if (!searchRes.ok) {
        return {
          movie: null,
          schedules: [],
          error: `TMDb search failed: ${searchRes.status} ${searchRes.statusText}`,
        };
      }

      const searchData = (await searchRes.json()) as {
        results: Array<{
          id: number;
          title: string;
          original_title: string;
          overview: string;
          poster_path: string | null;
          release_date: string;
          vote_average: number;
        }>;
      };

      if (!searchData.results || searchData.results.length === 0) {
        return {
          movie: null,
          schedules: [],
          error: `No movie found for title: ${movieTitle}`,
        };
      }

      const topResult = searchData.results[0];

      // Step 2: Get detailed movie info
      const detailUrl = new URL(
        `https://api.themoviedb.org/3/movie/${topResult.id}`,
      );
      detailUrl.searchParams.set("language", "ja-JP");
      detailUrl.searchParams.set("api_key", apiKey);

      let movie: z.infer<typeof tmdbMovieSchema>;

      const detailRes = await fetch(detailUrl.toString());
      if (!detailRes.ok) {
        movie = {
          title: topResult.title,
          originalTitle: topResult.original_title,
          overview: topResult.overview,
          posterPath: topResult.poster_path,
          runtime: null,
          releaseDate: topResult.release_date,
          voteAverage: topResult.vote_average,
          genres: [],
        };
      } else {
        const detailData = (await detailRes.json()) as {
          title: string;
          original_title: string;
          overview: string;
          poster_path: string | null;
          runtime: number | null;
          release_date: string;
          vote_average: number;
          genres: Array<{ id: number; name: string }>;
        };
        movie = {
          title: detailData.title,
          originalTitle: detailData.original_title,
          overview: detailData.overview,
          posterPath: detailData.poster_path,
          runtime: detailData.runtime,
          releaseDate: detailData.release_date,
          voteAverage: detailData.vote_average,
          genres: detailData.genres,
        };
      }

      // Step 3: Scrape schedules for each theater
      // イオンシネマは agent-browser を使うため直列化が必要（ブラウザセッション競合防止）
      const aeonTheaters = theaters.filter((t) => t.chain === "aeon");
      const otherTheaters = theaters.filter((t) => t.chain !== "aeon");

      type ScrapeOneResult = {
        schedule?: z.infer<typeof scheduleSchema>;
        error?: string;
      };

      async function scrapeOne(
        theater: (typeof theaters)[number],
      ): Promise<ScrapeOneResult> {
        const scraper = getScraper(theater.chain);
        if (!scraper) {
          return {
            error: `${theater.name}: 対応するスクレイパーがありません (chain: ${theater.chain})`,
          };
        }

        const mapping = getTheaterSiteCode(theater.chain, theater.name);
        if (!mapping) {
          return {
            error: `${theater.name}: 劇場マッピングが見つかりません`,
          };
        }

        const cacheKey = buildCacheKey(
          theater.chain,
          mapping.site_code,
          date,
        );

        // Check cache
        const cached = getCached(cacheKey);
        if (cached && cached.success) {
          const filteredShowtimes = movieTitle
            ? cached.showtimes.filter((s) => {
                const norm1 = normalizeTitle(s.movieTitle);
                const norm2 = normalizeTitle(movieTitle);
                return norm1.includes(norm2) || norm2.includes(norm1);
              })
            : cached.showtimes;

          return {
            schedule: {
              theaterId: theater.id,
              theaterName: theater.name,
              showtimes: filteredShowtimes.map((s) => ({
                movieTitle: s.movieTitle,
                startTime: s.startTime,
                endTime: s.endTime,
                screen: s.screen,
                format: s.format,
                isAvailable: s.isAvailable,
                ticketUrl: s.ticketUrl,
              })),
            },
          };
        }

        // Scrape
        console.info(
          `[scraper] ${theater.chain}/${mapping.site_code} をスクレイピング中...`,
        );
        const result = await scraper.scrape(
          mapping.site_code,
          date,
          movieTitle,
        );

        setCache(cacheKey, result);

        if (result.success) {
          return {
            schedule: {
              theaterId: theater.id,
              theaterName: theater.name,
              showtimes: result.showtimes.map((s) => ({
                movieTitle: s.movieTitle,
                startTime: s.startTime,
                endTime: s.endTime,
                screen: s.screen,
                format: s.format,
                isAvailable: s.isAvailable,
                ticketUrl: s.ticketUrl,
              })),
            },
          };
        }
        return {
          error: `${theater.name}: ${result.error || "スクレイピングに失敗しました"}`,
        };
      }

      // イオンシネマは直列実行（agent-browser セッション競合防止）、他は並行実行
      const aeonResultsPromise = (async () => {
        const results: ScrapeOneResult[] = [];
        for (const theater of aeonTheaters) {
          results.push(await scrapeOne(theater));
        }
        return results;
      })();

      const otherResults = await Promise.all(
        otherTheaters.map((t) => scrapeOne(t)),
      );
      const aeonResults = await aeonResultsPromise;

      const allResults = [...otherResults, ...aeonResults];
      const schedules = allResults
        .filter((r) => r.schedule)
        .map((r) => r.schedule!);
      const errors = allResults
        .filter((r) => r.error)
        .map((r) => r.error!);

      const note =
        errors.length > 0
          ? `一部の映画館でスケジュール取得に失敗しました:\n${errors.join("\n")}`
          : undefined;

      return {
        movie,
        schedules,
        note,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        movie: null,
        schedules: [],
        error: `Failed to search movie: ${message}`,
      };
    }
  },
});

