"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  CloudOff,
  FileText,
  LoaderCircle,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  getStep,
  ONBOARDING_STEPS,
  type FieldSpec,
} from "@/lib/onboarding-config";
import { csrfHeaders } from "@/lib/csrf";

type SaveState = "idle" | "saving" | "saved" | "failed";
type Values = Record<string, unknown>;
type ServerHelp = {
  meaning?: string;
  reason?: string;
  enterOrUpload?: string;
  example?: string;
  mistakes?: string;
  suggestedFollowUp?: string;
};
const roleWord = (role: string) =>
  role === "investor" ? "Investor" : "Founder";
function visible(field: FieldSpec, values: Values) {
  if (!field.when) return true;
  const raw = values[field.when.field];
  if (raw === undefined || raw === null || raw === "")
    return field.when.equals === false;
  return String(raw) === String(field.when.equals);
}
function FieldInput({
  field,
  value,
  onChange,
  uploaded,
  uploading,
}: {
  field: FieldSpec;
  value: unknown;
  onChange: (v: unknown) => void;
  uploaded: boolean;
  uploading: boolean;
}) {
  const id = `field-${field.id}`;
  const checked = Boolean(value);
  const control = "mt-1";
  if (field.type === "checkbox" || field.type === "toggle")
    return (
      <label
        htmlFor={id}
        className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-[#fbfcfe] p-3.5 text-sm font-medium leading-6 text-[#344056]"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-[5px] h-4 w-4 accent-cobalt"
        />
        <span>
          {field.label}
          {field.required && <span className="ml-1 text-[#a9453d]">*</span>}
        </span>
      </label>
    );
  if (field.type === "multi")
    return (
      <fieldset className="grid gap-2 rounded-lg border border-line bg-[#fbfcfe] p-3.5 sm:grid-cols-2">
        <legend className="px-1 text-sm font-semibold">
          {field.label}
          {field.required && <span className="ml-1 text-[#a9453d]">*</span>}
        </legend>
        {(field.options || []).map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-2 text-sm text-[#48546a]"
          >
            <input
              type="checkbox"
              checked={Array.isArray(value) && value.includes(option)}
              onChange={(e) => {
                const current = Array.isArray(value) ? (value as string[]) : [];
                onChange(
                  e.target.checked
                    ? [...current, option]
                    : current.filter((x) => x !== option),
                );
              }}
              className="h-4 w-4 accent-cobalt"
            />
            {option}
          </label>
        ))}
      </fieldset>
    );
  if (field.type === "select")
    return (
      <label className="field" htmlFor={id}>
        {field.label}
        {field.required && <span className="ml-1 text-[#a9453d]">*</span>}
        <select
          id={id}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 h-[46px] rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/10"
        >
          <option value="">Choose an option</option>
          {field.options?.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        {field.help && <small>{field.help}</small>}
      </label>
    );
  if (field.type === "textarea" || field.type === "summary")
    return (
      <label className="field" htmlFor={id}>
        {field.label}
        {field.required && <span className="ml-1 text-[#a9453d]">*</span>}
        {field.type === "summary" ? (
          <div
            id={id}
            aria-readonly="true"
            className={`${control} max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-[#f7f8fa] p-3 text-xs leading-5 text-[#596579]`}
          >
            {typeof value === "string" && value
              ? value
              : "Your saved answers will appear here after draft restoration. Verify every detail before submission."}
          </div>
        ) : (
          <textarea
            id={id}
            rows={field.rows || 4}
            maxLength={field.max}
            value={typeof value === "string" ? value : ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        {field.help && <small>{field.help}</small>}
      </label>
    );
  if (field.type === "repeater") {
    const rows = Array.isArray(value) ? (value as string[]) : [];
    return (
      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold">
          {field.label}
          {field.required && <span className="ml-1 text-[#a9453d]">*</span>}
        </legend>
        {rows.map((entry, index) => (
          <div key={`${field.id}-${index}`} className="flex gap-2">
            <input
              aria-label={`${field.label}, item ${index + 1}`}
              value={entry}
              onChange={(e) =>
                onChange(rows.map((x, i) => (i === index ? e.target.value : x)))
              }
              className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-cobalt"
            />
            <button
              type="button"
              aria-label={`Remove item ${index + 1}`}
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              className="grid h-10 w-10 place-items-center rounded-lg border border-line text-[#798395] hover:bg-canvas"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...rows, ""])}
          className="flex w-fit items-center gap-2 text-xs font-semibold text-cobalt"
        >
          <Plus size={14} /> Add item
        </button>
        {field.help && (
          <small className="text-xs leading-5 text-muted">{field.help}</small>
        )}
      </fieldset>
    );
  }
  if (field.type === "upload")
    return (
      <div className="rounded-xl border border-dashed border-[#cbd5e7] bg-[#fbfcfe] p-4">
        <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eef3ff] text-cobalt">
            <UploadCloud size={17} />
          </span>
          <span>
            <span className="block text-sm font-semibold">
              {field.label}
              {field.required && <span className="ml-1 text-[#a9453d]">*</span>}
            </span>
            <span className="mt-1 block text-xs leading-5 text-muted">
              {field.help ||
                "Private upload. Select a file to validate its type and size."}
            </span>
          </span>
        </label>
        <input
          id={id}
          type="file"
          accept={field.accept}
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChange(file);
          }}
          className="mt-3 block w-full text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:font-semibold file:text-cobalt"
        />
        {typeof value === "object" && value && ("name" in value || "fileName" in value) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-[#53627a]">
            <FileText size={14} />
            {String((value as { name?: string; fileName?: string }).fileName || (value as { name?: string }).name)}
            {uploading && <span className="pill">Uploading…</span>}
            {uploaded && (
              <span className="pill">
                <Check size={11} />
                Uploaded
              </span>
            )}
          </div>
        )}
        <p className="mt-3 rounded-md bg-[#faf7ec] px-3 py-2 text-[11px] leading-5 text-[#756b49]">
          Files are sent through the authenticated upload API. A field is complete only after storage confirms receipt. Never upload bank passwords or PINs.
        </p>
      </div>
    );
  const type =
    field.type === "email"
      ? "email"
      : field.type === "url"
        ? "url"
        : field.type === "tel"
          ? "tel"
          : field.type === "number"
            ? "number"
            : field.type === "date"
              ? "date"
              : "text";
  return (
    <label className="field" htmlFor={id}>
      {field.label}
      {field.required && <span className="ml-1 text-[#a9453d]">*</span>}
      <input
        id={id}
        type={type}
        min={field.min}
        max={field.max}
        placeholder={field.placeholder}
        value={
          typeof value === "string" || typeof value === "number"
            ? String(value)
            : ""
        }
        onChange={(e) =>
          onChange(
            type === "number"
              ? e.target.value === ""
                ? ""
                : Number(e.target.value)
              : e.target.value,
          )
        }
      />
      {field.help && <small>{field.help}</small>}
    </label>
  );
}

function InvestoExplain({
  step,
  serverHelp,
  role,
  stepNumber,
}: {
  step: NonNullable<ReturnType<typeof getStep>>;
  serverHelp: ServerHelp | null;
  role: "investor" | "founder";
  stepNumber: number;
}) {
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const guide = serverHelp;
  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;
    const original = question;
    setLoading(true);
    setReply("");
    try {
      const csrf = await csrfHeaders();
      const r = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrf },
        credentials: "include",
        body: JSON.stringify({
          message: original,
          role,
          step: `${role}-${stepNumber}`,
          context: `Current onboarding field set: ${step.title}. ${step.intro}`,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok)
        throw new Error(
          d.message ||
            "INVESTO is not available right now. Static step guidance remains above.",
        );
      const answer =
        typeof d.answer === "string"
          ? d.answer
          : d.answer?.choices?.[0]?.message?.content;
      if (!answer)
        throw new Error(
          "The configured AI did not return a usable answer. Retry or use the static guidance above.",
        );
      setReply(answer);
      setQuestion("");
    } catch (err) {
      setReply(
        err instanceof Error
          ? err.message
          : "AI service unavailable. Static step guidance remains available.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <aside className="h-fit rounded-xl border border-[#dce5f4] bg-[#f7f9fe] p-5 lg:sticky lg:top-[95px]">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-[#3658aa]">
        <Sparkles size={15} /> INVESTO explains
      </div>
      <p className="mt-3 text-[11px] leading-5 text-[#66748b]">
        Your AI guide to smarter startup decisions.
      </p>
      <div className="mt-4 grid gap-4 text-xs leading-5">
        <div>
          <h3 className="font-bold text-ink">What this step means</h3>
          <p className="mt-1 text-[#59667a]">
            {guide?.meaning || step.help.meaning}
          </p>
        </div>
        <div>
          <h3 className="font-bold text-ink">Why we ask</h3>
          <p className="mt-1 text-[#59667a]">
            {guide?.reason || step.help.reason}
          </p>
        </div>
        <div>
          <h3 className="font-bold text-ink">What to enter or upload</h3>
          <p className="mt-1 text-[#59667a]">
            {guide?.enterOrUpload || step.help.enter}
          </p>
        </div>
        <div>
          <h3 className="font-bold text-ink">Simple example</h3>
          <p className="mt-1 text-[#59667a]">
            {guide?.example || step.help.example}
          </p>
        </div>
        <div>
          <h3 className="font-bold text-ink">Common mistakes</h3>
          <p className="mt-1 text-[#59667a]">
            {guide?.mistakes || step.help.mistakes}
          </p>
        </div>
      </div>
      <div className="mt-4 border-t border-[#dce5f4] pt-4">
        <p className="text-[11px] font-semibold text-[#4f5e76]">
          Ask INVESTO a follow-up
        </p>
        <form onSubmit={ask} className="mt-2 flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={guide?.suggestedFollowUp || step.help.question}
            aria-label="Ask INVESTO"
            className="min-w-0 flex-1 rounded-lg border border-[#dfe5ef] bg-white px-3 py-2 text-xs outline-none focus:border-cobalt"
          />
          <button
            disabled={loading || !question.trim()}
            aria-label="Send question"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cobalt text-white disabled:opacity-40"
          >
            {loading ? (
              <LoaderCircle className="animate-spin" size={15} />
            ) : (
              <ArrowRight size={15} />
            )}
          </button>
        </form>
        {reply && (
          <div
            role="status"
            className="mt-3 whitespace-pre-wrap rounded-lg border border-[#dce5f4] bg-white p-3 text-xs leading-5 text-[#53627a]"
          >
            {reply}
          </div>
        )}
        <p className="mt-2 text-[10px] leading-4 text-[#7c8798]">
          AI may be unavailable. Static help is always available; verify all
          suggestions yourself.
        </p>
      </div>
    </aside>
  );
}

export function OnboardingWizard({
  role,
  stepNumber,
}: {
  role: "investor" | "founder";
  stepNumber: number;
}) {
  const router = useRouter();
  const step = getStep(role, stepNumber);
  const [values, setValues] = useState<Values>({});
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [serverHelp, setServerHelp] = useState<ServerHelp | null>(null);
  const [uploadedFields, setUploadedFields] = useState<string[]>([]);
  const [uploadingFields, setUploadingFields] = useState<string[]>([]);
  const [authState, setAuthState] = useState<"checking" | "ready" | "signed-out" | "unverified" | "forbidden" | "unavailable">("checking");
  const [authMessage, setAuthMessage] = useState("");
  const [serverCompletedStep, setServerCompletedStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepData = useMemo(() => ONBOARDING_STEPS[role], [role]);
  const storeKey = `elevatex:${role}:draft`;
  const shownFields = step?.fields.filter((f) => visible(f, values)) || [];
  const postDraft = useCallback(
    async (data: Values) => {
      setSaveState("saving");
      setSaveMessage("");
      try {
        const kind =
          role === "investor"
            ? "investor-applications"
            : "founder-applications";
        const csrf = await csrfHeaders();
        const r = await fetch(`/api/v1/${kind}/draft`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json", ...csrf },
          body: JSON.stringify({ step: stepNumber, answers: data }),
        });
        const body = await r.json().catch(() => ({}));
        if (!r.ok)
          throw new Error(
            body.message || `Draft save could not be confirmed (${r.status}).`,
          );
        setSaveState("saved");
        setSaveMessage("Saved on the server");
        return true;
      } catch (err) {
        setSaveState("failed");
        setSaveMessage(
          err instanceof Error
            ? err.message
            : "Unable to save to the server. Your current tab still has the answers.",
        );
        return false;
      }
    },
    [role, stepNumber],
  );
  useEffect(() => {
    if (!step) return;
    let live = true;
    setLoaded(false);
    setAuthState("checking");
    setAuthMessage("");
    const kind = role === "investor" ? "investor-applications" : "founder-applications";
    async function restore() {
      try {
        const authResponse = await fetch("/api/v1/auth/me", { credentials: "include", cache: "no-store" });
        const authData = await authResponse.json().catch(() => ({}));
        if (!authResponse.ok) throw new Error(authData.message || "Sign in with a verified account to continue.");
        if (authData.role !== role) {
          if (live) { setAuthState("forbidden"); setAuthMessage("This account does not have the required applicant role."); }
          return;
        }
        if (authData.emailVerified !== true) {
          if (live) { setAuthState("unverified"); setAuthMessage("Verify the account email before continuing. Email status is checked by the server, not by a form checkbox."); }
          return;
        }
        let local: Values = {};
        try { const raw = sessionStorage.getItem(storeKey); if (raw) local = JSON.parse(raw); } catch {}
        const draftResponse = await fetch(`/api/v1/${kind}/draft?step=${stepNumber}`, { credentials: "include", cache: "no-store" });
        const draftData = await draftResponse.json().catch(() => ({}));
        if (draftResponse.status === 403 && Number.isInteger(draftData.nextStep)) {
          if (live) router.replace(`/onboarding/${role}/${draftData.nextStep}`);
          return;
        }
        if (!draftResponse.ok) throw new Error(draftData.message || "Saved application could not be restored from the server.");
        const restored = { ...local, ...(draftData.answers || {}) } as Values;
        if (!live) return;
        setValues(restored);
        setServerCompletedStep(Number(draftData.completedStep) || 0);
        setUploadedFields(Object.entries(restored).filter(([, value]) => !!value && typeof value === "object" && "documentId" in value).map(([id]) => id));
        setSaveState("idle");
        setErrors([]);
        setAuthState("ready");
        setLoaded(true);
      } catch (error) {
        if (live) {
          const message = error instanceof Error ? error.message : "Account or application service unavailable.";
          setAuthMessage(message);
          setAuthState(message.toLowerCase().includes("sign in") || message.toLowerCase().includes("verified") ? "signed-out" : "unavailable");
        }
      }
    }
    void restore();
    return () => { live = false; };
  }, [storeKey, stepNumber, step, role, router]);
  useEffect(() => {
    if (!step) return;
    let live = true;
    fetch(`/api/v1/ai/onboarding-help/${role}/${stepNumber}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (live && d?.guide) setServerHelp(d.guide);
      })
      .catch(() => {
        if (live) setServerHelp(null);
      });
    return () => {
      live = false;
    };
  }, [role, stepNumber, step]);
  useEffect(() => {
    if (!step || !loaded) return;
    try {
      sessionStorage.setItem(storeKey, JSON.stringify(values));
    } catch {}
    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void postDraft(values);
    }, 900);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [values, loaded, storeKey, step, postDraft]);
  if (!step)
    return (
      <div className="container py-20">
        <div className="rounded-xl border border-line bg-canvas p-8">
          This onboarding step does not exist.
        </div>
      </div>
    );
  if (authState !== "ready" || !loaded)
    return <div className="min-h-[70vh] bg-[#fbfcfe] py-16"><div className="container max-w-[640px]"><div className="surface p-8"><p className="eyebrow">{authState === "checking" ? "Checking account" : "Account required"}</p><h1 className="mt-3 text-2xl font-semibold">{authState === "checking" ? "Restoring your application" : "Finish account verification first"}</h1><p role="status" className="mt-3 text-sm leading-6 text-muted">{authMessage || "The server must confirm your verified account and saved application before this step can open."}</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/sign-in" className="btn btn-primary">Sign in</Link><Link href="/reset-password" className="btn btn-secondary">Account help</Link></div></div></div></div>;
  function setField(id: string, v: unknown) {
    setValues((old) => ({ ...old, [id]: v }));
    setErrors([]);
  }
  function validate() {
    const missing: string[] = [];
    for (const f of shownFields) {
      if (!f.required) continue;
      const v = values[f.id];
      if (f.type === "upload") {
        if (!uploadedFields.includes(f.id))
          missing.push(
            `${f.label} must be uploaded and confirmed by private storage.`,
          );
        continue;
      }
      if (f.type === "checkbox" || f.type === "toggle") {
        if (v !== true)
          missing.push(`${f.label} must be selected to continue.`);
        continue;
      }
      if (
        v === undefined ||
        v === null ||
        v === "" ||
        (Array.isArray(v) && v.length === 0)
      )
        missing.push(`${f.label} is required.`);
    }
    return missing;
  }
  async function continueStep() {
    const missing = validate();
    if (missing.length) {
      setErrors(missing);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (stepNumber === 12) {
      setSubmitting(true);
      const saved = await postDraft(values);
      if (!saved) {
        setErrors([
          "Your final review is complete, but the server did not confirm the draft. Configure persistence before submitting.",
        ]);
        setSubmitting(false);
        return;
      }
      try {
        const kind =
          role === "investor"
            ? "investor-applications"
            : "founder-applications";
        const csrf = await csrfHeaders();
        const r = await fetch(`/api/v1/${kind}/submit`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", ...csrf },
          body: JSON.stringify({ step: stepNumber, answers: values }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok)
          throw new Error(
            d.message ||
              `Application submission was not confirmed (${r.status}).`,
          );
        router.push(`/dashboard/${role}`);
      } catch (e) {
        setErrors([
          e instanceof Error
            ? e.message
            : "Submission could not be confirmed. Your answers are retained in this tab.",
        ]);
      } finally {
        setSubmitting(false);
      }
      return;
    }
    const saved = await postDraft(values);
    if (!saved) {
      setErrors(["The server did not confirm your draft. Retry the save before continuing."]);
      return;
    }
    try {
      const kind = role === "investor" ? "investor-applications" : "founder-applications";
      const csrf = await csrfHeaders();
      const response = await fetch(`/api/v1/${kind}/complete-step`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrf },
        body: JSON.stringify({ step: stepNumber, answers: values }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "The server did not confirm this step.");
      setServerCompletedStep(Number(data.completedStep) || stepNumber);
      router.push(`/onboarding/${role}/${stepNumber + 1}`);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Step completion could not be confirmed."]);
    }
  }
  function goBack() {
    if (stepNumber > 1) router.push(`/onboarding/${role}/${stepNumber - 1}`);
    else router.push(`/dashboard/${role}`);
  }
  async function saveExit() {
    if (timer.current) clearTimeout(timer.current);
    const saved = await postDraft(values);
    if (!saved) {
      setSaveMessage(
        "Not saved on the server. This tab's draft remains available; try again when the connection is restored.",
      );
      return;
    }
    router.push(`/dashboard/${role}`);
  }
  return (
    <div className="min-h-screen bg-[#fbfcfe] pb-16">
      <div className="border-b border-line bg-white">
        <div className="container flex h-[62px] items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold tracking-[-.03em]"
          >
            <span className="grid h-7 w-7 place-items-center rounded-md bg-cobalt text-xs font-extrabold text-white">
              X
            </span>
            ElevateX{" "}
            <span className="font-normal text-[#8993a2]">
              / {roleWord(role)} application
            </span>
          </Link>
          <Link
            href="/investo"
            className="flex items-center gap-2 text-xs font-semibold text-cobalt"
          >
            <CircleHelp size={15} /> Help
          </Link>
        </div>
      </div>
      <div className="container pt-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">{roleWord(role)} application</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-.03em] sm:text-3xl">
              {step.title}
            </h1>
          </div>
          <div
            aria-live="polite"
            className="flex items-center gap-2 text-xs text-[#748094]"
          >
            {saveState === "saving" ? (
              <>
                <LoaderCircle size={14} className="animate-spin text-cobalt" />
                Saving…
              </>
            ) : saveState === "saved" ? (
              <>
                <Check size={14} className="text-[#3c8a62]" />
                {saveMessage}
              </>
            ) : saveState === "failed" ? (
              <>
                <CloudOff size={14} className="text-[#9e6047]" />
                <span className="max-w-[210px] truncate" title={saveMessage}>
                  Not saved · retry available
                </span>
              </>
            ) : (
              <>
                <Save size={14} />
                Unsaved changes
              </>
            )}
          </div>
        </div>
        <div className="mt-5" aria-label={`Step ${stepNumber} of 12`}>
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[.08em] text-[#7d8796]">
            <span>Step {stepNumber} of 12</span>
            <span>{Math.round((stepNumber / 12) * 100)}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8ebf1]">
            <div
              className="h-full rounded-full bg-cobalt transition-all duration-300"
              style={{ width: `${(stepNumber / 12) * 100}%` }}
            />
          </div>
          <div className="mt-2 hidden grid-cols-12 gap-1 sm:grid">
            {stepData.map((s, i) => (
              <div
                key={s.index}
                className={`truncate text-[9px] ${i + 1 === stepNumber ? "font-bold text-cobalt" : "text-[#9099a7]"}`}
                aria-current={i + 1 === stepNumber ? "step" : undefined}
              >
                {String(i + 1).padStart(2, "0")} {s.title}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_350px]">
          <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
            <p className="mb-6 text-sm leading-6 text-muted">{step.intro}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void continueStep();
              }}
              className="grid gap-5"
            >
              {shownFields.map((field) => (
                <FieldInput
                  key={field.id}
                  field={field}
                  value={values[field.id]}
                  uploaded={uploadedFields.includes(field.id)}
                  onChange={(v) => {
                    if (field.type === "upload") {
                      const file = v as File;
                      const maxBytes = /pitch/i.test(field.id) ? 20 * 1024 * 1024 : 10 * 1024 * 1024;
                      if (file.size > maxBytes) {
                        setErrors([`${file.name} is larger than the ${maxBytes / 1024 / 1024} MB limit.`]);
                        return;
                      }
                      setField(field.id, { name: file.name, size: file.size, type: file.type, uploaded: false });
                      setUploadingFields((current) => [...new Set([...current, field.id])]);
                      void (async () => {
                        try {
                          const form = new FormData();
                          form.append("documentType", field.id);
                          form.append("file", file);
                          const csrf = await csrfHeaders();
                          const response = await fetch("/api/v1/documents/upload", { method: "POST", credentials: "include", headers: csrf, body: form });
                          const data = await response.json().catch(() => ({}));
                          if (!response.ok || !data.document?.id) throw new Error(data.message || "Private storage did not confirm this upload.");
                          setField(field.id, { documentId: data.document.id, fileName: data.document.fileName, status: data.document.status });
                          setUploadedFields((current) => [...new Set([...current, field.id])]);
                          setErrors([]);
                        } catch (error) {
                          setErrors([error instanceof Error ? error.message : "Upload failed; retry when storage is available."]);
                        } finally {
                          setUploadingFields((current) => current.filter((entry) => entry !== field.id));
                        }
                      })();
                    } else setField(field.id, v);
                  }}
                  uploading={uploadingFields.includes(field.id)}
                />
              ))}
              {stepNumber === 12 && (
                <div className="rounded-lg border border-[#dce5f3] bg-[#f7f9fe] p-4 text-xs leading-5 text-[#59677d]">
                  <div className="flex items-center gap-2 font-semibold text-[#344e8e]">
                    <ShieldCheck size={15} /> Final review
                  </div>
                  <p className="mt-2">
                    Review answers, missing information, and upload status.
                    Submission remains disabled unless the configured backend
                    confirms persistence. AI suggestions are optional and never
                    alter your answers.
                  </p>
                  <details className="mt-3">
                    <summary className="cursor-pointer font-semibold">
                      Current answer summary{" "}
                      <ChevronDown size={13} className="inline" />
                    </summary>
                    <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-white p-3 text-[10px] leading-4">
                      {JSON.stringify(values, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
              {errors.length > 0 && (
                <div
                  role="alert"
                  className="rounded-lg border border-[#efd9d8] bg-[#fff7f6] p-3 text-xs leading-5 text-[#94423c]"
                >
                  <p className="font-semibold">
                    Please resolve before continuing
                  </p>
                  <ul className="mt-1 list-inside list-disc">
                    {errors.map((e, i) => (
                      <li key={`${e}-${i}`}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                <button
                  type="button"
                  onClick={goBack}
                  className="btn btn-secondary !min-h-10"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <div className="ml-auto flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void saveExit()}
                    className="btn btn-secondary !min-h-10"
                    disabled={saveState === "saving"}
                  >
                    <Save size={14} /> Save and exit
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary !min-h-10 disabled:opacity-50"
                  >
                    {stepNumber === 12
                      ? submitting
                        ? "Submitting…"
                        : "Submit application"
                      : "Continue"}
                    {stepNumber === 12 ? (
                      <Send size={14} />
                    ) : (
                      <ArrowRight size={14} />
                    )}
                  </button>
                </div>
              </div>
              {saveState === "failed" && (
                <button
                  type="button"
                  onClick={() => void postDraft(values)}
                  className="text-left text-xs font-semibold text-cobalt underline underline-offset-2"
                >
                  Retry saving this draft
                </button>
              )}
            </form>
          </section>
          <InvestoExplain
            role={role}
            stepNumber={stepNumber}
            step={step}
            serverHelp={serverHelp}
          />
        </div>
        <p className="mt-4 text-[10px] leading-5 text-[#8792a2]">
          Your draft is retained in this browser tab as a convenience; that is
          not server persistence. It is only marked saved after the API
          confirms.
        </p>
      </div>
    </div>
  );
}
