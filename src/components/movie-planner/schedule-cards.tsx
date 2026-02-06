"use client";

import { ExternalLink } from "lucide-react";
import type { TheaterSchedule } from "@/types/schedule-card";

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

export function ScheduleCards({
  schedules,
}: {
  schedules: TheaterSchedule[];
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

                const chip = (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border shrink-0 text-xs ${
                      unavailable
                        ? "border-neutral-200 bg-neutral-50 text-neutral-400 opacity-50"
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
