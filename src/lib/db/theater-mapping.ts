import { getDb } from "./index";

export interface TheaterMapping {
  id: number;
  chain: string;
  theater_name: string;
  site_code: string;
  site_url: string | null;
}

export function initTheaterMappingTable(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS theater_site_mapping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chain TEXT NOT NULL,
      theater_name TEXT NOT NULL,
      site_code TEXT NOT NULL,
      site_url TEXT,
      UNIQUE(chain, site_code)
    )
  `);
}

export function getTheaterSiteCode(
  chain: string,
  theaterName: string,
): TheaterMapping | null {
  const db = getDb();
  initTheaterMappingTable();

  // Exact match first
  const exact = db
    .prepare(
      "SELECT * FROM theater_site_mapping WHERE chain = ? AND theater_name = ?",
    )
    .get(chain, theaterName) as TheaterMapping | undefined;
  if (exact) return exact;

  // Partial match (theater name contains or is contained)
  const partial = db
    .prepare(
      "SELECT * FROM theater_site_mapping WHERE chain = ? AND (theater_name LIKE '%' || ? || '%' OR ? LIKE '%' || theater_name || '%')",
    )
    .get(chain, theaterName, theaterName) as TheaterMapping | undefined;
  return partial ?? null;
}

export function upsertTheaterMapping(
  chain: string,
  theaterName: string,
  siteCode: string,
  siteUrl?: string,
): void {
  const db = getDb();
  initTheaterMappingTable();

  db.prepare(
    `INSERT INTO theater_site_mapping (chain, theater_name, site_code, site_url)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(chain, site_code) DO UPDATE SET
       theater_name = excluded.theater_name,
       site_url = excluded.site_url`,
  ).run(chain, theaterName, siteCode, siteUrl ?? null);
}

export function listTheaterMappings(chain: string): TheaterMapping[] {
  const db = getDb();
  initTheaterMappingTable();

  return db
    .prepare("SELECT * FROM theater_site_mapping WHERE chain = ?")
    .all(chain) as TheaterMapping[];
}

// Seed initial theater data
export function seedTheaterMappings(): void {
  const db = getDb();
  initTheaterMappingTable();

  const count = db
    .prepare("SELECT COUNT(*) as cnt FROM theater_site_mapping")
    .get() as { cnt: number };
  if (count.cnt > 0) return;

  const mappings: Array<[string, string, string, string | null]> = [
    // --- イオンシネマ ---
    ["aeon", "イオンシネマ板橋", "itabashi", "https://www.aeoncinema.com/cinema2/itabashi/movie/"],
    ["aeon", "イオンシネマ東雲", "shinonome", "https://www.aeoncinema.com/cinema2/shinonome/movie/"],
    ["aeon", "イオンシネマ シアタス調布", "chofu", "https://www.aeoncinema.com/cinema2/chofu/movie/"],
    ["aeon", "イオンシネマ多摩センター", "tamacenter", "https://www.aeoncinema.com/cinema2/tamacenter/movie/"],
    ["aeon", "イオンシネマ越谷レイクタウン", "koshigaya", "https://www.aeoncinema.com/cinema2/koshigaya/movie/"],
    ["aeon", "イオンシネマ幕張新都心", "makuhari", "https://www.aeoncinema.com/cinema2/makuhari/movie/"],
    ["aeon", "イオンシネマ海老名", "ebina", "https://www.aeoncinema.com/cinema2/ebina/movie/"],
    ["aeon", "イオンシネマ大宮", "omiya", "https://www.aeoncinema.com/cinema2/omiya/movie/"],
    ["aeon", "イオンシネマ座間", "zama", "https://www.aeoncinema.com/cinema2/zama/movie/"],
    ["aeon", "イオンシネマむさし村山", "musashimurayama", "https://www.aeoncinema.com/cinema2/musashimurayama/movie/"],
    ["aeon", "イオンシネマ日の出", "hinode", "https://www.aeoncinema.com/cinema2/hinode/movie/"],
    ["aeon", "イオンシネマ港北ニュータウン", "kohoku", "https://www.aeoncinema.com/cinema2/kohoku/movie/"],

    // --- 109シネマズ ---
    ["cinema109", "109シネマズ二子玉川", "futakotamagawa:T1", null],
    ["cinema109", "109シネマズ川崎", "kawasaki:I1", null],
    ["cinema109", "109シネマズ木場", "kiba:20", null],
    ["cinema109", "109シネマズグランベリーパーク", "granberrypark:G1", null],
    ["cinema109", "109シネマズ湘南", "shonan:R1", null],
    ["cinema109", "109シネマズプレミアム新宿", "premiumshinjuku:", null],
    ["cinema109", "109シネマズ名古屋", "nagoya:A1", null],
    ["cinema109", "109シネマズ大阪エキスポシティ", "expocity:E1", null],
    ["cinema109", "109シネマズ箕面", "minoh:M1", null],
    ["cinema109", "109シネマズ佐野", "sano:N1", null],
    ["cinema109", "109シネマズ菖蒲", "shobu:S1", null],
    ["cinema109", "109シネマズ四日市", "yokkaichi:Y1", null],
    ["cinema109", "109シネマズ広島", "hiroshima:H1", null],
    ["cinema109", "109シネマズ富谷", "tomiya:J1", null],
    ["cinema109", "109シネマズ港北", "kohoku:K1", null],
    ["cinema109", "109シネマズ HAT神戸", "kobe:B1", null],

    // --- TOHOシネマズ ---
    ["toho", "TOHOシネマズ新宿", "076", null],
    ["toho", "TOHOシネマズ渋谷", "043", null],
    ["toho", "TOHOシネマズ日比谷", "081", null],
    ["toho", "TOHOシネマズ日本橋", "073", null],
    ["toho", "TOHOシネマズ六本木ヒルズ", "009", null],
    ["toho", "TOHOシネマズ池袋", "084", null],
    ["toho", "TOHOシネマズ上野", "080", null],
    ["toho", "TOHOシネマズ府中", "012", null],
    ["toho", "TOHOシネマズ立川立飛", "082", null],
    ["toho", "TOHOシネマズ南大沢", "048", null],
    ["toho", "TOHOシネマズ海老名", "023", null],
    ["toho", "TOHOシネマズ川崎", "018", null],
    ["toho", "TOHOシネマズららぽーと横浜", "060", null],
    ["toho", "TOHOシネマズららぽーと船橋", "047", null],
    ["toho", "TOHOシネマズ流山おおたかの森", "056", null],
    ["toho", "TOHOシネマズ柏", "034", null],
    ["toho", "TOHOシネマズさいたま新都心", "077", null],
  ];

  const stmt = db.prepare(
    "INSERT OR IGNORE INTO theater_site_mapping (chain, theater_name, site_code, site_url) VALUES (?, ?, ?, ?)",
  );
  const transaction = db.transaction(() => {
    for (const [chain, name, code, url] of mappings) {
      stmt.run(chain, name, code, url);
    }
  });
  transaction();
}
