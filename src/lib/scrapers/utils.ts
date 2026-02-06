/** タイトル文字列の正規化（比較用）。全角→半角、空白除去、小文字化 */
export function normalizeTitle(title: string): string {
  return title
    .replace(/[\s　]+/g, "")
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
      String.fromCharCode(s.charCodeAt(0) - 0xfee0),
    )
    .toLowerCase();
}
