import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getUserById } from "@/lib/db/users";

const eventSchema = z.object({
  summary: z.string(),
  start: z.string(),
  end: z.string(),
  allDay: z.boolean(),
});

const busySlotSchema = z.object({
  start: z.string(),
  end: z.string(),
});

export const calendarCheck = createTool({
  id: "calendar-check",
  description:
    "Google Calendarの指定期間の予定を取得し、空き時間を確認します。ユーザーのスケジュール確認に使用します。",
  inputSchema: z.object({
    userId: z.string().describe("ユーザーID"),
    dateMin: z
      .string()
      .describe("検索開始日時 (ISO 8601形式, 例: 2025-01-15T00:00:00+09:00)"),
    dateMax: z
      .string()
      .describe("検索終了日時 (ISO 8601形式, 例: 2025-01-15T23:59:59+09:00)"),
  }),
  outputSchema: z.object({
    events: z.array(eventSchema),
    busySlots: z.array(busySlotSchema),
    needsReauth: z.boolean().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, dateMin, dateMax }) => {

    // Look up user and their Google tokens
    const user = getUserById(userId);
    if (!user) {
      return {
        events: [],
        busySlots: [],
        error: `User not found: ${userId}`,
      };
    }

    const accessToken = user.googleAccessToken;
    if (!accessToken) {
      return {
        events: [],
        busySlots: [],
        needsReauth: true,
        error: "Google access token is not available. User needs to re-authenticate.",
      };
    }

    try {
      const calendarUrl = new URL(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events"
      );
      calendarUrl.searchParams.set("timeMin", dateMin);
      calendarUrl.searchParams.set("timeMax", dateMax);
      calendarUrl.searchParams.set("singleEvents", "true");
      calendarUrl.searchParams.set("orderBy", "startTime");

      const res = await fetch(calendarUrl.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.status === 401) {
        return {
          events: [],
          busySlots: [],
          needsReauth: true,
          error: "Google access token expired. User needs to re-authenticate.",
        };
      }

      if (!res.ok) {
        return {
          events: [],
          busySlots: [],
          error: `Google Calendar API error: ${res.status} ${res.statusText}`,
        };
      }

      const data = (await res.json()) as {
        items?: Array<{
          summary?: string;
          start?: { dateTime?: string; date?: string };
          end?: { dateTime?: string; date?: string };
        }>;
      };

      const items = data.items ?? [];

      const events = items.map((item) => {
        const allDay = !item.start?.dateTime;
        const start = item.start?.dateTime ?? item.start?.date ?? "";
        const end = item.end?.dateTime ?? item.end?.date ?? "";

        return {
          summary: item.summary ?? "(no title)",
          start,
          end,
          allDay,
        };
      });

      // Compute busy slots from non-all-day events
      const busySlots = items
        .filter((item) => item.start?.dateTime && item.end?.dateTime)
        .map((item) => ({
          start: item.start!.dateTime!,
          end: item.end!.dateTime!,
        }));

      return {
        events,
        busySlots,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        events: [],
        busySlots: [],
        error: `Failed to fetch calendar events: ${message}`,
      };
    }
  },
});
