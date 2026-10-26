"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import { csrfHeaders } from "@/lib/csrf";

export function VerifyEmail({ token }: { token: string }) {
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Checking the one-time verification link…");
  useEffect(() => {
    let live = true;
    async function verify() {
      if (!token) {
        setState("error");
        setMessage("This verification link is missing its token.");
        return;
      }
      try {
        const csrf = await csrfHeaders();
        const response = await fetch("/api/v1/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...csrf },
          credentials: "include",
          body: JSON.stringify({ token }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "The link is invalid or expired.");
        if (live) {
          setState("success");
          setMessage(data.message || "Email verified. You may now sign in.");
        }
      } catch (error) {
        if (live) {
          setState("error");
          setMessage(error instanceof Error ? error.message : "Verification could not be completed.");
        }
      }
    }
    void verify();
    return () => { live = false; };
  }, [token]);
  return <div className="min-h-[70vh] bg-[#fbfcfe] py-16"><div className="container max-w-[520px]"><div className="surface p-8 text-center sm:p-10">{state === "loading" ? <LoaderCircle className="mx-auto animate-spin text-cobalt"/> : state === "success" ? <CheckCircle2 className="mx-auto text-[#38875a]"/> : <CircleAlert className="mx-auto text-[#b34b48]"/>}<h1 className="mt-5 text-2xl font-semibold">{state === "success" ? "Email verified" : state === "error" ? "Verification not completed" : "Verifying your email"}</h1><p role="status" className="mt-3 text-sm leading-6 text-muted">{message}</p><Link href="/sign-in" className="btn btn-primary mt-6">Continue to sign in</Link></div></div></div>;
}
