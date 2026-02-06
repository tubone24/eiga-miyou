import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getUserById } from "@/lib/db/users";

export const calendarCreateEvent = createTool({
  id: "calendar-create-event",
  description:
    "Google Calendarに新しいイベントを作成します。映画の予定をカレンダーに登録する際に使用します。",
  inputSchema: z.object({
    userId: z.string().describe("ユーザーID"),
    summary: z.string().describe("イベントのタイトル"),
    description: z.string().optional().describe("イベントの説明"),
    startTime: z
      .string()
      .describe("開始日時 (ISO 8601形式, 例: 2025-01-15T14:00:00+09:00)"),
    endTime: z
      .string()
      .describe("終了日時 (ISO 8601形式, 例: 2025-01-15T16:30:00+09:00)"),
    location: z.string().optional().describe("場所 (映画館名など)"),
  }),
  outputSchema: z.object({
    eventId: z.string().optional(),
    htmlLink: z.string().optional(),
    status: z.string(),
    needsReauth: z.boolean().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, summary, description, startTime, endTime, location }) => {

    // Look up user and their Google tokens
    const user = getUserById(userId);
    if (!user) {
      return {
        status: "error",
        error: `User not found: ${userId}`,
      };
    }

    const accessToken = user.googleAccessToken;
    if (!accessToken) {
      return {
        status: "error",
        needsReauth: true,
        error:
          "Google access token is not available. User needs to re-authenticate.",
      };
    }

    try {
      const calendarUrl =
        "https://www.googleapis.com/calendar/v3/calendars/primary/events";

      const eventBody: Record<string, unknown> = {
        summary,
        start: {
          dateTime: startTime,
          timeZone: "Asia/Tokyo",
        },
        end: {
          dateTime: endTime,
          timeZone: "Asia/Tokyo",
        },
      };

      if (description) {
        eventBody.description = description;
      }

      if (location) {
        eventBody.location = location;
      }

      const res = await fetch(calendarUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      });

      if (res.status === 401) {
        return {
          status: "error",
          needsReauth: true,
          error:
            "Google access token expired. User needs to re-authenticate.",
        };
      }

      if (!res.ok) {
        const errorText = await res.text();
        return {
          status: "error",
          error: `Google Calendar API error: ${res.status} ${res.statusText} - ${errorText}`,
        };
      }

      const data = (await res.json()) as {
        id?: string;
        htmlLink?: string;
        status?: string;
      };

      return {
        eventId: data.id,
        htmlLink: data.htmlLink,
        status: data.status ?? "confirmed",
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        status: "error",
        error: `Failed to create calendar event: ${message}`,
      };
    }
  },
});
