"use client";

import { useMemo, useState } from "react";
import { Check, Plus } from "lucide-react";
import { csrfHeaders } from "@/lib/csrf";

type FinancialRecord = {
  id: string;
  period: string;
  kind: string;
  amount: string;
  currency: string;
  createdAt: string;
};

const kinds: Array<[string, string]> = [
  ["REVENUE", "Revenue"],
  ["OPERATING_EXPENSE", "Operating expenses"],
  ["GROSS_PROFIT", "Gross profit"],
  ["NET_PROFIT", "Net profit / loss"],
  ["CASH_BALANCE", "Period-end cash balance"],
  ["CASH_INFLOW", "Additional cash inflows"],
  ["CASH_OUTFLOW", "Additional cash outflows"],
  ["CUSTOMER_COUNT", "Customer count"],
  ["ARPC", "Average revenue per customer (ARPC)"],
  ["CHURN", "Monthly churn (%)"],
  ["HIRING_COSTS", "Hiring costs"],
  ["MARKETING_COSTS", "Marketing costs"],
  ["FUNDING", "Funding received"],
];

export function FinancialRecordsPanel({
  initialItems,
  initialMessage,
  onSaved,
}: {
  initialItems: FinancialRecord[];
  initialMessage?: string;
  onSaved: () => void;
}) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [items, setItems] = useState(initialItems);
  const [period, setPeriod] = useState(currentMonth);
  const [kind, setKind] = useState("REVENUE");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const ordered = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          b.period.localeCompare(a.period) || a.kind.localeCompare(b.kind),
      ),
    [items],
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNote("");
    try {
      const csrf = await csrfHeaders();
      const response = await fetch("/api/v1/financial-records", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrf },
        body: JSON.stringify({
          period,
          kind,
          amount: Number(amount),
          currency: "USD",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          data.message || "The financial record was not accepted.",
        );
      setNote(
        "Saved to the authenticated founder's private startup history. Forecasts will read it as an owner-entered historical period.",
      );
      setAmount("");
      await onSaved();
      setItems((old) => {
        const filtered = old.filter(
          (row) => !(row.period === period && row.kind === kind),
        );
        return [...filtered, data.record as FinancialRecord];
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Financial history could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-7 grid gap-5">
      <form
        onSubmit={(e) => void save(e)}
        className="rounded-xl border border-line bg-[#fbfcfe] p-4"
      >
        <h3 className="text-sm font-semibold">Record a historical period</h3>
        <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">
          Entries are private to your founder account and startup. They are not
          verified accounting statements. Use USD (convert source values before
          entry). Operating expense is modeled separately from any
          hiring/marketing entries. One value per period and category is
          retained; saving the same period/category updates that entry.
        </p>
        {initialMessage && (
          <p className="mt-3 rounded-lg bg-white p-3 text-xs text-muted">
            {initialMessage}
          </p>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="field text-xs">
            Period
            <input
              type="month"
              required
              max={currentMonth}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </label>
          <label className="field text-xs">
            Record type
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              {kinds.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field text-xs">
            Amount
            <input
              type="number"
              required
              min={
                ["GROSS_PROFIT", "NET_PROFIT", "CASH_BALANCE"].includes(kind)
                  ? undefined
                  : "0"
              }
              max="1000000000000"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <div className="rounded-lg border border-line bg-white p-3 text-xs">
            <span className="font-medium">Currency</span>
            <p className="mt-1 text-muted">
              USD only, so periods remain comparable.
            </p>
          </div>
        </div>
        <button
          disabled={busy}
          className="btn btn-primary mt-4 disabled:opacity-50"
        >
          {busy ? (
            "Saving…"
          ) : (
            <>
              <Plus size={14} /> Save historical record
            </>
          )}
        </button>
        {error && (
          <p role="alert" className="mt-3 text-xs text-[#94423c]">
            {error}
          </p>
        )}
        {note && (
          <p
            role="status"
            className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#42654b]"
          >
            <Check size={14} className="mt-0.5 shrink-0" />
            {note}
          </p>
        )}
      </form>
      <section className="rounded-xl border border-line bg-white p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">Private financial history</h3>
          <span className="text-[10px] text-muted">
            {ordered.length} records
          </span>
        </div>
        {ordered.length ? (
          <div className="mt-3 max-h-[420px] overflow-auto rounded-lg border border-line">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="sticky top-0 bg-[#f5f7fb] text-[10px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="p-3">Period</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Value</th>
                  <th className="p-3">Currency / unit</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((item) => (
                  <tr
                    key={`${item.id}-${item.period}-${item.kind}`}
                    className="border-t border-line"
                  >
                    <td className="p-3 tabular-nums">{item.period}</td>
                    <td className="p-3">
                      {kinds.find(([value]) => value === item.kind)?.[1] ||
                        item.kind.replaceAll("_", " ")}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {Number(item.amount).toLocaleString()}
                    </td>
                    <td className="p-3">
                      {["CUSTOMER_COUNT", "CHURN"].includes(item.kind)
                        ? item.kind === "CHURN"
                          ? "%"
                          : "customers"
                        : item.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-line p-6 text-center text-xs text-muted">
            No historical records yet. Without history, forecasts use only the
            assumptions you enter.
          </p>
        )}
      </section>
    </div>
  );
}
