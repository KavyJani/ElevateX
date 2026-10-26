"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";
import { csrfHeaders } from "@/lib/csrf";

export function CompletePasswordReset({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || busy) return;
    setBusy(true);
    setMessage("");
    const password = String(new FormData(event.currentTarget).get("password") || "");
    try {
      const csrf = await csrfHeaders();
      const response = await fetch("/api/v1/auth/password-reset/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrf },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Reset link invalid or expired.");
      setDone(true);
      setMessage(data.message || "Password updated. Sign in with the new password.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Password reset failed.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="min-h-[70vh] bg-[#fbfcfe] py-16"><div className="container max-w-[500px]"><div className="surface p-7 sm:p-9"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#eef3ff] text-cobalt">{done ? <CheckCircle2 size={19}/> : <KeyRound size={19}/>}</span><h1 className="mt-5 text-2xl font-semibold">Choose a new password</h1><p className="mt-2 text-sm leading-6 text-muted">Reset links are one-use and expire after 30 minutes. All existing sessions are revoked after a successful change.</p>{!done && <form onSubmit={submit} className="mt-6 grid gap-4"><label className="field">New password<input type="password" name="password" autoComplete="new-password" minLength={10} maxLength={128} required/><small>Use at least 10 characters.</small></label><button disabled={busy || !token} className="btn btn-primary">{busy ? "Updating…" : "Update password"}</button></form>}{message && <p role="status" className="mt-4 rounded-lg border border-line bg-canvas p-3 text-sm text-muted">{message}</p>}<Link href="/sign-in" className="mt-5 inline-block text-sm font-semibold text-cobalt">Back to sign in</Link></div></div></div>;
}
