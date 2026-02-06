import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createNotification } from "@/lib/db/notifications";

export const notifyUser = createTool({
  id: "notify-user",
  description:
    "ユーザーに通知を送信します。通知は DB に保存され、SSE 経由でクライアントに配信されます。",
  inputSchema: z.object({
    userId: z.string().describe("通知先のユーザー ID"),
    type: z
      .enum(["payment_handoff", "booking_complete", "error", "info"])
      .describe("通知の種類"),
    message: z.string().describe("通知メッセージ"),
    data: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("通知に付加する任意のデータ"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    notificationId: z.string().describe("作成された通知の ID"),
  }),
  execute: async ({ userId, type, message, data }) => {

    const notification = createNotification({
      userId,
      type,
      message,
      data: data as Record<string, unknown> | undefined,
    });

    return {
      success: true,
      notificationId: notification.id,
    };
  },
});
