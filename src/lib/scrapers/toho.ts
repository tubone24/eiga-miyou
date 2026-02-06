import type { TheaterScraper, ScrapeResult, ScrapedShowtime } from "./types";
import { normalizeTitle } from "./utils";

const TOHO_API_BASE = "https://api2.tohotheater.jp/api/schedule/v1/schedule";

/**
 * TOHOシネマズ スクレイパー
 *
 * TOHOシネマズは api2.tohotheater.jp に JSON API を公開しているため、
 * agent-browser を使わず直接 fetch でスケジュールデータを取得できる。
 *
 * siteCode は劇場コード（例: "076" = 新宿, "084" = 池袋）
 */
export const tohoScraper: TheaterScraper = {
  chain: "toho",

  async scrape(
    siteCode: string,
    date: string,
    movieTitle?: string,
  ): Promise<ScrapeResult> {
    const dateStr = date.replace(/-/g, "");

    const apiUrl = new URL(
      `${TOHO_API_BASE}/${siteCode}/TNPI3050J02`,
    );
    apiUrl.searchParams.set("__type__", "json");
    apiUrl.searchParams.set("__useResultInfo__", "no");
    apiUrl.searchParams.set("vg_cd", siteCode);
    apiUrl.searchParams.set("show_day", dateStr);
    apiUrl.searchParams.set("term", "99");
    apiUrl.searchParams.set("isMember", "0");
    apiUrl.searchParams.set("enter_kbn", "0");
    apiUrl.searchParams.set("_dc", String(Date.now()));

    try {
      const res = await fetch(apiUrl.toString(), {
        headers: {
          Origin: "https://hlo.tohotheater.jp",
          Referer: `https://hlo.tohotheater.jp/net/schedule/${siteCode}/TNPI2000J01.do`,
        },
      });

      if (!res.ok) {
        return {
          success: false,
          showtimes: [],
          scrapedAt: new Date().toISOString(),
          error: `TOHO API HTTP ${res.status}: ${res.statusText}`,
        };
      }

      const json = (await res.json()) as TohoApiResponse;

      if (json.status !== "0") {
        return {
          success: false,
          showtimes: [],
          scrapedAt: new Date().toISOString(),
          error: `TOHO APIエラー: status=${json.status}`,
        };
      }

      const showtimes = parseTohoResponse(json, movieTitle);

      return {
        success: showtimes.length > 0,
        showtimes,
        scrapedAt: new Date().toISOString(),
        error:
          showtimes.length === 0
            ? "該当日のスケジュールが見つかりませんでした"
            : undefined,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        showtimes: [],
        scrapedAt: new Date().toISOString(),
        error: `TOHOシネマズのスクレイピングに失敗しました: ${message}`,
      };
    }
  },
};

// --- TOHO API response types ---

interface TohoApiResponse {
  status: string;
  data: TohoScheduleData[];
}

interface TohoScheduleData {
  vitCd: string;
  showDay: {
    date: string;
    dayOfWeek: number;
  };
  list: TohoTheater[];
}

interface TohoTheater {
  name: string;
  code: string;
  list: TohoMovie[];
}

interface TohoMovie {
  name: string;
  ename: string;
  mcode: string;
  code: string;
  hours: number;
  ratingCd: string;
  list: TohoScreen[];
}

interface TohoScreen {
  name: string;
  ename: string;
  code: string;
  theaterCd: string;
  iconNm2?: string;
  facilities: string[];
  list: TohoShowing[];
}

interface TohoShowing {
  showingStart: string;
  showingEnd: string;
  code: number;
  unsoldSeatInfo: {
    unsoldSeatStatus: string; // A=余裕あり B=半分 C=残席わずか D=売切 G=販売対象外
    muryoKansyoFlg: string;
  };
}

function parseTohoResponse(
  json: TohoApiResponse,
  movieTitle?: string,
): ScrapedShowtime[] {
  const showtimes: ScrapedShowtime[] = [];

  for (const scheduleData of json.data) {
    for (const theater of scheduleData.list) {
      for (const movie of theater.list) {
        // movieTitle フィルタリング
        if (movieTitle) {
          const normalizedSearch = normalizeTitle(movieTitle);
          const normalizedName = normalizeTitle(movie.name);
          if (
            !normalizedName.includes(normalizedSearch) &&
            !normalizedSearch.includes(normalizedName)
          ) {
            continue;
          }
        }

        for (const screen of movie.list) {
          // フォーマット情報を構築
          const formats: string[] = [];
          if (screen.iconNm2) formats.push(screen.iconNm2);
          if (screen.facilities.length > 0) {
            formats.push(...screen.facilities);
          }

          for (const showing of screen.list) {
            const seatStatus = showing.unsoldSeatInfo.unsoldSeatStatus;
            // A=余裕あり, B=半分, C=残席わずか, D=売切, G=販売対象外
            const isAvailable = seatStatus !== "D" && seatStatus !== "G";

            showtimes.push({
              movieTitle: movie.name,
              startTime: normalizeTime(showing.showingStart),
              endTime: normalizeTime(showing.showingEnd),
              screen: screen.name,
              format: formats.join(" / ") || undefined,
              isAvailable,
            });
          }
        }
      }
    }
  }

  return showtimes;
}

/** "9:00" → "09:00" のような正規化 */
function normalizeTime(time: string): string {
  const parts = time.split(":");
  if (parts.length === 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1]}`;
  }
  return time;
}

