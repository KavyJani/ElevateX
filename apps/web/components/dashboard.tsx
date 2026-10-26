"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Check,
  Clock3,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  ChartNoAxesCombined,
  CircleHelp,
  FileLock2,
  FolderKanban,
  Gauge,
  Inbox,
  LockKeyhole,
  LogOut,
  MessageSquareText,
  Plus,
  Send,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { csrfHeaders } from "@/lib/csrf";
import { FinancialRecordsPanel } from "@/components/financial-records-panel";

type Role = "founder" | "investor" | "admin";
type Item = readonly [string, string, typeof Gauge, string];
const founderItems: Item[] = [
  ["Overview", "overview", Gauge, ""],
  ["Startup profile", "profile", BriefcaseBusiness, "/api/v1/startups/mine"],
  [
    "Application feedback",
    "feedback",
    Inbox,
    "/api/v1/founder-applications/status",
  ],
  ["Documents", "documents", FileLock2, "/api/v1/documents"],
  [
    "Funding requirements",
    "funding",
    Activity,
    "/api/v1/founder-applications/draft",
  ],
  [
    "Financial history",
    "financials",
    ChartNoAxesCombined,
    "/api/v1/financial-records",
  ],
  [
    "Investor interest",
    "interest",
    UsersRound,
    "/api/v1/connections/interests",
  ],
  [
    "Connections & messages",
    "messages",
    MessageSquareText,
    "/api/v1/conversations",
  ],
  ["Meetings", "meetings", CalendarClock, "/api/v1/meetings"],
  ["Notifications", "notifications", Bell, "/api/v1/notifications"],
  ["Financial forecasts", "forecasts", ChartNoAxesCombined, "/forecasts"],
  ["INVESTO", "investo", Sparkles, "/investo"],
  ["Settings & security", "settings", Settings2, "/api/v1/users/settings"],
];
const investorItems: Item[] = [
  ["Overview", "overview", Gauge, ""],
  ["Discover startups", "discover", Search, "/explore"],
  ["Saved startups", "saved", FolderKanban, "/api/v1/watchlist"],
  [
    "Preferences",
    "preferences",
    Settings2,
    "/api/v1/investor-applications/draft",
  ],
  ["Interest requests", "interest", Inbox, "/api/v1/connections/interests"],
  [
    "Connections & messages",
    "messages",
    MessageSquareText,
    "/api/v1/conversations",
  ],
  ["Meetings", "meetings", CalendarClock, "/api/v1/meetings"],
  ["Notifications", "notifications", Bell, "/api/v1/notifications"],
  ["Shared documents", "documents", FileLock2, "/api/v1/documents/shared"],
  ["Financial scenarios", "forecasts", ChartNoAxesCombined, "/forecasts"],
  ["Investment history", "history", Activity, "/api/v1/financial-records"],
  ["INVESTO", "investo", Sparkles, "/investo"],
  ["Settings & security", "settings", Settings2, "/api/v1/users/settings"],
];
const adminItems: Item[] = [
  ["Overview", "overview", Gauge, ""],
  ["Application queue", "applications", Inbox, "/api/v1/admin/applications"],
  ["Document review", "documents", FileLock2, "/api/v1/admin/documents"],
  ["Public listings", "listings", BriefcaseBusiness, "/api/v1/admin/startups"],
  ["Users", "users", UsersRound, "/api/v1/admin/users"],
  ["Platform statistics", "stats", Activity, "/api/v1/startups/stats"],
  ["Security events", "security", ShieldCheck, "/api/v1/admin/security-events"],
  ["Audit log", "audit", LockKeyhole, "/api/v1/admin/audit-logs"],
];
const headings: Record<string, string> = {
  overview: "Overview",
  profile: "Startup profile",
  feedback: "Application feedback",
  documents: "Documents",
  funding: "Funding requirements",
  financials: "Financial history",
  interest: "Interest requests",
  messages: "Connections and messages",
  meetings: "Meetings",
  notifications: "Notifications",
  forecasts: "Financial forecasts",
  investo: "INVESTO assistant",
  settings: "Settings and security",
  discover: "Startup discovery",
  saved: "Saved startups",
  preferences: "Investment preferences",
  history: "Investment history",
  applications: "Application queue",
  listings: "Public listings",
  users: "User management",
  stats: "Platform statistics",
  security: "Security events",
  audit: "Audit log",
};
type AppRow = {
  id: string;
  role: string;
  status: string;
  reviewNote?: string | null;
  applicant: { name: string; email: string };
  data: unknown;
};
type DocRow = {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  status: string;
  owner: { name: string; email: string };
};
type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  disabledAt: string | null;
};
type StartupRow = {
  id: string;
  name: string;
  publicApproved: boolean;
  founder?: { name: string; email: string } | null;
};
type Peer = { id: string; name: string; email: string };
type ConversationRow = {
  id: string;
  participants: Peer[];
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
};
type MessageRow = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};
type Thread = { id: string; participants: Peer[]; messages: MessageRow[] };
type MeetingRow = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  status: string;
  creator: Peer;
  members: Array<{ userId: string; status: string; user: Peer }>;
};
type NoticeRow = {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};
type FinancialRow = {
  id: string;
  period: string;
  kind: string;
  amount: string;
  currency: string;
  createdAt: string;
};

export function Dashboard({ role }: { role: Role }) {
  const params = useSearchParams();
  const items =
    role === "founder"
      ? founderItems
      : role === "investor"
        ? investorItems
        : adminItems;
  const [user, setUser] = useState<{
    id: string;
    email: string;
    role: string;
  } | null>(null);
  const [auth, setAuth] = useState<
    "loading" | "ready" | "signed-out" | "unavailable" | "forbidden"
  >("loading");
  const [selected, setSelected] = useState(params.get("section") || "overview");
  const [overview, setOverview] = useState<Record<string, unknown> | null>(
    null,
  );
  const [records, setRecords] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [acted, setActed] = useState<Record<string, boolean>>({});
  const [connections, setConnections] = useState<Peer[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [newPeerId, setNewPeerId] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [meetingDraft, setMeetingDraft] = useState({
    otherUserId: "",
    title: "",
    startsAt: "",
    endsAt: "",
  });
  const [rescheduleDrafts, setRescheduleDrafts] = useState<
    Record<string, { startsAt: string; endsAt: string; timezone: string }>
  >({});
  const endpointFor = (id: string) =>
    items.find((entry) => entry[1] === id)?.[3] || "";

  useEffect(() => {
    let live = true;
    fetch("/api/v1/auth/me", { credentials: "include", cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          if (live) setAuth(r.status === 401 ? "signed-out" : "unavailable");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!live || !data) return;
        setUser(data);
        if (data.role !== role) {
          setAuth("forbidden");
          return;
        }
        setAuth("ready");
        const url =
          role === "admin"
            ? "/api/v1/admin/overview"
            : `/api/v1/${role}-applications/status`;
        fetch(url, { credentials: "include", cache: "no-store" })
          .then(async (r) => (r.ok ? r.json() : null))
          .then((v) => {
            if (live && v) setOverview(v);
          })
          .catch(() => undefined);
      })
      .catch(() => {
        if (live) setAuth("unavailable");
      });
    return () => {
      live = false;
    };
  }, [role]);

  async function choose(id: string, url: string) {
    setSelected(id);
    setRecords(null);
    setMessage("");
    if (url === "/explore" || url === "/forecasts" || url === "/investo")
      return;
    if (!url) return;
    setLoading(true);
    try {
      if (id === "messages") {
        const [conversationResponse, connectionResponse] = await Promise.all([
          fetch("/api/v1/conversations", {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/v1/connections", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);
        const [conversationData, connectionData] = await Promise.all([
          conversationResponse.json(),
          connectionResponse.json(),
        ]);
        if (!conversationResponse.ok || !connectionResponse.ok)
          throw new Error(
            conversationData.message ||
              connectionData.message ||
              "Conversation data is unavailable.",
          );
        setConversations(
          Array.isArray(conversationData.items) ? conversationData.items : [],
        );
        setConnections(
          Array.isArray(connectionData.items)
            ? connectionData.items.map((item: { user: Peer }) => item.user)
            : [],
        );
        setRecords(conversationData);
        return;
      }
      const response = await fetch(url, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          data.message || `This service is unavailable (${response.status}).`,
        );
      if (id === "meetings") {
        const connectionResponse = await fetch("/api/v1/connections", {
          credentials: "include",
          cache: "no-store",
        });
        const connectionData = await connectionResponse
          .json()
          .catch(() => ({}));
        if (connectionResponse.ok)
          setConnections(
            Array.isArray(connectionData.items)
              ? connectionData.items.map((item: { user: Peer }) => item.user)
              : [],
          );
      }
      setRecords(data);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The requested data is unavailable; no status is assumed.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages() {
    const response = await fetch("/api/v1/conversations", {
      credentials: "include",
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(data.message || "Could not refresh conversations.");
    setConversations(Array.isArray(data.items) ? data.items : []);
  }
  async function openConversation(id: string) {
    try {
      const csrf = await csrfHeaders();
      const read = await fetch(`/api/v1/conversations/${id}/read`, {
        method: "POST",
        credentials: "include",
        headers: csrf,
      });
      const readData = await read.json().catch(() => ({}));
      if (!read.ok)
        throw new Error(
          readData.message || "This conversation is unavailable.",
        );
      const response = await fetch(`/api/v1/conversations/${id}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.message || "This conversation is unavailable.");
      setActiveThread(data);
      await loadMessages();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not open conversation.",
      );
    }
  }
  async function createConversation() {
    if (!newPeerId) return;
    try {
      const csrf = await csrfHeaders();
      const response = await fetch("/api/v1/conversations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrf },
        body: JSON.stringify({ otherUserId: newPeerId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.message || "Conversation could not be started.");
      setNewPeerId("");
      await loadMessages();
      await openConversation(data.id);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Conversation could not be started.",
      );
    }
  }
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeThread || !messageDraft.trim()) return;
    setSendingMessage(true);
    try {
      const csrf = await csrfHeaders();
      const response = await fetch(
        `/api/v1/conversations/${activeThread.id}/messages`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", ...csrf },
          body: JSON.stringify({ body: messageDraft.trim() }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.message || "Message was not accepted.");
      setMessageDraft("");
      await openConversation(activeThread.id);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Message was not sent.",
      );
    } finally {
      setSendingMessage(false);
    }
  }
  async function createMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!meetingDraft.otherUserId) return;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const ok = await mutate(
      "/api/v1/meetings",
      "POST",
      {
        otherUserId: meetingDraft.otherUserId,
        title: meetingDraft.title,
        startsAt: new Date(meetingDraft.startsAt).toISOString(),
        endsAt: new Date(meetingDraft.endsAt).toISOString(),
        timezone,
      },
      `meeting:new:${Date.now()}`,
    );
    if (ok) {
      setMeetingDraft({ otherUserId: "", title: "", startsAt: "", endsAt: "" });
      await choose("meetings", endpointFor("meetings"));
    }
  }
  async function respondToMeeting(
    id: string,
    status: "ACCEPTED" | "DECLINED" | "CANCELLED",
  ) {
    const ok = await mutate(
      `/api/v1/meetings/${id}/respond`,
      "PATCH",
      { status },
      `meeting:${id}:${status}`,
    );
    if (ok) await choose("meetings", endpointFor("meetings"));
  }
  async function rescheduleMeeting(e: React.FormEvent, id: string) {
    e.preventDefault();
    const draft = rescheduleDrafts[id];
    if (!draft) return;
    const ok = await mutate(
      `/api/v1/meetings/${id}/reschedule`,
      "PATCH",
      {
        startsAt: new Date(draft.startsAt).toISOString(),
        endsAt: new Date(draft.endsAt).toISOString(),
        timezone: draft.timezone,
      },
      `meeting:${id}:reschedule`,
    );
    if (ok) await choose("meetings", endpointFor("meetings"));
  }
  async function markNoticeRead(id: string) {
    const ok = await mutate(
      `/api/v1/notifications/${id}/read`,
      "PATCH",
      {},
      `notification:${id}`,
    );
    if (ok) await choose("notifications", endpointFor("notifications"));
  }
  async function mutate(
    url: string,
    method: "POST" | "PATCH",
    body: Record<string, unknown>,
    key: string,
  ): Promise<boolean> {
    setMessage("");
    try {
      const csrf = await csrfHeaders();
      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrf },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          data.message ||
            `The server did not accept this action (${response.status}).`,
        );
      setActed((current) => ({ ...current, [key]: true }));
      setMessage(
        data.note ||
          "The server confirmed the action and recorded its audit event.",
      );
      return true;
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The action could not be confirmed.",
      );
      return false;
    }
  }

  async function openDocument(id: string) {
    try {
      const response = await fetch(`/api/v1/documents/${id}/open`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url)
        throw new Error(data.message || "The document could not be opened.");
      window.location.assign(data.url);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The document could not be opened.",
      );
    }
  }

  async function signOut() {
    try {
      const csrf = await csrfHeaders();
      const response = await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: csrf,
      });
      if (!response.ok) throw new Error("The server did not confirm logout.");
      window.location.href = "/";
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not complete logout.",
      );
    }
  }

  const payload = (
    records && typeof records === "object" ? records : {}
  ) as Record<string, unknown>;
  const apps = Array.isArray(payload.applications)
    ? (payload.applications as AppRow[])
    : [];
  const docs = Array.isArray(payload.documents)
    ? (payload.documents as DocRow[])
    : [];
  const users = Array.isArray(payload.users)
    ? (payload.users as UserRow[])
    : [];
  const startups = Array.isArray(payload.items)
    ? (payload.items as StartupRow[])
    : [];
  const meetings = Array.isArray(payload.items)
    ? (payload.items as MeetingRow[])
    : [];
  const notifications = Array.isArray(payload.items)
    ? (payload.items as NoticeRow[])
    : [];
  const financialRecords = Array.isArray(payload.items)
    ? (payload.items as FinancialRow[])
    : [];
  const title = headings[selected] || "Workspace";
  const status = String(overview?.status || "Loading server status…");
  const isLink = (url: string) =>
    url === "/explore" || url === "/forecasts" || url === "/investo";

  if (auth !== "ready")
    return (
      <div className="min-h-[70vh] bg-[#f7f8fa] py-16">
        <div className="container max-w-[620px] rounded-xl border border-line bg-white p-8">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#eef3ff] text-cobalt">
            <LockKeyhole size={18} />
          </span>
          <h1 className="mt-5 text-2xl font-semibold">
            {auth === "loading"
              ? "Checking account access…"
              : auth === "signed-out"
                ? "Sign in to open this workspace"
                : auth === "forbidden"
                  ? "This workspace is not available to this account"
                  : "Account service unavailable"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Role access comes from the server-side account record.
          </p>
          {auth !== "loading" && (
            <Link className="btn btn-primary mt-6" href="/sign-in">
              Sign in <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </div>
    );

  return (
    <div className="min-h-[78vh] bg-[#f7f8fa] py-7 sm:py-10">
      <div className="container">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">
              {role === "admin"
                ? "Platform administration"
                : `${role} workspace`}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-.03em]">
              {user?.email}
            </h1>
          </div>
          <div className="flex gap-2">
            <Link href="/investo" className="btn btn-secondary !min-h-10">
              <Sparkles size={14} /> Ask INVESTO
            </Link>
            <button
              onClick={() => void signOut()}
              className="btn btn-secondary !min-h-10"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="h-fit rounded-xl border border-line bg-white p-3">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#8a94a3]">
              Workspace
            </div>
            <nav
              className="grid gap-1"
              aria-label={`${role} workspace navigation`}
            >
              {items.map(([caption, id, Icon, url]) =>
                isLink(url) ? (
                  <Link
                    key={id}
                    href={url}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium ${selected === id ? "bg-[#eef3ff] text-cobalt" : "text-[#5f6b7e] hover:bg-canvas"}`}
                  >
                    <Icon size={15} />
                    {caption}
                  </Link>
                ) : (
                  <button
                    key={id}
                    onClick={() => void choose(id, url)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-medium ${selected === id ? "bg-[#eef3ff] text-cobalt" : "text-[#5f6b7e] hover:bg-canvas"}`}
                  >
                    <Icon size={15} />
                    {caption}
                  </button>
                ),
              )}
            </nav>
            <div className="mt-3 border-t border-line px-3 pt-3 text-[10px] leading-4 text-[#8792a2]">
              Protected workspace. API access is checked on every request.
            </div>
          </aside>
          <section className="min-h-[520px] rounded-xl border border-line bg-white p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-1 text-xs text-muted">
                  {role === "admin"
                    ? "Administrative data and decisions are server-authorized and audited."
                    : "Private records appear only after the API confirms access."}
                </p>
              </div>
              {role !== "admin" && (
                <span className="pill">
                  <ShieldCheck size={12} /> Role-checked session
                </span>
              )}
            </div>
            {selected === "overview" && role === "admin" ? (
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["Accounts", "users"],
                    ["Applications awaiting review", "pendingApplications"],
                    ["Documents awaiting review", "pendingDocuments"],
                    ["Approved public startups", "approvedStartups"],
                  ] as const
                ).map(([caption, key]) => {
                  const counts = (overview?.counts || {}) as Record<
                    string,
                    unknown
                  >;
                  const value = counts[key];
                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-line bg-[#fbfcfe] p-5"
                    >
                      <p className="text-xs font-semibold text-[#687488]">
                        {caption}
                      </p>
                      <p className="mt-3 text-2xl font-semibold">
                        {typeof value === "number" ? value : "—"}
                      </p>
                    </div>
                  );
                })}
                <p className="rounded-xl border border-line bg-[#fbfcfe] p-5 text-xs leading-5 text-muted sm:col-span-2">
                  Review notes are recorded. Applicants cannot approve their own
                  applications. Public publishing additionally requires founder
                  consent and a separate public summary.
                </p>
              </div>
            ) : selected === "overview" ? (
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <article className="rounded-xl border border-line bg-[#fbfcfe] p-5">
                  <p className="text-xs font-semibold text-[#687488]">
                    Application state
                  </p>
                  <p className="mt-3 text-lg font-semibold">{status}</p>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    {typeof overview?.reviewNote === "string"
                      ? overview.reviewNote
                      : "Application state comes from the server; no status is inferred."}
                  </p>
                  {["NOT_STARTED", "DRAFT", "NEEDS_INFO", "REJECTED"].includes(
                    status,
                  ) && (
                    <Link
                      href={`/onboarding/${role}/1`}
                      className="btn btn-secondary mt-4 !min-h-9 !text-xs"
                    >
                      {status === "NEEDS_INFO"
                        ? "Continue requested updates"
                        : "Open onboarding"}
                      <ArrowRight size={13} />
                    </Link>
                  )}
                </article>
                <article className="rounded-xl border border-line bg-[#fbfcfe] p-5">
                  <p className="text-xs font-semibold text-[#687488]">
                    Next conversation
                  </p>
                  <p className="mt-3 text-sm font-medium">
                    Discovery is open to everyone.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Sensitive documents and forecasts require explicit sharing.
                  </p>
                  <Link
                    href="/explore"
                    className="btn btn-secondary mt-4 !min-h-9 !text-xs"
                  >
                    Explore startups
                    <ArrowRight size={13} />
                  </Link>
                </article>
                <article className="rounded-xl border border-line bg-[#fbfcfe] p-5 sm:col-span-2">
                  <p className="text-xs font-semibold text-[#687488]">
                    Financial scenarios
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    Editable, assumption-driven forecasts are informational and
                    never a guaranteed outcome.
                  </p>
                  <Link
                    href="/forecasts"
                    className="btn btn-secondary mt-4 !min-h-9 !text-xs"
                  >
                    Open forecast workspace
                    <ArrowRight size={13} />
                  </Link>
                </article>
              </div>
            ) : loading ? (
              <div className="mt-8 animate-pulse rounded-lg bg-[#f2f4f7] p-9 text-center text-sm text-muted">
                Loading {title.toLowerCase()}…
              </div>
            ) : message ? (
              <div
                role="status"
                className="mt-7 rounded-xl border border-[#eadfce] bg-[#fbf8f1] p-5"
              >
                <p className="text-sm font-semibold text-[#6e6648]">
                  Action or data unavailable
                </p>
                <p className="mt-2 text-xs leading-5 text-[#786f56]">
                  {message}
                </p>
              </div>
            ) : role === "admin" && selected === "applications" && records ? (
              <div className="mt-7 grid gap-4">
                {apps.map((row) => (
                  <article
                    key={`${row.role}:${row.id}`}
                    className="rounded-xl border border-line bg-[#fbfcfe] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">
                          {row.applicant?.name || "Applicant"}
                          <span className="pill ml-2">{row.role}</span>
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {row.applicant?.email} · {row.status}
                        </p>
                        {row.reviewNote && (
                          <p className="mt-2 text-xs text-[#8b642d]">
                            Previous review: {row.reviewNote}
                          </p>
                        )}
                      </div>
                      <details>
                        <summary className="cursor-pointer text-xs text-cobalt">
                          Private application record
                        </summary>
                        <pre className="mt-2 max-h-56 max-w-xl overflow-auto whitespace-pre-wrap break-words text-[10px]">
                          {JSON.stringify(row.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                    <label className="mt-3 block text-xs">
                      Reviewer note
                      <input
                        value={notes[`app:${row.id}`] || ""}
                        onChange={(e) =>
                          setNotes((v) => ({
                            ...v,
                            [`app:${row.id}`]: e.target.value,
                          }))
                        }
                        className="mt-1 min-h-10 w-full rounded-lg border border-line bg-white px-3"
                        placeholder="Required for information requests or rejection"
                      />
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(
                        [
                          ["approve", "Approve"],
                          ["request_info", "Request information"],
                          ["reject", "Reject"],
                        ] as const
                      ).map(([action, caption]) => (
                        <button
                          key={action}
                          disabled={acted[`app:${row.id}`]}
                          onClick={() =>
                            void mutate(
                              `/api/v1/admin/applications/${row.role}/${row.id}/decision`,
                              "POST",
                              {
                                role: row.role,
                                decision: action,
                                note: notes[`app:${row.id}`] || "",
                              },
                              `app:${row.id}`,
                            )
                          }
                          className="btn btn-secondary !min-h-9 !text-xs disabled:opacity-50"
                        >
                          {caption}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
                {apps.length === 0 && (
                  <p className="rounded-lg bg-canvas p-5 text-sm text-muted">
                    No applications match the current server query.
                  </p>
                )}
              </div>
            ) : role === "admin" && selected === "documents" && records ? (
              <div className="mt-7 grid gap-4">
                {docs.map((doc) => (
                  <article
                    key={doc.id}
                    className="rounded-xl border border-line bg-[#fbfcfe] p-4"
                  >
                    <p className="text-sm font-semibold">{doc.fileName}</p>
                    <p className="mt-1 text-xs text-muted">
                      {doc.owner?.name} · {doc.owner?.email} ·{" "}
                      {doc.documentType} · {Math.ceil(doc.fileSize / 1024)} KB ·{" "}
                      {doc.status}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => void openDocument(doc.id)}
                        className="btn btn-secondary !min-h-9 !text-xs"
                      >
                        Open securely
                      </button>
                      <input
                        value={notes[`doc:${doc.id}`] || ""}
                        onChange={(e) =>
                          setNotes((v) => ({
                            ...v,
                            [`doc:${doc.id}`]: e.target.value,
                          }))
                        }
                        className="min-h-9 min-w-40 flex-1 rounded-lg border border-line bg-white px-3 text-xs"
                        placeholder="Rejection reason (required)"
                      />
                      <button
                        disabled={acted[`doc:${doc.id}`]}
                        onClick={() =>
                          void mutate(
                            `/api/v1/admin/documents/${doc.id}/review`,
                            "POST",
                            {
                              decision: "approve",
                              note: notes[`doc:${doc.id}`] || "",
                            },
                            `doc:${doc.id}`,
                          )
                        }
                        className="btn btn-secondary !min-h-9 !text-xs"
                      >
                        Approve
                      </button>
                      <button
                        disabled={acted[`doc:${doc.id}`]}
                        onClick={() =>
                          void mutate(
                            `/api/v1/admin/documents/${doc.id}/review`,
                            "POST",
                            {
                              decision: "reject",
                              note: notes[`doc:${doc.id}`] || "",
                            },
                            `doc:${doc.id}`,
                          )
                        }
                        className="btn btn-secondary !min-h-9 !text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : role === "admin" && selected === "users" && records ? (
              <div className="mt-7 grid gap-3">
                {users.map((target) => (
                  <article
                    key={target.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-[#fbfcfe] p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {target.name}
                        <span className="pill ml-2">{target.role}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {target.email} ·{" "}
                        {target.emailVerified ? "verified" : "unverified"} ·{" "}
                        {target.disabledAt ? "suspended" : "active"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        aria-label={`Reason for status change for ${target.email}`}
                        value={notes[`user:${target.id}`] || ""}
                        onChange={(e) =>
                          setNotes((v) => ({
                            ...v,
                            [`user:${target.id}`]: e.target.value,
                          }))
                        }
                        className="min-h-9 rounded-lg border border-line bg-white px-3 text-xs"
                        placeholder="Reason (required)"
                      />
                      <button
                        disabled={acted[`user:${target.id}`]}
                        onClick={() =>
                          void mutate(
                            `/api/v1/admin/users/${target.id}/status`,
                            "PATCH",
                            {
                              disabled: !target.disabledAt,
                              reason: notes[`user:${target.id}`] || "",
                            },
                            `user:${target.id}`,
                          )
                        }
                        className="btn btn-secondary !min-h-9 !text-xs"
                      >
                        {target.disabledAt ? "Reactivate" : "Suspend"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : role === "admin" && selected === "listings" && records ? (
              <div className="mt-7 grid gap-3">
                {startups.map((startup) => (
                  <article
                    key={startup.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-[#fbfcfe] p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold">{startup.name}</p>
                      <p className="mt-1 text-xs text-muted">
                        {startup.founder?.name || "Founder unavailable"} ·{" "}
                        {startup.publicApproved
                          ? "publicly approved"
                          : "private"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        aria-label={`Reason for publication decision for ${startup.name}`}
                        value={notes[`startup:${startup.id}`] || ""}
                        onChange={(e) =>
                          setNotes((v) => ({
                            ...v,
                            [`startup:${startup.id}`]: e.target.value,
                          }))
                        }
                        className="min-h-9 rounded-lg border border-line bg-white px-3 text-xs"
                        placeholder="Reason (required)"
                      />
                      <button
                        disabled={acted[`startup:${startup.id}`]}
                        onClick={() =>
                          void mutate(
                            `/api/v1/admin/startups/${startup.id}/public`,
                            "PATCH",
                            {
                              publicApproved: !startup.publicApproved,
                              reason: notes[`startup:${startup.id}`] || "",
                            },
                            `startup:${startup.id}`,
                          )
                        }
                        className="btn btn-secondary !min-h-9 !text-xs"
                      >
                        {startup.publicApproved
                          ? "Unpublish"
                          : "Approve publication"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : records ? (
              role === "founder" && selected === "financials" && records ? (
                <FinancialRecordsPanel
                  initialItems={financialRecords}
                  initialMessage={
                    typeof payload.message === "string"
                      ? payload.message
                      : undefined
                  }
                  onSaved={() =>
                    choose("financials", endpointFor("financials"))
                  }
                />
              ) : selected === "messages" && records ? (
                <div className="mt-7 grid min-h-[440px] gap-4 lg:grid-cols-[270px_minmax(0,1fr)]">
                  <aside className="rounded-xl border border-line bg-[#fbfcfe] p-3">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void createConversation();
                      }}
                      className="border-b border-line pb-3"
                    >
                      <label className="text-[10px] font-semibold text-muted">
                        Start with a connected person
                      </label>
                      <select
                        value={newPeerId}
                        onChange={(e) => setNewPeerId(e.target.value)}
                        className="mt-1 h-9 w-full rounded-lg border border-line bg-white px-2 text-xs"
                      >
                        <option value="">Choose connection…</option>
                        {connections.map((peer) => (
                          <option key={peer.id} value={peer.id}>
                            {peer.name} · {peer.email}
                          </option>
                        ))}
                      </select>
                      <button
                        disabled={!newPeerId}
                        className="btn btn-secondary mt-2 !min-h-8 w-full !text-[10px] disabled:opacity-50"
                      >
                        <Plus size={13} />
                        Start conversation
                      </button>
                    </form>
                    <p className="px-1 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[.1em] text-[#7b8595]">
                      Conversations
                    </p>
                    <div className="grid gap-1">
                      {conversations.map((thread) => {
                        const peer = thread.participants.find(
                          (person) => person.id !== user?.id,
                        );
                        return (
                          <button
                            key={thread.id}
                            onClick={() => void openConversation(thread.id)}
                            className={`rounded-lg p-2.5 text-left ${activeThread?.id === thread.id ? "bg-[#eef3ff]" : "hover:bg-white"}`}
                          >
                            <span className="flex items-center justify-between gap-2 text-xs font-semibold">
                              <span className="truncate">
                                {peer?.name || peer?.email || "Connection"}
                              </span>
                              {thread.unreadCount > 0 && (
                                <span className="rounded-full bg-cobalt px-1.5 py-0.5 text-[9px] text-white">
                                  {thread.unreadCount}
                                </span>
                              )}
                            </span>
                            <span className="mt-1 block truncate text-[10px] text-muted">
                              {thread.lastMessage?.body || "No messages yet"}
                            </span>
                          </button>
                        );
                      })}
                      {conversations.length === 0 && (
                        <p className="p-2 text-xs leading-5 text-muted">
                          No conversations yet. Start one with an accepted
                          connection.
                        </p>
                      )}
                    </div>
                  </aside>
                  <div className="flex min-h-[440px] flex-col rounded-xl border border-line bg-white">
                    {activeThread ? (
                      <>
                        <div className="border-b border-line p-3">
                          <p className="text-sm font-semibold">
                            {activeThread.participants.find(
                              (person) => person.id !== user?.id,
                            )?.name || "Connection"}
                          </p>
                          <p className="mt-1 text-[10px] text-muted">
                            Messaging requires an accepted connection. Every
                            request is checked by the server.
                          </p>
                        </div>
                        <div className="flex-1 space-y-3 overflow-y-auto p-4">
                          {activeThread.messages.map((item) => (
                            <div
                              key={item.id}
                              className={`max-w-[85%] rounded-xl p-3 text-xs leading-5 ${item.senderId === user?.id ? "ml-auto bg-[#eef3ff] text-ink" : "mr-auto bg-[#f4f5f7] text-[#47546a]"}`}
                            >
                              <p>{item.body}</p>
                              <p className="mt-1 text-[9px] text-[#8490a1]">
                                {new Date(item.createdAt).toLocaleString()}
                                {item.senderId === user?.id && item.readAt
                                  ? " · Read"
                                  : ""}
                              </p>
                            </div>
                          ))}
                          {activeThread.messages.length === 0 && (
                            <p className="py-10 text-center text-xs text-muted">
                              Start the conversation with a clear, respectful
                              note.
                            </p>
                          )}
                        </div>
                        <form
                          onSubmit={(e) => void sendMessage(e)}
                          className="flex gap-2 border-t border-line p-3"
                        >
                          <input
                            maxLength={4000}
                            required
                            value={messageDraft}
                            onChange={(e) => setMessageDraft(e.target.value)}
                            className="min-w-0 flex-1 rounded-lg border border-line px-3 text-xs"
                            placeholder="Write a message…"
                          />
                          <button
                            disabled={sendingMessage || !messageDraft.trim()}
                            className="btn btn-primary !min-h-9 !px-3 disabled:opacity-50"
                          >
                            {sendingMessage ? (
                              "Sending…"
                            ) : (
                              <>
                                <Send size={14} />
                                Send
                              </>
                            )}
                          </button>
                        </form>
                      </>
                    ) : (
                      <div className="grid flex-1 place-items-center p-8 text-center text-xs text-muted">
                        Select a conversation or start one with an accepted
                        connection.
                      </div>
                    )}
                  </div>
                </div>
              ) : selected === "meetings" && records ? (
                <div className="mt-7 grid gap-4">
                  <form
                    onSubmit={(e) => void createMeeting(e)}
                    className="grid gap-3 rounded-xl border border-line bg-[#fbfcfe] p-4 sm:grid-cols-2"
                  >
                    <div className="sm:col-span-2">
                      <h3 className="text-sm font-semibold">
                        Request a meeting
                      </h3>
                      <p className="mt-1 text-xs text-muted">
                        Requests are limited to accepted connections and include
                        the selected IANA time zone.
                      </p>
                    </div>
                    <select
                      required
                      value={meetingDraft.otherUserId}
                      onChange={(e) =>
                        setMeetingDraft((v) => ({
                          ...v,
                          otherUserId: e.target.value,
                        }))
                      }
                      className="h-10 rounded-lg border border-line bg-white px-3 text-xs"
                    >
                      <option value="">Choose connected person…</option>
                      {connections.map((peer) => (
                        <option key={peer.id} value={peer.id}>
                          {peer.name} · {peer.email}
                        </option>
                      ))}
                    </select>
                    <input
                      required
                      maxLength={160}
                      value={meetingDraft.title}
                      onChange={(e) =>
                        setMeetingDraft((v) => ({
                          ...v,
                          title: e.target.value,
                        }))
                      }
                      className="h-10 rounded-lg border border-line bg-white px-3 text-xs"
                      placeholder="Meeting title"
                    />
                    <label className="text-[10px] text-muted">
                      Starts
                      <input
                        required
                        type="datetime-local"
                        value={meetingDraft.startsAt}
                        onChange={(e) =>
                          setMeetingDraft((v) => ({
                            ...v,
                            startsAt: e.target.value,
                          }))
                        }
                        className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3 text-xs"
                      />
                    </label>
                    <label className="text-[10px] text-muted">
                      Ends
                      <input
                        required
                        type="datetime-local"
                        value={meetingDraft.endsAt}
                        onChange={(e) =>
                          setMeetingDraft((v) => ({
                            ...v,
                            endsAt: e.target.value,
                          }))
                        }
                        className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3 text-xs"
                      />
                    </label>
                    <button className="btn btn-primary w-fit sm:col-span-2">
                      <CalendarClock size={14} />
                      Request meeting
                    </button>
                  </form>
                  {meetings.map((meeting) => {
                    const mine = meeting.members.find(
                      (member) => member.userId === user?.id,
                    );
                    const peer = meeting.members.find(
                      (member) => member.userId !== user?.id,
                    )?.user;
                    const active = !["CANCELLED", "DECLINED"].includes(
                      meeting.status,
                    );
                    return (
                      <article
                        key={meeting.id}
                        className="rounded-xl border border-line bg-white p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">
                              {meeting.title}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              With {peer?.name || peer?.email || "connection"} ·{" "}
                              {new Date(meeting.startsAt).toLocaleString(
                                undefined,
                                { timeZone: meeting.timezone },
                              )}{" "}
                              –{" "}
                              {new Date(meeting.endsAt).toLocaleTimeString(
                                undefined,
                                { timeZone: meeting.timezone },
                              )}{" "}
                              ({meeting.timezone})
                            </p>
                          </div>
                          <span className="pill">
                            {meeting.status} · {mine?.status || "member"}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {mine?.status === "INVITED" &&
                            meeting.status === "PROPOSED" && (
                              <>
                                <button
                                  onClick={() =>
                                    void respondToMeeting(
                                      meeting.id,
                                      "ACCEPTED",
                                    )
                                  }
                                  className="btn btn-secondary !min-h-9 !text-xs"
                                >
                                  <Check size={13} />
                                  Accept
                                </button>
                                <button
                                  onClick={() =>
                                    void respondToMeeting(
                                      meeting.id,
                                      "DECLINED",
                                    )
                                  }
                                  className="btn btn-secondary !min-h-9 !text-xs"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                          {active && (
                            <button
                              onClick={() =>
                                void respondToMeeting(meeting.id, "CANCELLED")
                              }
                              className="btn btn-quiet !min-h-9 !text-xs"
                            >
                              Cancel meeting
                            </button>
                          )}
                        </div>
                        {active && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-xs font-semibold text-cobalt">
                              Propose a new time
                            </summary>
                            <form
                              onSubmit={(e) =>
                                void rescheduleMeeting(e, meeting.id)
                              }
                              className="mt-3 grid gap-2 sm:grid-cols-3"
                            >
                              <input
                                required
                                type="datetime-local"
                                value={
                                  rescheduleDrafts[meeting.id]?.startsAt || ""
                                }
                                onChange={(e) =>
                                  setRescheduleDrafts((v) => ({
                                    ...v,
                                    [meeting.id]: {
                                      ...(v[meeting.id] || {
                                        startsAt: "",
                                        endsAt: "",
                                        timezone: meeting.timezone,
                                      }),
                                      startsAt: e.target.value,
                                    },
                                  }))
                                }
                                className="h-9 rounded-lg border border-line px-2 text-xs"
                              />
                              <input
                                required
                                type="datetime-local"
                                value={
                                  rescheduleDrafts[meeting.id]?.endsAt || ""
                                }
                                onChange={(e) =>
                                  setRescheduleDrafts((v) => ({
                                    ...v,
                                    [meeting.id]: {
                                      ...(v[meeting.id] || {
                                        startsAt: "",
                                        endsAt: "",
                                        timezone: meeting.timezone,
                                      }),
                                      endsAt: e.target.value,
                                    },
                                  }))
                                }
                                className="h-9 rounded-lg border border-line px-2 text-xs"
                              />
                              <input
                                required
                                value={
                                  rescheduleDrafts[meeting.id]?.timezone ||
                                  meeting.timezone
                                }
                                onChange={(e) =>
                                  setRescheduleDrafts((v) => ({
                                    ...v,
                                    [meeting.id]: {
                                      ...(v[meeting.id] || {
                                        startsAt: "",
                                        endsAt: "",
                                        timezone: meeting.timezone,
                                      }),
                                      timezone: e.target.value,
                                    },
                                  }))
                                }
                                aria-label="IANA time zone"
                                className="h-9 rounded-lg border border-line px-2 text-xs"
                              />
                              <button className="btn btn-secondary w-fit !min-h-9 !text-xs">
                                <Clock3 size={13} />
                                Propose new time
                              </button>
                            </form>
                          </details>
                        )}
                      </article>
                    );
                  })}
                  {meetings.length === 0 && (
                    <p className="rounded-lg border border-dashed border-line p-6 text-center text-xs text-muted">
                      No meeting requests or bookings yet.
                    </p>
                  )}
                </div>
              ) : selected === "notifications" && records ? (
                <div className="mt-7 grid gap-3">
                  {notifications.map((notification) => (
                    <article
                      key={notification.id}
                      className={`rounded-xl border p-4 ${notification.readAt ? "border-line bg-white" : "border-[#dce5fa] bg-[#f7f9ff]"}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold">
                            {notification.kind.replaceAll("_", " ")}
                          </p>
                          <p className="mt-1 text-[10px] text-muted">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-[#586579]">
                            {typeof notification.payload.preview === "string"
                              ? notification.payload.preview
                              : typeof notification.payload.title === "string"
                                ? notification.payload.title
                                : JSON.stringify(notification.payload)}
                          </p>
                        </div>
                        {!notification.readAt && (
                          <button
                            onClick={() => void markNoticeRead(notification.id)}
                            className="btn btn-secondary !min-h-8 !text-[10px]"
                          >
                            <Check size={12} />
                            Mark read
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                  {notifications.length === 0 && (
                    <p className="rounded-lg border border-dashed border-line p-6 text-center text-xs text-muted">
                      No notifications yet.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-7 rounded-xl border border-line bg-[#fbfcfe] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#7b8595]">
                    Confirmed API response
                  </p>
                  <pre className="mt-3 max-h-[430px] overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-[#566276]">
                    {JSON.stringify(records, null, 2)}
                  </pre>
                </div>
              )
            ) : (
              <div className="mt-8 rounded-xl border border-dashed border-[#dbe1eb] bg-[#fbfcfe] p-8 text-center">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#f0f4ff] text-[#4765b4]">
                  <CircleHelp size={17} />
                </span>
                <p className="mt-4 text-sm font-semibold">
                  No records to show yet
                </p>
                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted">
                  This section is connected to its protected API endpoint. An
                  empty state is not an approval, share, message, meeting, or
                  document status.
                </p>
                {selected === "investo" && (
                  <Link
                    href="/investo"
                    className="btn btn-primary mt-4 !min-h-9 !text-xs"
                  >
                    Open INVESTO
                    <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            )}
          </section>
        </div>
        <div className="mt-4 flex items-start gap-2 text-[10px] leading-5 text-[#8590a0]">
          <Bell size={13} className="mt-0.5 shrink-0" />
          Messages, read status, meetings and in-app notifications are stored in
          the configured database. Email notifications require a separately
          configured email provider.
        </div>
      </div>
    </div>
  );
}
