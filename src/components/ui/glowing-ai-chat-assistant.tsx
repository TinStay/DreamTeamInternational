"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import {
  Paperclip,
  Link2,
  Code,
  Mic,
  Send,
  Info,
  Bot,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const maxChars = 2000;

/** Layered glow using brand primary + gradient end (opaque look, no glass). */
const aiFabShadow =
  "shadow-[0_10px_36px_-4px_rgba(219,78,78,0.55),0_20px_56px_-12px_rgba(107,63,154,0.5),0_0_0_1px_rgba(255,255,255,0.22)] hover:shadow-[0_14px_44px_-4px_rgba(219,78,78,0.62),0_26px_72px_-14px_rgba(107,63,154,0.55),0_0_0_2px_rgba(255,255,255,0.28)]";

const aiPanelShadow =
  "shadow-[0_28px_90px_-14px_rgba(219,78,78,0.58),0_16px_52px_-10px_rgba(107,63,154,0.52),0_12px_40px_-16px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.18)]";

export function FloatingAiAssistant() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [showSendModal, setShowSendModal] = useState(false);
  const [mounted] = useState(() => typeof document !== "undefined");
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSendModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showSendModal]);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, maxChars);
    setMessage(value);
    setCharCount(value.length);
  };

  const handleSend = useCallback(() => {
    if (!message.trim()) return;
    setMessage("");
    setCharCount(0);
    setShowSendModal(true);
    setIsChatOpen(false);
  }, [message]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || !chatRef.current?.contains(target)) {
        if (!(event.target as HTMLElement)?.closest?.(".floating-ai-button")) {
          setIsChatOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const modal =
    mounted && showSendModal
      ? createPortal(
      <div
        className="fixed inset-0 z-[10050] flex flex-col bg-background/80 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-assistant-modal-title"
      >
        <button
          type="button"
          onClick={() => setShowSendModal(false)}
          className="absolute right-4 top-4 z-[10051] flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background/95 text-foreground shadow-lg transition-colors hover:bg-muted"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 p-6 pt-20 sm:p-10 sm:pt-16">
          <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-2xl border border-border/40 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1600&q=80"
              alt=""
              className="h-full w-full object-cover"
              width={1600}
              height={900}
              loading="lazy"
              decoding="async"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          </div>
          <div className="max-w-xl text-center">
            <h2
              id="ai-assistant-modal-title"
              className="font-heading text-2xl font-bold text-foreground sm:text-3xl"
            >
              Thanks — we received your message
            </h2>
            <p className="mt-3 text-muted-foreground">
              Our team will follow up shortly. You can close this overlay and
              keep exploring the site.
            </p>
          </div>
        </div>
      </div>,
      document.body
    )
      : null;

  return (
    <>
      {modal}
      <div className="fixed bottom-6 right-6 z-[80]">
        <button
          type="button"
          className={cn(
            "floating-ai-button relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/35 bg-gradient-to-br from-[var(--primary-gradient-start)] to-[var(--primary-gradient-end)] text-primary-foreground transition-all duration-500",
            aiFabShadow,
            isChatOpen ? "rotate-90" : "rotate-0",
            "hover:scale-110 hover:rotate-[5deg]"
          )}
          onClick={() => setIsChatOpen((o) => !o)}
          aria-expanded={isChatOpen}
          aria-haspopup="dialog"
        >
          <span
            className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/18 to-transparent"
            aria-hidden
          />
          <span className="relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            {isChatOpen ? (
              <X className="h-8 w-8" aria-hidden />
            ) : (
              <Bot className="h-8 w-8" aria-hidden />
            )}
          </span>
        </button>

        {isChatOpen && (
          <div
            ref={chatRef}
            className="animate-ai-assistant-pop-in absolute bottom-20 right-0 w-max max-w-[min(100vw-2rem,500px)] origin-bottom-right"
          >
            <div
              className={cn(
                "relative flex flex-col overflow-hidden rounded-3xl border-2 border-white/25 bg-gradient-to-br from-[var(--primary-gradient-start)] via-[#c73d5e] to-[var(--primary-gradient-end)] text-primary-foreground",
                aiPanelShadow
              )}
            >
              <div className="relative z-[1] flex items-center justify-between px-5 pb-2 pt-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                  <span className="text-xs font-semibold tracking-wide text-white/95">
                    AI Assistant
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-white/25 bg-zinc-950 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
                    GPT-4
                  </span>
                  <span className="rounded-full border border-white/35 bg-zinc-950 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
                    Pro
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsChatOpen(false)}
                    className="rounded-full p-2 text-white transition-colors hover:bg-zinc-950/90"
                    aria-label="Close chat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="relative z-[1] mx-3 mb-2 overflow-hidden rounded-2xl border border-white/20 bg-zinc-950 shadow-[inset_0_2px_12px_rgba(0,0,0,0.45)] sm:mx-4">
                <textarea
                  value={message}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  rows={4}
                  maxLength={maxChars}
                  className="scrollbar-none min-h-[120px] w-full resize-none border-none bg-zinc-950 px-4 py-3.5 text-base font-normal leading-relaxed text-white outline-none placeholder:text-zinc-400 sm:px-5 sm:py-4"
                  placeholder="What would you like to explore today? Ask anything, share ideas, or request assistance..."
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                />
              </div>

              <div className="relative z-[1] px-3 pb-4 sm:px-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 rounded-xl border border-white/20 bg-zinc-950 p-1 shadow-lg">
                      <button
                        type="button"
                        className="group relative cursor-pointer rounded-lg border-none bg-transparent p-2.5 text-zinc-300 transition-all duration-300 hover:scale-105 hover:bg-zinc-800 hover:text-white"
                        aria-label="Upload files"
                      >
                        <Paperclip className="h-4 w-4 transition-all duration-300 group-hover:-rotate-12 group-hover:scale-125" />
                        <span className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-xs text-white opacity-0 shadow-xl transition-all duration-300 group-hover:-translate-y-1 group-hover:opacity-100">
                          Upload files
                        </span>
                      </button>

                      <button
                        type="button"
                        className="group relative cursor-pointer rounded-lg border-none bg-transparent p-2.5 text-zinc-300 transition-all duration-300 hover:scale-105 hover:bg-zinc-800 hover:text-white"
                        aria-label="Web link"
                      >
                        <Link2 className="h-4 w-4 transition-all duration-300 group-hover:rotate-12 group-hover:scale-125" />
                        <span className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-xs text-white opacity-0 shadow-xl transition-all duration-300 group-hover:-translate-y-1 group-hover:opacity-100">
                          Web link
                        </span>
                      </button>

                      <button
                        type="button"
                        className="group relative cursor-pointer rounded-lg border-none bg-transparent p-2.5 text-zinc-300 transition-all duration-300 hover:scale-105 hover:bg-zinc-800 hover:text-white"
                        aria-label="Code repo"
                      >
                        <Code className="h-4 w-4 transition-all duration-300 group-hover:-rotate-6 group-hover:scale-125" />
                        <span className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-xs text-white opacity-0 shadow-xl transition-all duration-300 group-hover:-translate-y-1 group-hover:opacity-100">
                          Code repo
                        </span>
                      </button>

                      <button
                        type="button"
                        className="group relative cursor-pointer rounded-lg border-none bg-transparent p-2.5 text-zinc-300 transition-all duration-300 hover:scale-105 hover:bg-zinc-800 hover:text-white"
                        aria-label="Design file"
                      >
                        <svg
                          className="h-4 w-4 transition-all duration-300 group-hover:rotate-12 group-hover:scale-125"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.354-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.015-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117v-6.038H8.148zm7.704 0c-2.476 0-4.49 2.015-4.49 4.49s2.014 4.49 4.49 4.49 4.49-2.015 4.49-4.49-2.014-4.49-4.49-4.49zm0 7.509c-1.665 0-3.019-1.355-3.019-3.019s1.355-3.019 3.019-3.019 3.019 1.354 3.019 3.019-1.354 3.019-3.019 3.019zM8.148 24c-2.476 0-4.49-2.015-4.49-4.49s2.014-4.49 4.49-4.49h4.588V24H8.148zm3.117-1.471V16.49H8.148c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.02 3.019 3.02h3.117z" />
                        </svg>
                        <span className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-xs text-white opacity-0 shadow-xl transition-all duration-300 group-hover:-translate-y-1 group-hover:opacity-100">
                          Design file
                        </span>
                      </button>
                    </div>

                    <button
                      type="button"
                      className="group relative cursor-pointer rounded-lg border border-white/20 bg-zinc-950 p-2.5 text-zinc-300 shadow-md transition-all duration-300 hover:scale-110 hover:bg-zinc-800 hover:text-white"
                      aria-label="Voice input"
                    >
                      <Mic className="h-4 w-4 transition-all duration-300 group-hover:-rotate-3 group-hover:scale-125" />
                      <span className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-xs text-white opacity-0 shadow-xl transition-all duration-300 group-hover:-translate-y-1 group-hover:opacity-100">
                        Voice input
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs font-medium text-white/80">
                      <span>{charCount}</span>/
                      <span className="text-white/95">{maxChars}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSend}
                      className={cn(
                        "group relative cursor-pointer rounded-xl border-2 border-white/40 bg-white px-3.5 py-3 font-semibold text-[var(--primary-gradient-start)] shadow-[0_10px_28px_-4px_rgba(0,0,0,0.45),0_4px_14px_rgba(255,255,255,0.35)] transition-all duration-300 hover:scale-110 hover:border-white hover:shadow-[0_16px_40px_-6px_rgba(0,0,0,0.5)] active:scale-95"
                      )}
                    >
                      <Send className="relative z-10 h-5 w-5 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:rotate-12 group-hover:scale-110" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/20 pt-3 text-xs text-white/85">
                  <div className="flex min-w-0 items-center gap-2">
                    <Info className="h-3.5 w-3.5 shrink-0 text-white/90" aria-hidden />
                    <span>
                      Press{" "}
                      <kbd className="rounded border border-white/25 bg-zinc-950 px-1.5 py-1 font-mono text-[11px] text-white shadow-inner">
                        Shift + Enter
                      </kbd>{" "}
                      for new line
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.85)]" />
                    <span>All systems operational</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
