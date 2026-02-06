"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import {
  Film,
  Clock,
  MapPin,
  Train,
  UtensilsCrossed,
  AlertCircle,
} from "lucide-react";

interface PlanResultProps {
  result: string;
  movieTitle: string;
}

function getIconForText(text: string) {
  const lower = text.toLowerCase();
  if (
    lower.includes("映画") ||
    lower.includes("上映") ||
    lower.includes("スケジュール")
  )
    return <Film className="h-4 w-4 text-[oklch(0.55_0.12_40)] shrink-0" />;
  if (lower.includes("時間") || lower.includes("タイム"))
    return <Clock className="h-4 w-4 text-[oklch(0.55_0.12_40)] shrink-0" />;
  if (
    lower.includes("場所") ||
    lower.includes("映画館") ||
    lower.includes("劇場") ||
    lower.includes("シネマ")
  )
    return <MapPin className="h-4 w-4 text-[oklch(0.55_0.12_40)] shrink-0" />;
  if (
    lower.includes("移動") ||
    lower.includes("アクセス") ||
    lower.includes("経路")
  )
    return <Train className="h-4 w-4 text-[oklch(0.55_0.12_40)] shrink-0" />;
  if (
    lower.includes("食事") ||
    lower.includes("ランチ") ||
    lower.includes("ディナー") ||
    lower.includes("レストラン")
  )
    return (
      <UtensilsCrossed className="h-4 w-4 text-[oklch(0.55_0.12_40)] shrink-0" />
    );
  if (lower.includes("注意") || lower.includes("エラー"))
    return (
      <AlertCircle className="h-4 w-4 text-[oklch(0.55_0.12_40)] shrink-0" />
    );
  return null;
}

const markdownComponents: Components = {
  h2: ({ children }) => {
    const text = String(children);
    const icon = getIconForText(text);
    return (
      <div className="flex items-center gap-2.5 mt-7 mb-3 pb-2.5 border-b border-neutral-200/80">
        {icon}
        <h2 className="font-serif text-base font-semibold text-neutral-900 tracking-tight">
          {children}
        </h2>
      </div>
    );
  },
  h3: ({ children }) => {
    const text = String(children);
    const icon = getIconForText(text);
    return (
      <div className="flex items-center gap-2 mt-5 mb-2">
        {icon}
        <h3 className="text-sm font-semibold text-neutral-800">{children}</h3>
      </div>
    );
  },
};

export function PlanResult({ result, movieTitle }: PlanResultProps) {
  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center gap-2.5">
        <Film className="h-4 w-4 text-[oklch(0.55_0.12_40)]" />
        <h3 className="font-serif text-sm font-semibold text-neutral-900 tracking-tight">
          {movieTitle}
        </h3>
      </div>

      <div className="relative">
        {/* 装飾用背景レイヤー */}
        <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-neutral-200/40 to-transparent pointer-events-none" />

        <Card className="relative border-neutral-200/60 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl">
          <CardContent className="p-5 sm:p-6">
            <div className="prose prose-sm prose-neutral max-w-none prose-headings:font-semibold prose-a:text-[oklch(0.55_0.12_40)] prose-a:no-underline hover:prose-a:underline prose-strong:text-neutral-900 prose-li:marker:text-[oklch(0.65_0.10_40)]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {result}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
