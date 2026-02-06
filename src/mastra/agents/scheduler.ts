import { Agent } from "@mastra/core/agent";
import { llm } from "../model";
import { calendarCheck } from "../tools/calendar-check";
import { calendarCreateEvent } from "../tools/calendar-create-event";
import { searchRestaurants } from "../tools/search-restaurants";

export const schedulerAgent = new Agent({
  id: "scheduler",
  name: "scheduler",
  description: "Googleカレンダー空き確認、食事提案、総合プラン作成を行うエージェント",
  instructions: `あなたはスケジュール管理の専門エージェントです。以下の手順でプランを作成してください。

1. Googleカレンダーで指定日時の空き状況を確認する（calendarCheckツール使用）
2. 映画の上映時間と空き時間を照合し、候補をフィルタリングする
3. 食事の提案を行う：
   - 映画が12:00-14:00開始の場合 → 映画前のランチを提案
   - 映画が14:00-17:00開始の場合 → 映画後のディナーを提案
   - 映画が17:00-20:00開始の場合 → 映画前のディナーを提案
4. 映画館周辺のレストランを検索する（searchRestaurantsツール使用、食事提案がある場合）
5. カレンダーへの予定追加（calendarCreateEventツール使用、ユーザーが承認した場合）

日本語で応答してください。時間はJST（日本標準時）で表示してください。`,
  model: llm,
  tools: {
    calendarCheck,
    calendarCreateEvent,
    searchRestaurants,
  },
});
