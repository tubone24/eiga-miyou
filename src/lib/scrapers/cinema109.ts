import * as cheerio from "cheerio";
import type { TheaterScraper, ScrapeResult, ScrapedShowtime } from "./types";
import { normalizeTitle } from "./utils";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * 109シネマズ スクレイパー
 *
 * 静的HTMLをfetch+cheerioでパースする。
 * siteCode は "slug:theaterCode" 形式（例: "futakotamagawa:T1"）
 */
export const cinema109Scraper: TheaterScraper = {
  chain: "cinema109",

  async scrape(
    siteCode: string,
    date: string,
    movieTitle?: string,
  ): Promise<ScrapeResult> {
    const [slug, theaterCode] = siteCode.split(":");
    const dateStr = date.replace(/-/g, "");

    // URL: https://109cinemas.net/{slug}/schedules/{YYYYMMDD}.html?theater_code={code}
    let url = `https://109cinemas.net/${slug}/schedules/${dateStr}.html`;
    if (theaterCode) {
      url += `?theater_code=${theaterCode}`;
    }

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
      });

      if (!res.ok) {
        return {
          success: false,
          showtimes: [],
          scrapedAt: new Date().toISOString(),
          error: `109シネマズ HTTP ${res.status}: ${res.statusText}`,
        };
      }

      const html = await res.text();
      const showtimes = parse109Html(html, movieTitle);

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
        error: `109シネマズのスクレイピングに失敗しました: ${message}`,
      };
    }
  },
};

/**
 * 109シネマズのスケジュールHTMLをパースする
 *
 * HTML構造（iframe内のスケジュール）:
 *   各映画ブロック:
 *     - タイトル: a[href*="/movies/"] のテキスト
 *     - スクリーン: a[href*="/seat/theater-"] のテキスト + 隣接テキストノード（フォーマット・上映時間）
 *     - 上映回: li.check_date 内
 *       - time.start: 開始時刻
 *       - time.end: 終了時刻
 *       - div.available: 購入可能
 *       - div.close: 販売終了
 */
function parse109Html(
  html: string,
  movieTitle?: string,
): ScrapedShowtime[] {
  const $ = cheerio.load(html);
  const showtimes: ScrapedShowtime[] = [];

  // 109シネマズのスケジュールHTML は映画ごとのブロックで構成されている
  // 各映画ブロックは映画タイトルリンクで始まる
  // ページの構造はテーブルや独自のセクションで区切られている

  // 全映画リンクを取得してブロック単位で処理
  const movieLinks = $('a[href*="/movies/"]').filter(function () {
    const text = $(this).text().trim();
    // "作品詳細へ" 等のリンクは除外
    return text.length > 0 && !text.includes("作品詳細");
  });

  movieLinks.each(function () {
    const titleText = $(this).text().trim();

    // フォーマット情報をタイトルから抽出
    const formatInTitle = titleText.match(/\[([^\]]+)\]/);
    const cleanTitle = titleText.replace(/\[[^\]]*\]/g, "").trim();

    // movieTitle でフィルタリング
    if (movieTitle) {
      const normalizedSearch = normalizeTitle(movieTitle);
      const normalizedCurrent = normalizeTitle(cleanTitle);
      if (
        !normalizedCurrent.includes(normalizedSearch) &&
        !normalizedSearch.includes(normalizedCurrent)
      ) {
        return; // skip this movie
      }
    }

    // このタイトルリンクの親要素から上映情報ブロックを探す
    // 共通の親コンテナ（映画ブロック）を上に遡って見つける
    const movieBlock = $(this).closest("div, section, table, tr");

    // スクリーン情報を探す
    let screen = "";
    let format = formatInTitle ? formatInTitle[1] : "";
    const seatLink = movieBlock.find('a[href*="/seat/theater-"]');
    if (seatLink.length > 0) {
      screen = seatLink.first().text().trim();
      // スクリーン行の親liからフォーマット情報を取得
      const parentLi = seatLink.first().closest("li");
      if (parentLi.length > 0) {
        const liText = parentLi.text().trim();
        const formatMatch = liText.match(
          /(IMAX(?:レーザー)?|4DX|2D|3D|ドルビーアトモス|Dolby Atmos|★7\.1ch★)/i,
        );
        if (formatMatch && !format) {
          format = formatMatch[1];
        }
      }
    }

    // 上映時間を取得
    movieBlock.find("li.check_date").each(function () {
      const startEl = $(this).find("time.start");
      const endEl = $(this).find("time.end");

      if (startEl.length === 0) return;

      const startTime = startEl.text().trim();
      const endTime = endEl.length > 0 ? endEl.text().trim() : undefined;

      // 販売状態を確認
      const hasAvailable = $(this).find("div.available").length > 0;
      const hasClosed = $(this).find("div.close").length > 0;
      const isAvailable = hasAvailable || !hasClosed;

      // チケットURL
      const ticketLink = $(this).find("a").attr("href");

      showtimes.push({
        movieTitle: cleanTitle,
        startTime,
        endTime,
        screen: screen || undefined,
        format: format || undefined,
        isAvailable,
        ticketUrl: ticketLink || undefined,
      });
    });
  });

  // movieLinksで見つからない場合のフォールバック: 直接 li.check_date を走査
  if (showtimes.length === 0) {
    $("li.check_date").each(function () {
      const startEl = $(this).find("time.start");
      const endEl = $(this).find("time.end");
      if (startEl.length === 0) return;

      const startTime = startEl.text().trim();
      const endTime = endEl.length > 0 ? endEl.text().trim() : undefined;
      const hasAvailable = $(this).find("div.available").length > 0;
      const hasClosed = $(this).find("div.close").length > 0;
      const isAvailable = hasAvailable || !hasClosed;
      const ticketLink = $(this).find("a").attr("href");

      // 親要素から映画タイトルを推定
      let title = "不明";
      const parentBlock = $(this).closest("div, section, table, tr");
      const movieLink = parentBlock.find('a[href*="/movies/"]').first();
      if (movieLink.length > 0) {
        title = movieLink
          .text()
          .trim()
          .replace(/\[[^\]]*\]/g, "")
          .trim();
      }

      if (movieTitle) {
        const normalizedSearch = normalizeTitle(movieTitle);
        const normalizedCurrent = normalizeTitle(title);
        if (
          !normalizedCurrent.includes(normalizedSearch) &&
          !normalizedSearch.includes(normalizedCurrent) &&
          title !== "不明"
        ) {
          return;
        }
      }

      showtimes.push({
        movieTitle: title,
        startTime,
        endTime,
        screen: undefined,
        format: undefined,
        isAvailable,
        ticketUrl: ticketLink || undefined,
      });
    });
  }

  return showtimes;
}

