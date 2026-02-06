"use client";

import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PlanForm, type PlanRequest } from "./plan-form";
import { PlanResult } from "./plan-result";
import { Button } from "@/components/ui/button";
import {
  Film,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { MovieCard, type MovieInfo } from "./movie-card";
import {
  TheaterMap,
  type UserLocation,
  type Theater,
} from "./theater-map";

const DAY_LABELS: Record<string, string> = {
  any: "直近",
  today: "今日",
  tomorrow: "明日",
  "this-weekend": "今週末",
  "next-weekend": "来週末",
  weekday: "平日",
  monday: "月曜",
  tuesday: "火曜",
  wednesday: "水曜",
  thursday: "木曜",
  friday: "金曜",
  saturday: "土曜",
  sunday: "日曜",
};

interface StatusStep {
  tool: string;
  label: string;
  done: boolean;
}

export function PlannerPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<PlanRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusSteps, setStatusSteps] = useState<StatusStep[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [movieInfo, setMovieInfo] = useState<MovieInfo | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [theaters, setTheaters] = useState<Theater[] | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleSubmit = async (request: PlanRequest) => {
    setLoading(true);
    setResult(null);
    setError(null);
    setLastRequest(request);
    setStatusSteps([]);
    setStreamingText("");
    setMovieInfo(null);
    setUserLocation(null);
    setTheaters(null);

    const dayLabel = DAY_LABELS[request.preferredDay] ?? request.preferredDay;

    let message = `「${request.movieTitle}」を観たいです。`;
    if (request.preferredDay !== "any") {
      message += `${dayLabel}に観たいです。`;
    }
    if (request.notes) {
      message += `\n考慮事項: ${request.notes}`;
    }
    if (request.includeMeal) {
      message += `\n映画前後の食事（ランチまたはディナー）も提案してください。`;
    }
    message += `\n近くの映画館で上映スケジュールを調べて、おすすめのプランを提案してください。`;

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: [] }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "エラーが発生しました");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSEパース: "event: xxx\ndata: yyy\n\n" 形式
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.split("\n");
          let eventType = "";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7);
            } else if (line.startsWith("data: ")) {
              data = line.slice(6);
            }
          }

          if (!eventType || !data) continue;

          try {
            const parsed = JSON.parse(data);

            if (eventType === "movie") {
              setMovieInfo(parsed as MovieInfo);
            } else if (eventType === "user-location") {
              setUserLocation(parsed as UserLocation);
            } else if (eventType === "theaters") {
              setTheaters(parsed as Theater[]);
            } else if (eventType === "status") {
              setStatusSteps((prev) => {
                const updated = prev.map((s) => ({ ...s, done: true }));
                if (updated.some((s) => s.tool === parsed.tool)) return updated;
                return [
                  ...updated,
                  { tool: parsed.tool, label: parsed.label, done: false },
                ];
              });
            } else if (eventType === "text") {
              fullText += parsed.delta;
              setStreamingText(fullText);
            } else if (eventType === "done") {
              setStatusSteps((prev) =>
                prev.map((s) => ({ ...s, done: true }))
              );
              setResult(fullText);
            } else if (eventType === "error") {
              throw new Error(parsed.message);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      // ストリーム終了でdoneイベントが来なかった場合
      if (!result && fullText) {
        setResult(fullText);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(
        err instanceof Error
          ? err.message
          : "エラーが発生しました。もう一度お試しください。"
      );
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleReset = () => {
    if (abortRef.current) abortRef.current.abort();
    setResult(null);
    setLastRequest(null);
    setError(null);
    setStatusSteps([]);
    setStreamingText("");
    setMovieInfo(null);
    setUserLocation(null);
    setTheaters(null);
  };

  // 映画カードとマップは loading 中も結果後も表示
  const showContextCards = movieInfo || (userLocation && theaters);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* ヘッダー */}
        {!result && !loading && !showContextCards && (
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="w-14 h-14 rounded-2xl bg-[oklch(0.96_0.01_60)] flex items-center justify-center mx-auto mb-4 border border-[oklch(0.91_0.02_60)]">
              <Film className="h-6 w-6 text-[oklch(0.45_0.10_40)]" />
            </div>
            <h1 className="font-serif text-xl font-semibold text-neutral-900 tracking-tight">
              映画プランを探す
            </h1>
            <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">
              観たい映画を入力すると、最適なプランを提案します
            </p>
          </div>
        )}

        {/* 映画情報カード + マップ (loading中も結果後も表示) */}
        {showContextCards && (
          <div className="space-y-4 mb-6">
            {movieInfo && <MovieCard movie={movieInfo} />}
            {userLocation && theaters && theaters.length > 0 && (
              <TheaterMap userLocation={userLocation} theaters={theaters} />
            )}
          </div>
        )}

        {/* ローディング中のステータス表示 */}
        {loading && (
          <div className="mb-6 animate-fade-in-up">
            <div className="flex items-center gap-2.5 mb-3">
              <Loader2 className="h-4 w-4 animate-spin text-[oklch(0.55_0.12_40)]" />
              <h2 className="font-serif text-sm font-semibold text-neutral-800 tracking-tight">
                プランを作成中...
              </h2>
            </div>

            {/* プログレスバー */}
            <div className="h-0.5 w-full bg-neutral-100 rounded-full overflow-hidden mb-4">
              <div className="h-full w-1/4 bg-[oklch(0.65_0.10_40)] rounded-full animate-progress-indeterminate" />
            </div>

            <div className="space-y-2.5">
              {statusSteps.map((step, i) => (
                <div
                  key={step.tool}
                  className="flex items-center gap-2.5 text-sm animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {step.done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  ) : (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[oklch(0.55_0.12_40)] shrink-0" />
                  )}
                  <span
                    className={
                      step.done
                        ? "text-neutral-400 line-through decoration-neutral-300"
                        : "text-neutral-700"
                    }
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* ストリーミング中のテキストプレビュー (Markdownレンダリング) */}
            {streamingText && (
              <div className="mt-5 p-4 rounded-xl bg-white border border-neutral-200/60 shadow-sm">
                <div className="prose prose-sm prose-neutral max-w-none leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamingText}
                  </ReactMarkdown>
                </div>
                <span className="inline-block w-0.5 h-4 bg-[oklch(0.55_0.12_40)] animate-subtle-pulse ml-0.5 align-text-bottom rounded-full" />
              </div>
            )}
          </div>
        )}

        {/* フォーム or 結果 */}
        {result ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[oklch(0.55_0.12_40)]" />
                <h2 className="font-serif text-sm font-semibold text-neutral-800 tracking-tight">
                  プラン提案
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors duration-200"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                新しく探す
              </Button>
            </div>
            <PlanResult
              result={result}
              movieTitle={lastRequest?.movieTitle ?? ""}
            />
          </div>
        ) : !loading ? (
          <PlanForm onSubmit={handleSubmit} loading={loading} />
        ) : null}

        {/* エラー */}
        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50/80 border border-red-200/60 text-sm text-red-700 flex items-start gap-2.5 animate-fade-in-up">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
