import { mastra } from "@/mastra";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const TOOL_LABELS: Record<string, string> = {
  userProfile: "ユーザー情報を取得中...",
  searchMovieSchedules: "映画情報を検索中...",
  searchTheaters: "近隣の映画館を検索中...",
  getDirections: "移動時間を計算中...",
  searchRestaurants: "周辺のレストランを検索中...",
  calendarCheck: "カレンダーの空きを確認中...",
  calendarCreateEvent: "カレンダーに予定を追加中...",
  browserAction: "ブラウザ操作を実行中...",
  credentialStore: "アカウント情報を確認中...",
  notifyUser: "通知を送信中...",
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { message, history } = await request.json();

  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "Message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const agent = mastra.getAgent("orchestrator");

  const now = new Date();
  const jstDateTime = format(now, "yyyy年M月d日(E) HH:mm", { locale: ja });

  let prompt = `[システム情報] 現在のユーザーID: ${session.user.id}\n`;
  prompt += `現在日時: ${jstDateTime} (日本時間)\n`;
  prompt += `このIDを使ってuserProfileツールでユーザー情報・住所を自動取得してください。ユーザーに聞かないでください。\n\n`;
  if (Array.isArray(history)) {
    for (const msg of history) {
      const prefix = msg.role === "user" ? "ユーザー" : "アシスタント";
      prompt += `${prefix}: ${msg.content}\n`;
    }
  }
  prompt += `ユーザー: ${message}`;

  const encoder = new TextEncoder();

  const streamWithRetry = async (maxRetries = 3) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await agent.stream(prompt, { maxSteps: 20 });
      } catch (err) {
        const isRateLimit =
          err instanceof Error &&
          (err.message.includes("rate limit") ||
            err.message.includes("429") ||
            err.message.includes("rate_limit_error"));
        if (isRateLimit && attempt < maxRetries) {
          const delay = Math.min(2000 * 2 ** attempt, 30000);
          console.warn(
            `[chat] レートリミット検出。${delay}ms 後にリトライ (${attempt + 1}/${maxRetries})`,
          );
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }
    throw new Error("リトライ回数超過");
  };

  const DEBUG = process.env.DEV_MODE === "true" || process.env.DEBUG_STREAM === "true";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const result = await streamWithRetry();
        const reader = result.fullStream.getReader();
        let chunkIndex = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (DEBUG) console.log(`[stream] ストリーム終了 (${chunkIndex} チャンク処理済み)`);
            break;
          }

          const chunk = value;
          chunkIndex++;

          if (chunk.type === "tool-call") {
            const { toolName } = chunk.payload;
            if (DEBUG) console.log(`[stream #${chunkIndex}] type=tool-call tool=${toolName}`);
            const label = TOOL_LABELS[toolName] ?? `${toolName} を実行中...`;
            controller.enqueue(encoder.encode(`event: status\ndata: ${JSON.stringify({ tool: toolName, label })}\n\n`));
          } else if (chunk.type === "tool-result") {
            const { toolName, result: toolResult } = chunk.payload;
            if (DEBUG) console.log(`[stream #${chunkIndex}] type=tool-result tool=${toolName} result=${JSON.stringify(toolResult).slice(0, 200)}`);
            if (toolResult && typeof toolResult === "object") {
              const resultObj = toolResult as Record<string, unknown>;
              // 映画情報をクライアントに送信
              if (toolName === "searchMovieSchedules" && resultObj.movie) {
                controller.enqueue(
                  encoder.encode(`event: movie\ndata: ${JSON.stringify(resultObj.movie)}\n\n`),
                );
              }
              // ユーザー住所をクライアントに送信
              if (toolName === "userProfile" && resultObj.data) {
                const data = resultObj.data as Record<string, unknown>;
                if (Array.isArray(data.addresses) && data.addresses.length > 0) {
                  const defaultAddr =
                    data.addresses.find(
                      (a: Record<string, unknown>) => a.isDefault,
                    ) ?? data.addresses[0];
                  controller.enqueue(
                    encoder.encode(`event: user-location\ndata: ${JSON.stringify(defaultAddr)}\n\n`),
                  );
                }
              }
              // 映画館リストをクライアントに送信
              if (toolName === "searchTheaters" && resultObj.theaters) {
                controller.enqueue(
                  encoder.encode(`event: theaters\ndata: ${JSON.stringify(resultObj.theaters)}\n\n`),
                );
              }
              // tool-result のエラーをクライアントに通知
              if (resultObj.error) {
                const errMsg = `${toolName}: ${String(resultObj.error)}`;
                controller.enqueue(
                  encoder.encode(`event: status\ndata: ${JSON.stringify({ tool: toolName, label: `⚠ ${errMsg.slice(0, 100)}` })}\n\n`),
                );
              }
            }
          } else if (chunk.type === "text-delta") {
            const { text: delta } = chunk.payload;
            if (DEBUG && delta) console.log(`[stream #${chunkIndex}] type=text-delta text="${delta.slice(0, 50)}"`);
            if (delta) {
              controller.enqueue(encoder.encode(`event: text\ndata: ${JSON.stringify({ delta })}\n\n`));
            }
          } else if (chunk.type === "error") {
            const errPayload = chunk.payload;
            const msg = String(errPayload?.error ?? "Unknown error");
            console.error(`[stream #${chunkIndex}] type=error ${msg}`);
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`));
          } else if (DEBUG) {
            console.log(`[stream #${chunkIndex}] type=${chunk.type}`);
          }
        }

        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to process message";
        console.error(`[stream] ストリーム例外: ${msg}`, err);
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
