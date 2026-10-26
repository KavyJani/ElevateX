"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { csrfHeaders } from "@/lib/csrf";
import {
  Copy,
  LoaderCircle,
  MessageSquareText,
  Plus,
  Send,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { ONBOARDING_STEPS } from "@/lib/onboarding-config";

type Role = "investor" | "founder";
type StoredConversation = {
  id: string;
  role: Role;
  preview: string;
  updatedAt: string;
};
type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  failed?: boolean;
  question?: string;
  context?: string;
};
type PendingForecast = { role: Role; question: string; context: string };
const suggestions = {
  founder: [
    "What if I have no sales yet?",
    "How should I explain my customer problem?",
    "What makes a forecast assumption useful?",
  ],
  investor: [
    "What should I look for in a public startup profile?",
    "How do I interpret a scenario forecast?",
    "Which diligence questions are useful early on?",
  ],
};
function parseAnswer(d: any): string | undefined {
  if (typeof d?.answer === "string") return d.answer;
  const answer = d?.answer;
  if (typeof answer?.choices?.[0]?.message?.content === "string")
    return answer.choices[0].message.content;
  if (typeof d?.choices?.[0]?.message?.content === "string")
    return d.choices[0].message.content;
  return undefined;
}
export function InvestoChat({ compact = false }: { compact?: boolean }) {
  const [role, setRole] = useState<Role>("founder");
  const [step, setStep] = useState("founder-4");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [copied, setCopied] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [accountRole, setAccountRole] = useState<Role | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [history, setHistory] = useState<StoredConversation[]>([]);
  const [pendingForecast, setPendingForecast] =
    useState<PendingForecast | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stepOptions = ONBOARDING_STEPS[role];
  const stepInfo = useMemo(
    () =>
      stepOptions.find((s) => `${role}-${s.index}` === step) || stepOptions[0]!,
    [role, step, stepOptions],
  );
  useEffect(() => {
    let active = true;
    fetch("/api/v1/auth/me", { credentials: "include", cache: "no-store" })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((account) => {
        if (!active) return;
        if (account?.role === "investor" || account?.role === "founder") {
          setAccountRole(account.role);
          setRole(account.role);
          setStep(`${account.role}-${account.role === "founder" ? 4 : 8}`);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (compact) return;
    const query = new URLSearchParams(window.location.search);
    if (query.get("context") !== "forecast") return;
    window.history.replaceState({}, "", window.location.pathname);
    try {
      const raw = sessionStorage.getItem("elevatex:pending-forecast");
      sessionStorage.removeItem("elevatex:pending-forecast");
      const data = raw ? (JSON.parse(raw) as Partial<PendingForecast>) : null;
      if (
        data?.role &&
        (data.role === "founder" || data.role === "investor") &&
        typeof data.question === "string" &&
        data.question.length <= 2000 &&
        typeof data.context === "string" &&
        data.context.length <= 8000
      ) {
        setPendingForecast(data as PendingForecast);
      } else {
        setGlobalError(
          "The forecast explanation handoff was unavailable or incomplete. No financial results were sent.",
        );
      }
    } catch {
      setGlobalError(
        "The private forecast explanation handoff could not be read. No financial results were sent.",
      );
    }
  }, [compact]);
  useEffect(() => {
    if (!accountRole) return;
    let active = true;
    fetch("/api/v1/ai/conversations", {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.items)) setHistory(data.items);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [accountRole]);
  useEffect(() => {
    if (!conversationId || !accountRole) return;
    let active = true;
    fetch(`/api/v1/ai/conversations/${conversationId}`, {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active || !Array.isArray(data?.messages)) return;
        setMessages(
          data.messages.map(
            (message: { id: string; role: string; text: string }) => ({
              id: message.id,
              role: message.role === "assistant" ? "assistant" : "user",
              text: message.text,
            }),
          ),
        );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [conversationId, accountRole]);
  useEffect(() => {
    try {
      const key = `elevatex:investo:${compact ? "panel" : "page"}`;
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const d = JSON.parse(raw);
        if (Array.isArray(d.messages)) setMessages(d.messages);
        if (d.role) setRole(d.role);
        if (d.step) setStep(d.step);
        if (d.conversationId) setConversationId(d.conversationId);
      }
    } catch {}
  }, [compact]);
  useEffect(() => {
    try {
      sessionStorage.setItem(
        `elevatex:investo:${compact ? "panel" : "page"}`,
        JSON.stringify({ messages, role, step, conversationId }),
      );
    } catch {}
  }, [messages, role, step, conversationId, compact]);
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);
  useEffect(() => {
    if (authLoading || !pendingForecast) return;
    if (!accountRole || pendingForecast.role !== accountRole) {
      setGlobalError(
        "Sign in with the same verified account that selected this forecast before sending an explanation request.",
      );
      setPendingForecast(null);
      return;
    }
    setRole(accountRole);
    const contextStep = `${accountRole}-${accountRole === "founder" ? 4 : 8}`;
    setStep(contextStep);
    setMessages([]);
    setConversationId(undefined);
    void send(
      pendingForecast.question,
      pendingForecast.context,
      true,
      contextStep,
    );
    setPendingForecast(null);
  }, [accountRole, authLoading, pendingForecast]);
  async function send(
    question: string,
    supplementalContext?: string,
    forceNew = false,
    requestStep = step,
  ) {
    const text = question.trim();
    if (!text || busy) return;
    if (!accountRole) {
      setGlobalError(
        authLoading
          ? "Checking account access…"
          : "Sign in with a verified founder or investor account to save a private conversation and use INVESTO.",
      );
      return;
    }
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text,
    };
    setMessages((old) => [...old, userMessage]);
    setDraft("");
    setGlobalError("");
    setBusy(true);
    try {
      const csrf = await csrfHeaders();
      const response = await fetch("/api/v1/ai/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrf },
        body: JSON.stringify({
          message: text,
          role: accountRole,
          step: requestStep,
          context:
            supplementalContext ??
            `Onboarding step: ${stepInfo.title}. ${stepInfo.intro}. ${stepInfo.help.meaning}. ${stepInfo.help.reason}.`,
          forecastConsent:
            supplementalContext?.startsWith("Computed forecast context:") ===
            true,
          conversationId: forceNew ? undefined : conversationId,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (typeof data.conversationId === "string")
        setConversationId(data.conversationId);
      if (!response.ok)
        throw new Error(
          data.message || `INVESTO request failed (${response.status}).`,
        );
      const answer = parseAnswer(data);
      if (!answer)
        throw new Error(
          "The configured AI provider returned no usable answer. Retry the same question.",
        );
      setConversationId(
        typeof data.conversationId === "string"
          ? data.conversationId
          : conversationId,
      );
      if (typeof data.conversationId === "string") {
        setHistory((old) => [
          {
            id: data.conversationId,
            role: accountRole,
            preview: text.slice(0, 120),
            updatedAt: new Date().toISOString(),
          },
          ...old.filter((item) => item.id !== data.conversationId),
        ]);
      }
      setMessages((old) => [
        ...old,
        { id: crypto.randomUUID(), role: "assistant", text: answer },
      ]);
    } catch (err) {
      const reason =
        err instanceof Error
          ? err.message
          : "AI service unavailable. Your message has not received an answer.";
      setGlobalError(reason);
      setMessages((old) => [
        ...old,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: reason,
          failed: true,
          question: text,
          context: supplementalContext,
        },
      ]);
      setDraft(text);
    } finally {
      setBusy(false);
    }
  }
  function newConversation() {
    if (busy) return;
    setMessages([]);
    setDraft("");
    setGlobalError("");
    setConversationId(undefined);
  }
  const height = compact ? "h-full" : "h-[600px]";
  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-white ${height}`}
    >
      <div className="border-b border-line px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#eef3ff] text-cobalt">
              <Sparkles size={16} />
            </span>
            <div>
              <h2 className="text-sm font-semibold">INVESTO</h2>
              <p className="text-[10px] text-muted">
                Your AI guide to smarter startup decisions.
              </p>
            </div>
          </div>
          <button
            onClick={newConversation}
            disabled={busy}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-semibold text-cobalt hover:bg-[#f3f6ff] disabled:opacity-40"
          >
            <Plus size={13} /> New conversation
          </button>
        </div>
        <div className="mt-3 grid grid-cols-[130px_1fr] gap-2">
          <label className="grid gap-1 text-[9px] font-semibold uppercase tracking-[.08em] text-[#7a8595]">
            Role context
            <select
              value={role}
              onChange={(e) => {
                const next = e.target.value as Role;
                setRole(next);
                setStep(`${next}-${next === "founder" ? 4 : 8}`);
              }}
              disabled={!!accountRole}
              className="h-8 rounded-md border border-line bg-white px-2 text-[11px] normal-case text-ink"
            >
              <option value="founder">Founder</option>
              <option value="investor">Investor</option>
            </select>
          </label>
          <label className="grid gap-1 text-[9px] font-semibold uppercase tracking-[.08em] text-[#7a8595]">
            Onboarding step
            <select
              value={step}
              onChange={(e) => setStep(e.target.value)}
              className="h-8 rounded-md border border-line bg-white px-2 text-[11px] normal-case text-ink"
            >
              {stepOptions.map((s) => (
                <option key={s.index} value={`${role}-${s.index}`}>
                  {s.index}. {s.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-2 text-[9px] leading-4 text-[#8590a0]">
          Authenticated role and selected step shape this question; the server
          does not expose private records to INVESTO.
        </p>
        {accountRole && history.length > 0 && (
          <label className="mt-3 grid gap-1 text-[9px] font-semibold uppercase tracking-[.08em] text-[#7a8595]">
            Private conversation history
            <select
              value={conversationId || ""}
              onChange={(e) => {
                if (e.target.value) setConversationId(e.target.value);
                else newConversation();
              }}
              className="h-8 rounded-md border border-line bg-white px-2 text-[11px] normal-case text-ink"
            >
              <option value="">Current conversation</option>
              {history.map((item) => (
                <option key={item.id} value={item.id}>
                  {new Date(item.updatedAt).toLocaleString()} · {item.preview}
                </option>
              ))}
            </select>
          </label>
        )}
        {!authLoading && !accountRole && (
          <p
            role="status"
            className="mt-3 rounded-md bg-[#fbf8ef] p-2 text-[10px] leading-4 text-[#766b47]"
          >
            Sign in with an email-verified investor or founder account to send and
            restore private conversations.{" "}
            <Link href="/sign-in" className="font-semibold underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div>
            <div className="mb-4 flex max-w-[92%] gap-2.5 rounded-xl rounded-tl-sm bg-[#f5f7fb] p-3.5">
              <Sparkles size={14} className="mt-0.5 shrink-0 text-cobalt" />
              <p className="text-xs leading-5 text-[#59667a]">
                I can explain startup, onboarding, and scenario concepts using
                the selected context. Answers are generated only when the
                configured AI service responds; verify important information
                independently.
              </p>
            </div>
            <p className="mb-2 text-[10px] font-semibold text-[#8590a0]">
              Try a context-aware question
            </p>
            <div className="grid gap-2">
              {suggestions[role].map((s) => (
                <button
                  key={s}
                  disabled={busy}
                  onClick={() => void send(s)}
                  className="rounded-lg border border-line px-3 py-2 text-left text-[11px] leading-4 text-[#526078] transition hover:border-[#bdccec] hover:bg-[#fbfcfe]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-xl px-3.5 py-3 ${m.role === "user" ? "rounded-br-sm bg-[#2457d6] text-white" : "rounded-tl-sm bg-[#f5f7fb] text-[#445168]"}`}
              >
                <p className="whitespace-pre-wrap text-xs leading-5">
                  {m.text}
                </p>
                {m.role === "assistant" && (
                  <div className="mt-2 flex items-center gap-3 border-t border-black/5 pt-2">
                    {!m.failed && (
                      <button
                        onClick={() => {
                          void navigator.clipboard?.writeText(m.text);
                          setCopied(m.id);
                          setTimeout(() => setCopied(""), 1500);
                        }}
                        className="flex items-center gap-1 text-[9px] font-semibold text-cobalt"
                      >
                        <Copy size={11} />
                        {copied === m.id ? "Copied" : "Copy response"}
                      </button>
                    )}
                    {m.failed && (
                      <button
                        disabled={busy}
                        onClick={() =>
                          void send(m.question || "", m.context, false, step)
                        }
                        className="text-[9px] font-semibold text-[#98463f] underline"
                      >
                        Retry this question
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {busy && (
          <div className="flex items-center gap-2 text-[11px] text-[#718096]">
            <LoaderCircle size={13} className="animate-spin text-cobalt" />
            INVESTO is checking the configured AI service…
          </div>
        )}
        {globalError && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-[#e8dfc7] bg-[#fbf8ef] p-2.5 text-[10px] leading-4 text-[#766b47]"
          >
            <TriangleAlert size={13} className="mt-0.5 shrink-0" />
            {globalError} No answer was fabricated; the contextual static step
            guide remains available in onboarding.
          </div>
        )}
      </div>
      <div className="border-t border-line p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(draft);
          }}
          className="flex items-end gap-2"
        >
          <label
            className="sr-only"
            htmlFor={`investo-message-${compact ? "panel" : "page"}`}
          >
            Message INVESTO
          </label>
          <textarea
            id={`investo-message-${compact ? "panel" : "page"}`}
            rows={2}
            maxLength={2000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              accountRole
                ? "Ask a specific question…"
                : "Sign in to start a private conversation"
            }
            className="min-h-[42px] flex-1 resize-none rounded-lg border border-line px-3 py-2 text-xs outline-none focus:border-cobalt"
            disabled={busy || !accountRole}
          />
          <button
            disabled={busy || !draft.trim() || !accountRole}
            aria-label="Send message"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cobalt text-white disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </form>
        <div className="mt-2 flex items-start justify-between gap-2 text-[9px] leading-4 text-[#8993a2]">
          <span>Not financial, legal, or investment advice.</span>
          <span className="text-right">
            {accountRole
              ? "History is private to your account."
              : "Sign in to restore private history."}
          </span>
        </div>
      </div>
    </div>
  );
}

export function InvestoLauncher() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open INVESTO assistant"
        className="fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-[#172236] px-4 text-sm font-semibold text-white shadow-[0_12px_34px_rgba(20,32,53,.28)] transition hover:-translate-y-0.5 hover:bg-[#24344f]"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#385fc0]">
          <Sparkles size={15} />
        </span>
        <span className="hidden sm:inline">Ask INVESTO</span>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[60] flex justify-end bg-[#111b2a]/40"
          role="dialog"
          aria-modal="true"
          aria-label="INVESTO assistant"
        >
          <button
            className="absolute inset-0 cursor-default"
            aria-label="Close INVESTO"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-full max-w-[460px] bg-white shadow-2xl sm:m-4 sm:h-[calc(100%-2rem)] sm:rounded-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-md px-2 py-1 text-xs font-semibold text-[#657186] hover:bg-canvas"
            >
              Close
            </button>
            <InvestoChat compact />
          </div>
        </div>
      )}
    </>
  );
}
