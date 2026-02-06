import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  saveCredential,
  getCredential,
  deleteCredential,
  listCredentialChains,
} from "@/lib/db/credentials";
import type { TheaterChain } from "@/types/theater";

export const credentialStore = createTool({
  id: "credential-store",
  description:
    "映画館チェーンの暗号化済み認証情報を管理します。保存・取得・削除・一覧の操作が可能です。",
  inputSchema: z.object({
    action: z
      .enum(["save", "get", "delete", "list"])
      .describe("実行する操作"),
    userId: z.string().describe("ユーザー ID"),
    chain: z
      .enum(["toho", "aeon", "cinema109"])
      .optional()
      .describe("映画館チェーン (save/get/delete で必須)"),
    username: z
      .string()
      .optional()
      .describe("ログインユーザー名 (save で必須)"),
    password: z
      .string()
      .optional()
      .describe("ログインパスワード (save で必須)"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z
      .union([
        z.object({ exists: z.boolean() }),
        z.array(z.string()),
      ])
      .optional()
      .describe("get の場合は存在確認結果、list の場合はチェーン一覧"),
    error: z.string().optional().describe("エラーが発生した場合のメッセージ"),
  }),
  execute: async ({ action, userId, chain, username, password }) => {

    try {
      switch (action) {
        case "save": {
          if (!chain) {
            return { success: false, error: "save には chain が必要です" };
          }
          if (!username || !password) {
            return {
              success: false,
              error: "save には username と password が必要です",
            };
          }
          saveCredential(userId, chain as TheaterChain, {
            username,
            password,
          });
          return { success: true };
        }

        case "get": {
          if (!chain) {
            return { success: false, error: "get には chain が必要です" };
          }
          const credential = getCredential(userId, chain as TheaterChain);
          return {
            success: true,
            data: { exists: credential !== null },
          };
        }

        case "delete": {
          if (!chain) {
            return { success: false, error: "delete には chain が必要です" };
          }
          deleteCredential(userId, chain as TheaterChain);
          return { success: true };
        }

        case "list": {
          const chains = listCredentialChains(userId);
          return { success: true, data: chains };
        }

        default:
          return {
            success: false,
            error: `不明なアクション: ${action as string}`,
          };
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "不明なエラーが発生しました";
      return { success: false, error: message };
    }
  },
});
