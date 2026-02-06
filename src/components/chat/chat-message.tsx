"use client";

import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-neutral-900 text-white rounded-br-md"
            : "bg-neutral-100 text-neutral-900 rounded-bl-md"
        )}
      >
        <div className="whitespace-pre-wrap">{content}</div>
        {timestamp && (
          <div
            className={cn(
              "text-xs mt-1.5",
              isUser ? "text-neutral-400" : "text-neutral-500"
            )}
          >
            {timestamp}
          </div>
        )}
      </div>
    </div>
  );
}
