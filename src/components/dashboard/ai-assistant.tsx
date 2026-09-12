"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useDashStore } from "./dash-store";
import { ease } from "./shared";

type Msg = { role: "user" | "assistant"; content: string };

export function AiAssistant() {
  const { t, dir } = useLanguage();
  const { aiOpen, setAiOpen } = useDashStore();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!aiOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAiOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aiOpen, setAiOpen]);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const history = messages.slice(-6);
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed");
      }
      setMessages([...next, { role: "assistant", content: data.data.reply }]);
    } catch (err: any) {
      setMessages([...next, { role: "assistant", content: `⚠️ ${err.message || "Failed to get response"}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {aiOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4"
          dir={dir}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAiOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.3, ease }}
            className="modal-shell relative z-10 flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:h-[75vh] sm:rounded-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-primary px-5 py-3.5 text-white">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">{t("ai.title")}</h3>
                  <p className="text-[11px] text-white/70">{t("ai.subtitle")}</p>
                </div>
              </div>
              <button
                onClick={() => setAiOpen(false)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="tanoor-scroll flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
              {messages.length === 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200 whitespace-pre-line">
                  {t("ai.welcome")}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] rounded-2xl rounded-ee-sm bg-primary px-4 py-2.5 text-sm text-white shadow-sm"
                        : "max-w-[85%] rounded-2xl rounded-ss-sm border border-border bg-muted px-4 py-2.5 text-sm text-foreground shadow-sm whitespace-pre-line"
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-ss-sm border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t("ai.thinking")}
                  </div>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="border-t border-border bg-muted/30 px-4 py-1.5 text-center text-[10px] text-muted-foreground">
              {t("ai.disclaimer")}
            </div>

            {/* Input */}
            <form onSubmit={send} className="flex items-center gap-2 border-t border-border bg-card p-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("ai.placeholder")}
                className="tanoor-input h-11 flex-1 rounded-xl border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-white shadow-sm transition disabled:opacity-50"
                aria-label={t("ai.send")}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 rtl:rotate-180" />}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
