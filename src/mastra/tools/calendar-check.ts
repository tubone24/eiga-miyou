import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getUserById } from "@/lib/db/users";
import { refreshGoogleToken } from "@/lib/auth/refresh-google-token";

const eventSchema = z.object({
  summary: z.string(),
  start: z.string(),
  end: z.string(),
  allDay: z.boolean(),
});

const busySlotSchema = z.object({
  start: z.string(),
  end: z.string(),
  summary: z.string().optional(),
});

type CalendarItem = {
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

function parseCalendarItems(items: CalendarItem[]) {
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

  const busySlots = items
    .filter((item) => item.start?.dateTime && item.end?.dateTime)
    .map((item) => ({
      start: item.start!.dateTime!,
      end: item.end!.dateTime!,
      summary: item.summary,
    }));

  return { events, busySlots };
}

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

    const user = getUserById(userId);
    if (!user) {
      return {
        events: [],
        busySlots: [],
        error: `User not found: ${userId}`,
      };
    }

    let accessToken = user.googleAccessToken;
    if (!accessToken) {
      return {
        events: [],
        busySlots: [],
        needsReauth: true,
        error: "Google access token is not available. User needs to re-authenticate.",
      };
    }

    const buildUrl = () => {
      const url = new URL(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events"
      );
      url.searchParams.set("timeMin", dateMin);
      url.searchParams.set("timeMax", dateMax);
      url.searchParams.set("singleEvents", "true");
      url.searchParams.set("orderBy", "startTime");
      return url.toString();
    };

    const doFetch = (token: string) =>
      fetch(buildUrl(), {
        headers: { Authorization: `Bearer ${token}` },
      });

    try {
      let res = await doFetch(accessToken);

      // 401: トークン自動更新を試みる
      if (res.status === 401 && user.googleRefreshToken) {
        const refreshResult = await refreshGoogleToken(userId, user.googleRefreshToken);
        if ("error" in refreshResult) {
          return {
            events: [],
            busySlots: [],
            needsReauth: true,
            error: `Token refresh failed: ${refreshResult.error}`,
          };
        }
        accessToken = refreshResult.accessToken;
        res = await doFetch(accessToken);
      }

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

      const data = (await res.json()) as { items?: CalendarItem[] };
      const items = data.items ?? [];
      return parseCalendarItems(items);
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
