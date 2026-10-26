"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { csrfHeaders } from "@/lib/csrf";
export default function ContactPage() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    const fd = new FormData(e.currentTarget);
    try {
      const csrf = await csrfHeaders();
      const r = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrf },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          message: fd.get("message"),
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(
          d.message ||
            "Contact service is not configured. Your message was not sent.",
        );
      }
      setStatus("Your message was received by the configured contact service.");
      e.currentTarget.reset();
    } catch (err) {
      setStatus(
        err instanceof Error
          ? err.message
          : "Could not reach the contact service. Your message was not sent.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container py-16 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <p className="eyebrow">Contact</p>
          <h1 className="display mt-3 text-[49px] leading-[1.02] sm:text-[60px]">
            A thoughtful question is a good place to start.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-muted">
            Tell us what you’re building, exploring, or trying to understand.
            Your note is sent only when a contact service is configured and the
            server confirms receipt.
          </p>
          <div className="mt-8 flex items-start gap-3 rounded-xl border border-line bg-[#fbfcfe] p-4">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#eef3ff] text-cobalt">
              <Mail size={17} />
            </span>
            <div>
              <p className="text-sm font-semibold">Contact channel status</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                This form will report clearly if its delivery integration is
                unavailable. It will never show a false sent confirmation.
              </p>
            </div>
          </div>
        </div>
        <form onSubmit={submit} className="surface grid gap-5 p-6 sm:p-8">
          <label className="field">
            Your name
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
            />
          </label>
          <label className="field">
            Email address
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          <label className="field">
            How can we help?
            <textarea name="message" required minLength={10} maxLength={3000} />
          </label>
          <button
            disabled={busy}
            className="btn btn-primary w-fit disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send message"}
            <Send size={15} />
          </button>
          {status && (
            <div
              role="status"
              className="rounded-lg border border-line bg-canvas p-3 text-sm text-muted"
            >
              {status}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
