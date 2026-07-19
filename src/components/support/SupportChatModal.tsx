"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, LifeBuoy, Loader2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hi, I'm MERIT Support. I can help you with:\n\n• How to use MERIT features\n• AR 623-3 policy questions\n• Troubleshooting evaluation issues\n• Reporting bugs\n\nWhat can I help you with today?",
};

interface SupportChatModalProps {
  onClose: () => void;
}

export function SupportChatModal({ onClose }: SupportChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Message = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setSending(true);

    try {
      // Only send actual conversation (not the welcome message) to the API
      const apiMessages = history.filter((m) => m !== WELCOME_MESSAGE);
      const { message } = await api.post<{ message: string }>("/support/chat", {
        messages: apiMessages,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: message }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting right now. Please try again, or contact your unit S1 for urgent issues.",
        },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:justify-end sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="EES Support Chat"
    >
      {/* Translucent overlay — click to close */}
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Chat window */}
      <div className="relative z-10 flex h-[520px] w-full max-w-sm flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-modal)] sm:h-[560px] sm:max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border bg-[var(--color-navy)] px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
            <LifeBuoy className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">EES Support</p>
            <p className="text-[11px] text-white/60">
              Powered by AI · AR 623-3 aware
            </p>
          </div>
          <button
            type="button"
            aria-label="Close support chat"
            onClick={onClose}
            className="rounded-sm p-1 text-white/60 hover:text-white focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-1 px-3 py-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "user"
                    ? "rounded-br-sm bg-[var(--color-od-green)] text-white"
                    : "rounded-bl-sm bg-muted text-foreground",
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Disclaimer */}
        <p className="border-t border-border px-3 py-1.5 text-center text-[10px] text-muted-foreground">
          AI-generated. Always verify policy with official AR 623-3 or your S1.
        </p>

        {/* Input */}
        <div className="flex items-end gap-2 border-t border-border px-3 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask a question… (Enter to send)"
            aria-label="Type your message"
            className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            style={{ maxHeight: "96px" }}
          />
          <button
            type="button"
            aria-label="Send message"
            onClick={send}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 rounded-lg bg-[var(--color-od-green)] p-2 text-white transition-opacity hover:opacity-90 disabled:opacity-40 focus:outline-none"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
