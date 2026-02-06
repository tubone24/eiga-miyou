import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  getUserById,
  getUserAddresses,
  upsertAddress,
  deleteAddress,
} from "@/lib/db/users";

const addressDataSchema = z.object({
  id: z.string().optional().describe("既存住所の ID (deleteAddress で必須)"),
  label: z
    .enum(["home", "work", "other"])
    .describe("住所のラベル"),
  postalCode: z.string().optional().describe("郵便番号"),
  prefecture: z.string().describe("都道府県"),
  city: z.string().describe("市区町村"),
  street: z.string().describe("番地以降"),
  lat: z.number().optional().describe("緯度"),
  lng: z.number().optional().describe("経度"),
  isDefault: z
    .boolean()
    .default(false)
    .describe("デフォルト住所として設定するか"),
});

export const userProfile = createTool({
  id: "user-profile",
  description:
    "ユーザーのプロフィール情報と住所を管理します。取得・追加更新・削除が可能です。",
  inputSchema: z.object({
    action: z
      .enum(["getProfile", "getAddresses", "upsertAddress", "deleteAddress"])
      .describe("実行する操作"),
    userId: z.string().describe("ユーザー ID"),
    addressData: addressDataSchema
      .optional()
      .describe("住所データ (upsertAddress/deleteAddress で必要)"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.unknown().optional().describe("操作結果のデータ"),
    error: z.string().optional().describe("エラーが発生した場合のメッセージ"),
  }),
  execute: async ({ action, userId, addressData }) => {

    try {
      switch (action) {
        case "getProfile": {
          const user = getUserById(userId);
          if (!user) {
            return { success: false, error: "ユーザーが見つかりません" };
          }
          const addresses = getUserAddresses(userId);
          return {
            success: true,
            data: {
              user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                image: user.image,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
              },
              addresses,
            },
          };
        }

        case "getAddresses": {
          const addresses = getUserAddresses(userId);
          return { success: true, data: addresses };
        }

        case "upsertAddress": {
          if (!addressData) {
            return {
              success: false,
              error: "upsertAddress には addressData が必要です",
            };
          }
          const saved = upsertAddress(userId, {
            label: addressData.label,
            postalCode: addressData.postalCode,
            prefecture: addressData.prefecture,
            city: addressData.city,
            street: addressData.street,
            lat: addressData.lat,
            lng: addressData.lng,
            isDefault: addressData.isDefault ?? false,
          });
          return { success: true, data: saved };
        }

        case "deleteAddress": {
          if (!addressData?.id) {
            return {
              success: false,
              error: "deleteAddress には addressData.id が必要です",
            };
          }
          deleteAddress(addressData.id);
          return { success: true };
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
