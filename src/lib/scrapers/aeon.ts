import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { TheaterScraper, ScrapeResult, ScrapedShowtime } from "./types";
import { normalizeTitle } from "./utils";

const execFileAsync = promisify(execFile);

/**
 * イオンシネマ スクレイパー
 *
 * イオンシネマのスケジュールは theater.aeoncinema.com のSPAで動的レンダリングされるため、
 * fetch+cheerio では取得不可。agent-browser CLI を使用してスクレイピングする。
 */
export const aeonScraper: TheaterScraper = {
  chain: "aeon",

  async scrape(
    siteCode: string,
    date: string,
    movieTitle?: string,
  ): Promise<ScrapeResult> {
    // siteCode バリデーション（英数字・ハイフン・アンダースコアのみ）
    if (!/^[a-zA-Z0-9_-]+$/.test(siteCode)) {
      return {
        success: false,
        showtimes: [],
        scrapedAt: new Date().toISOString(),
        error: `不正なサイトコード: ${siteCode}`,
      };
    }

    const dateParam = date.replace(/-/g, "");
    const url =
      dateParam === formatToday()
        ? `https://theater.aeoncinema.com/theaters/${siteCode}`
        : `https://theater.aeoncinema.com/theaters/${siteCode}?date=${dateParam}`;

    try {
      // agent-browser で URL を開いてスナップショットを取得（非同期・配列引数でインジェクション防止）
      await execFileAsync(
        "npx",
        ["-y", "@anthropic-ai/agent-browser@latest", "open", url],
        { timeout: 30_000 },
      );

      // ページの SPA レンダリングを待つ
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const { stdout: snapshot } = await execFileAsync(
        "npx",
        ["-y", "@anthropic-ai/agent-browser@latest", "snapshot", "-i", "-c"],
        { timeout: 30_000 },
      );

      const showtimes = parseAeonSnapshot(snapshot, movieTitle);

      // ブラウザを閉じる
      try {
        await execFileAsync(
          "npx",
          ["-y", "@anthropic-ai/agent-browser@latest", "close"],
          { timeout: 10_000 },
        );
      } catch {
        // close failure is non-critical
      }

      return {
        success: showtimes.length > 0,
        showtimes,
        scrapedAt: new Date().toISOString(),
        error:
          showtimes.length === 0
            ? "スケジュールデータをパースできませんでした"
            : undefined,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        showtimes: [],
        scrapedAt: new Date().toISOString(),
        error: `イオンシネマのスクレイピングに失敗しました: ${message}`,
      };
    }
  },
};

function formatToday(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

// UI要素として除外するキーワード
const EXCLUDED_KEYWORDS = [
  "イオンシネマ",
  "公開中",
  "席種選択",
  "お知らせ",
  "ログイン",
  "メニュー",
  "チケット",
  "割引",
  "料金",
  "アクセス",
  "上映中",
  "近日公開",
  "会員",
  "ポイント",
  "購入",
  "予約",
];

/**
 * agent-browser snapshot の出力テキストから上映情報をパースする
 */
function parseAeonSnapshot(
  text: string,
  movieTitle?: string,
): ScrapedShowtime[] {
  const showtimes: ScrapedShowtime[] = [];
  const lines = text.split("\n");

  let currentMovie = "";
  let currentScreen = "";
  let currentFormat = "";

  const timePattern = /(\d{1,2}:\d{2})\s*[～〜~ー-]\s*(\d{1,2}:\d{2})/;
  const screenPattern = /(?:シアター|スクリーン|SCREEN)\s*\d+/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // スクリーン行の検出
    const screenMatch = trimmed.match(screenPattern);
    if (screenMatch) {
      currentScreen = screenMatch[0];
      const formatMatch = trimmed.match(
        /(IMAX|4DX|2D|3D|ドルビーアトモス|Dolby Atmos|字幕|吹替)/i,
      );
      if (formatMatch) {
        currentFormat = formatMatch[0];
      }
      continue;
    }

    // 時間行の検出
    const timeMatch = trimmed.match(timePattern);
    if (timeMatch) {
      const startTime = timeMatch[1].padStart(5, "0");
      const endTime = timeMatch[2].padStart(5, "0");
      const isAvailable =
        trimmed.includes("○") ||
        trimmed.includes("購入") ||
        !trimmed.includes("×");

      if (
        !movieTitle ||
        !currentMovie ||
        normalizeTitle(currentMovie).includes(normalizeTitle(movieTitle)) ||
        normalizeTitle(movieTitle).includes(normalizeTitle(currentMovie))
      ) {
        showtimes.push({
          movieTitle: currentMovie || "不明",
          startTime,
          endTime,
          screen: currentScreen || undefined,
          format: currentFormat || undefined,
          isAvailable,
        });
      }
      continue;
    }

    // 時間でもスクリーンでもない行は映画タイトルの可能性
    if (
      trimmed.length > 2 &&
      !trimmed.startsWith("http") &&
      !trimmed.match(/^\d/) &&
      !EXCLUDED_KEYWORDS.some((kw) => trimmed === kw || trimmed.startsWith(kw + " "))
    ) {
      currentMovie = trimmed;
      currentScreen = "";
      currentFormat = "";
    }
  }

  return showtimes;
}
