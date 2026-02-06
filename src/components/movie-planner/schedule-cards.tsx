"use client";

import { ExternalLink } from "lucide-react";
import type { TheaterSchedule, CalendarBusySlot } from "@/types/schedule-card";

function FormatBadge({ format }: { format: string }) {
  const label = format.toUpperCase();
  const isSpecial =
    label.includes("IMAX") ||
    label.includes("4DX") ||
    label.includes("DOLBY") ||
    label.includes("ATMOS");

  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
        isSpecial
          ? "bg-amber-100 text-amber-700"
          : "bg-neutral-100 text-neutral-500"
      }`}
    >
      {label}
    </span>
  );
}

function extractHHMM(timeStr: string): string | null {
  // ISO 8601 dateTime → HH:MM
  const isoMatch = timeStr.match(/T(\d{2}:\d{2})/);
  if (isoMatch) return isoMatch[1];
  // Already HH:MM
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
  return null;
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function isConflicting(
  startTime: string,
  endTime: string | undefined,
  busySlots: CalendarBusySlot[],
): boolean {
  const showStart = extractHHMM(startTime);
  if (!showStart) return false;

  const showStartMin = timeToMinutes(showStart);
  // endTime未知時は startTime + 2時間で近似
  const showEndHHMM = endTime ? extractHHMM(endTime) : null;
  const showEndMin = showEndHHMM
    ? timeToMinutes(showEndHHMM)
    : showStartMin + 120;

  for (const slot of busySlots) {
    const busyStart = extractHHMM(slot.start);
    const busyEnd = extractHHMM(slot.end);
    if (!busyStart || !busyEnd) continue;

    const busyStartMin = timeToMinutes(busyStart);
    const busyEndMin = timeToMinutes(busyEnd);

    // 重複判定: 一方の開始が他方の終了より前 かつ 一方の終了が他方の開始より後
    if (showStartMin < busyEndMin && showEndMin > busyStartMin) {
      return true;
    }
  }
  return false;
}

export function ScheduleCards({
  schedules,
  calendarBusySlots,
}: {
  schedules: TheaterSchedule[];
  calendarBusySlots?: CalendarBusySlot[];
}) {
  if (schedules.length === 0) return null;

  // 上映回がある映画館のみ表示
  const withShowtimes = schedules.filter((s) => s.showtimes.length > 0);
  if (withShowtimes.length === 0) return null;

  return (
    <div className="rounded-xl bg-white border border-neutral-200/60 shadow-sm overflow-hidden animate-fade-in-up">
      <div className="px-4 pt-3 pb-2">
        <h3 className="font-serif text-sm font-semibold text-neutral-800 tracking-tight">
          上映スケジュール
        </h3>
      </div>

      <div className="divide-y divide-neutral-100">
        {withShowtimes.map((theater) => (
          <div key={theater.theaterId} className="px-4 py-3">
            <p className="text-xs font-medium text-neutral-700 mb-2">
              {theater.theaterName}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {theater.showtimes.map((st, i) => {
                const time = st.startTime.includes(":")
                  ? st.startTime
                  : st.startTime;
                const unavailable = st.isAvailable === false;
                const conflicting =
                  calendarBusySlots &&
                  calendarBusySlots.length > 0 &&
                  !unavailable &&
                  isConflicting(st.startTime, st.endTime, calendarBusySlots);

                const chip = (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border shrink-0 text-xs ${
                      unavailable
                        ? "border-neutral-200 bg-neutral-50 text-neutral-400 opacity-50"
                        : conflicting
                          ? "border-red-200 bg-red-50/50 text-red-600"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 transition-colors"
                    }`}
                  >
                    <span className="font-medium">{time}</span>
                    {st.format && <FormatBadge format={st.format} />}
                    {st.screen && (
                      <span className="text-neutral-400 text-[10px]">
                        {st.screen}
                      </span>
                    )}
                    {conflicting && (
                      <span className="text-[10px] font-medium text-red-500">
                        予定あり
                      </span>
                    )}
                    {st.ticketUrl && !unavailable && (
                      <ExternalLink className="h-3 w-3 text-neutral-400" />
                    )}
                  </div>
                );

                if (st.ticketUrl && !unavailable) {
                  return (
                    <a
                      key={i}
                      href={st.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      {chip}
                    </a>
                  );
                }

                return chip;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
