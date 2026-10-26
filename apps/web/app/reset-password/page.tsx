"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { csrfHeaders } from "@/lib/csrf";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [busy, setBusy] = useState(false);
  async function request(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setState("");
    try {
      const csrf = await csrfHeaders();
      const response = await fetch("/api/v1/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrf },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Password reset is not configured. No email was confirmed.");
      setState(data.message || "If a verified account exists, reset instructions will be sent.");
    } catch (error) {
      setState(error instanceof Error ? error.message : "Reset service unavailable; no email was confirmed.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="min-h-[72vh] bg-[#fbfcfe] py-12"><div className="container max-w-[500px]"><Link href="/sign-in" className="inline-flex items-center gap-2 text-xs font-semibold text-[#6b7586]"><ArrowLeft size={14}/> Back to sign in</Link><div className="surface mt-6 p-7 sm:p-9"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#eef3ff] text-cobalt"><MailCheck size={19}/></span><h1 className="mt-5 text-2xl font-semibold">Reset your password</h1><p className="mt-2 text-sm leading-6 text-muted">Enter your account email. Responses do not reveal whether an account exists. A reset link is available only after email and database services are configured.</p><form onSubmit={request} className="mt-6 grid gap-4"><label className="field">Email address<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={event=>setEmail(event.target.value)}/></label><button disabled={busy} className="btn btn-primary">{busy ? "Checking…" : "Request a reset link"}</button></form>{state && <p role="status" className="mt-4 rounded-lg border border-line bg-canvas p-3 text-sm text-muted">{state}</p>}</div></div></div>;
}
