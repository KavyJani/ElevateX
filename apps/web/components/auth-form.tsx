"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LockKeyhole, MailCheck } from "lucide-react";
import { csrfHeaders } from "@/lib/csrf";

export function AuthForm({ mode, role }: { mode: "login" | "register"; role?: "investor" | "founder" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const isRegister = mode === "register";
  const title = isRegister ? "Create your ElevateX account" : "Sign in to ElevateX";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    const fd = new FormData(e.currentTarget);
    const accountEmail = String(fd.get("email") || "").trim();
    setEmail(accountEmail);
    const payload = isRegister
      ? { name: fd.get("name"), email: accountEmail, password: fd.get("password"), role, termsAccepted: fd.get("terms") === "on" }
      : { email: accountEmail, password: fd.get("password") };
    try {
      const csrf = await csrfHeaders();
      const r = await fetch(`/api/v1/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrf },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.message || "Account service is unavailable. No changes were confirmed.");
      if (isRegister) {
        setSuccess(data.message || "Check your email for the verification link. You can sign in after verifying.");
      } else {
        const dest = data.role === "admin" ? "/dashboard/admin" : data.role === "investor" ? "/dashboard/investor" : "/dashboard/founder";
        router.push(dest);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the account service. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    if (!email || resending) return;
    setResending(true);
    setError("");
    setSuccess("");
    try {
      const csrf = await csrfHeaders();
      const r = await fetch("/api/v1/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrf },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.message || "Verification could not be resent.");
      setSuccess(data.message || "If verification is pending, instructions were sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email service unavailable.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-[72vh] bg-[#fbfcfe] py-12 sm:py-16">
      <div className="container max-w-[520px]">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-[#6b7586] hover:text-cobalt"><ArrowLeft size={14} /> Back to ElevateX</Link>
        <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-9">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#eef3ff] text-cobalt"><LockKeyhole size={18} /></div>
          <h1 className="mt-5 text-2xl font-semibold tracking-[-.035em]">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{isRegister ? `Start a ${role} account. The server must accept an email-verification message before sign-in is enabled.` : "Use the verified email and password associated with your account."}</p>
          {isRegister && <div className="mt-4 rounded-lg border border-[#e8e4d5] bg-[#fbf9f2] p-3 text-xs leading-5 text-[#6e6648]">Registration requires PostgreSQL plus a configured email provider. If either is missing, the API returns an explicit error and creates no account.</div>}
          {!success && <form onSubmit={submit} className="mt-6 grid gap-4">
            {isRegister && <label className="field">Full legal name<input name="name" autoComplete="name" minLength={2} maxLength={120} required /></label>}
            <label className="field">Email address<input name="email" type="email" autoComplete="email" maxLength={254} required onChange={e=>setEmail(e.target.value)} /></label>
            <label className="field">Password<input name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} minLength={10} required /><small>Use at least 10 characters. Never reuse your email password elsewhere.</small></label>
            {isRegister && <label className="flex items-start gap-3 text-xs leading-5 text-[#596579]"><input type="checkbox" name="terms" required className="mt-1 h-4 w-4 accent-cobalt"/><span>I have read and agree to the platform terms and privacy information. This checkbox is intentionally not preselected.</span></label>}
            <button disabled={busy} className="btn btn-primary mt-1 w-full disabled:cursor-wait disabled:opacity-55">{busy ? (isRegister ? "Creating account…" : "Signing in…") : isRegister ? "Create account" : "Sign in"}<ArrowRight size={15} /></button>
          </form>}
          {error && <div role="alert" className="mt-4 rounded-lg border border-[#efd9d8] bg-[#fff7f6] p-3 text-sm leading-5 text-[#9b403b]">{error}</div>}
          {success && <div role="status" className="mt-5 rounded-lg border border-[#dce8dd] bg-[#f4faf4] p-4 text-sm leading-6 text-[#42654b]"><MailCheck size={16} className="mr-2 inline"/>{success}<div className="mt-3 flex flex-wrap gap-2"><Link className="btn btn-secondary !min-h-9 !text-xs" href="/sign-in">Continue to sign in <ArrowRight size={13}/></Link>{isRegister&&<button type="button" onClick={()=>void resendVerification()} disabled={resending} className="btn btn-secondary !min-h-9 !text-xs">{resending?"Resending…":"Resend verification"}</button>}</div></div>}
          {!success && !isRegister && email && <button type="button" onClick={()=>void resendVerification()} disabled={resending} className="mt-3 text-left text-xs font-semibold text-cobalt underline">{resending?"Resending…":"Need another verification email?"}</button>}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs text-muted">{isRegister ? <span>Already have an account? <Link href="/sign-in" className="font-semibold text-cobalt">Sign in</Link></span> : <span>New to ElevateX? <Link href="/join/founder" className="font-semibold text-cobalt">Create an account</Link></span>}<Link href="/reset-password" className="font-semibold text-cobalt">Forgot password?</Link></div>
        </div>
        <p className="mt-5 text-center text-[11px] leading-5 text-[#8490a1]">No public administrator registration is available. Role assignment is enforced by the server-side account record.</p>
      </div>
    </div>
  );
}
