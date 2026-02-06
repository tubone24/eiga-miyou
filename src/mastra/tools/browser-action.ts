import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { execSync } from "node:child_process";

export const browserAction = createTool({
  id: "browser-action",
  description:
    "agent-browser CLI のラッパー。ブラウザの起動・ナビゲーション・クリック・入力・スナップショット・終了などのアクションを実行します。",
  inputSchema: z.object({
    action: z
      .enum(["open", "click", "fill", "snapshot", "close"])
      .describe(
        "実行するブラウザアクション。open: URLを開く（セッション自動作成）、click: 要素クリック、fill: 入力、snapshot: アクセシビリティツリー取得、close: ブラウザ終了",
      ),
    target: z
      .string()
      .optional()
      .describe(
        "open の場合は URL、click/fill の場合は要素参照 (例: @e1)",
      ),
    value: z.string().optional().describe("fill アクションで入力する値"),
    sessionId: z
      .string()
      .optional()
      .describe("既存セッションを再利用する場合のセッション ID"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    output: z.string().describe("CLI の標準出力"),
    error: z.string().optional().describe("エラーが発生した場合のメッセージ"),
  }),
  execute: async ({ action, target, value, sessionId }) => {

    try {
      let command: string;

      switch (action) {
        case "open":
          if (!target) {
            return {
              success: false,
              output: "",
              error: "open アクションには target (URL) が必要です",
            };
          }
          command = `agent-browser open ${target}`;
          break;
        case "click":
          if (!target) {
            return {
              success: false,
              output: "",
              error: "click アクションには target (要素参照) が必要です",
            };
          }
          command = `agent-browser click ${target}`;
          break;
        case "fill":
          if (!target) {
            return {
              success: false,
              output: "",
              error: "fill アクションには target (要素参照) が必要です",
            };
          }
          if (!value) {
            return {
              success: false,
              output: "",
              error: "fill アクションには value が必要です",
            };
          }
          command = `agent-browser fill ${target} "${value}"`;
          break;
        case "snapshot":
          command = "agent-browser snapshot -i -c";
          break;
        case "close":
          command = "agent-browser close";
          break;
        default:
          return {
            success: false,
            output: "",
            error: `不明なアクション: ${action as string}`,
          };
      }

      if (sessionId) {
        command += ` --session ${sessionId}`;
      }

      // open はブラウザ起動 + ページ読み込みで時間がかかるため長めのタイムアウト
      const timeout = action === "open" ? 60_000 : 30_000;
      const output = execSync(command, {
        encoding: "utf-8",
        timeout,
      });

      // snapshot出力が大きいとコンテキストを圧迫するためトランケート
      const MAX_OUTPUT_CHARS = 4000;
      const trimmed = output.trim();
      const truncated =
        trimmed.length > MAX_OUTPUT_CHARS
          ? trimmed.slice(0, MAX_OUTPUT_CHARS) + "\n... (truncated)"
          : trimmed;
      return { success: true, output: truncated };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "不明なエラーが発生しました";
      return { success: false, output: "", error: message };
    }
  },
});
