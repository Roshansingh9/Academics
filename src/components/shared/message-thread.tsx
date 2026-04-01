"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDateTime } from "@/lib/utils";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import { usePolling } from "@/hooks/usePolling";
import Link from "next/link";

interface Message {
  id: string;
  content: string;
  sentAt: string;
  isMine: boolean;
}

interface MessageThreadProps {
  title: string;
  subtitle?: string;
  messages: Message[];
  sendUrl: string;
  pollUrl: string;
  viewerRole: "MENTOR" | "STUDENT";
}

export function MessageThread({ title, subtitle, messages: initial, sendUrl, pollUrl, viewerRole }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastIdRef = useRef<string | undefined>(messages[messages.length - 1]?.id);

  const backHref = viewerRole === "MENTOR" ? "/mentor/messages" : "/student/messages";

  const poll = useCallback(async () => {
    const after = lastIdRef.current ? `?after=${lastIdRef.current}` : "";
    const res = await fetch(`${pollUrl}${after}`);
    if (!res.ok) return;
    const newMsgs = await res.json();
    if (newMsgs.length > 0) {
      lastIdRef.current = newMsgs[newMsgs.length - 1].id;
      setMessages((prev) => [
        ...prev,
        ...newMsgs.map((m: { id: string; content: string; sentAt: string; senderType: string }) => ({
          id: m.id,
          content: m.content,
          sentAt: m.sentAt,
          isMine: m.senderType === (sendUrl.includes("/api/mentor/") ? "MENTOR" : "STUDENT"),
        })),
      ]);
    }
  }, [pollUrl, sendUrl]);

  usePolling(poll, 5000, true);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!content.trim()) return;
    setSending(true);
    const res = await fetch(sendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, { id: msg.id, content: msg.content, sentAt: msg.sentAt, isMine: true }]);
      lastIdRef.current = msg.id;
      setContent("");
      textareaRef.current?.focus();
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] bg-white border border-zinc-200 rounded-xl shadow-card overflow-hidden">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-100 bg-white shrink-0">
        <Link
          href={backHref}
          className="flex items-center justify-center h-7 w-7 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors duration-150"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[13px] shrink-0">
          {title.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-zinc-800 leading-none">{title}</p>
          {subtitle && <p className="text-[12px] text-zinc-400 mt-0.5 leading-none truncate">{subtitle}</p>}
        </div>
      </div>

      {/* ── Messages ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[13px] text-zinc-400">No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((m, i) => {
          const prevSame = i > 0 && messages[i - 1].isMine === m.isMine;
          return (
            <div key={m.id} className={cn("flex", m.isMine ? "justify-end" : "justify-start", prevSame ? "mt-0.5" : "mt-3")}>
              <div className={cn(
                "max-w-[68%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
                m.isMine
                  ? "bg-indigo-600 text-white rounded-br-md"
                  : "bg-zinc-100 text-zinc-800 rounded-bl-md"
              )}>
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={cn("text-[10px] mt-1 text-right", m.isMine ? "text-indigo-200" : "text-zinc-400")}>
                  {formatDateTime(m.sentAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ──────────────────────────────────── */}
      <div className="border-t border-zinc-100 px-4 py-3 bg-white shrink-0">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message…"
            rows={1}
            className="resize-none flex-1 rounded-xl border-zinc-200 bg-zinc-50 text-[13px] placeholder:text-zinc-400 min-h-[38px] max-h-[120px] py-2.5 focus-visible:ring-2 focus-visible:ring-indigo-500/25 focus-visible:border-indigo-400 transition-all duration-150"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            onClick={sendMessage}
            disabled={sending || !content.trim()}
            size="icon"
            className="h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 shrink-0 shadow-sm transition-all duration-150 active:scale-95 disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[11px] text-zinc-400 mt-1.5 ml-1">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
