import { Agent } from "@mastra/core/agent";
import { llm } from "../model";
import { searchTheaters } from "../tools/search-theaters";
import { getDirections } from "../tools/get-directions";
import { searchMovieSchedules } from "../tools/search-movie-schedules";
import { userProfile } from "../tools/user-profile";

export const movieSearchAgent = new Agent({
  id: "movie-search",
  name: "movie-search",
  description: "映画検索、近隣映画館の上映スケジュール横断検索、移動時間計算を行うエージェント",
  instructions: `あなたは映画検索の専門エージェントです。以下の手順で映画情報を検索してください。

1. ユーザーの住所情報から座標を取得する（userProfileツール使用）
2. 近隣の映画館を検索する（searchTheatersツール使用）
3. 指定された映画の上映スケジュールを取得する（searchMovieSchedulesツール使用）
4. 各映画館への移動時間を計算する（getDirectionsツール使用）
5. 結果を整理して返す

結果は以下の形式で整理してください：
- 映画館名、チェーン名
- 上映時間（開始〜終了）
- 上映形式（2D/3D/IMAX等）
- ユーザーからの移動時間
- 空席状況（わかる場合）

日本語で応答してください。`,
  model: llm,
  tools: {
    searchTheaters,
    getDirections,
    searchMovieSchedules,
    userProfile,
  },
});
