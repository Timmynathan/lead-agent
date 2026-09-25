"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Globe2, RotateCw, Target, Wand2 } from "lucide-react";
import { StatusPill } from "@/components/StatusPill";
import type { RunRow } from "@/lib/supabase/types";

const EXAMPLE_OBJECTIVE =
  "Find 10 US B2B SaaS companies with 10 to 100 employees that may need AI automation support.";

type RunListItem = RunRow & { qualifiedCount: number };

export default function DashboardPage() {
  const router = useRouter();
  const [objective, setObjective] = useState("");
  const [maxCandidates, setMaxCandidates] = useState(100);
  const [maxScrapes, setMaxScrapes] = useState(50);
  const [maxLeads, setMaxLeads] = useState(10);
  const [maxTurns, setMaxTurns] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentRuns, setRecentRuns] = useState<RunListItem[] | null>(null);

  useEffect(() => {
    fetch("/api/runs")
      .then((r) => r.json())
      .then((data) => setRecentRuns(data.runs ?? []))
      .catch(() => setRecentRuns([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objective,
          limits: {
            max_candidates: maxCandidates,
            max_scrapes: maxScrapes,
            max_leads: maxLeads,
            max_turns: maxTurns,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }

      router.push(`/runs/${data.runId}`);
    } catch {
      setError("Could not reach the server.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text">New research run</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          Describe who you want to reach. The agent refines the ICP, discovers candidate
          companies, scrapes their public sites, qualifies them against your criteria, and drafts
          review-ready outreach — every step recorded for review. It never finds, validates, or
          sends anything.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 rounded-xl border border-border bg-surface p-6 shadow-xs"
      >
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="objective" className="text-sm font-medium text-text">
              Qualification objective
            </label>
            <button
              type="button"
              onClick={() => setObjective(EXAMPLE_OBJECTIVE)}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
            >
              <Wand2 size={13} strokeWidth={2.25} />
              Use example
            </button>
          </div>
          <textarea
            id="objective"
            rows={4}
            placeholder={EXAMPLE_OBJECTIVE}
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            required
            className="w-full resize-none rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary-subtle"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-text">Run limits</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <LimitField
              label="Candidates"
              icon={<Building2 size={14} />}
              value={maxCandidates}
              onChange={setMaxCandidates}
            />
            <LimitField
              label="Scrapes"
              icon={<Globe2 size={14} />}
              value={maxScrapes}
              onChange={setMaxScrapes}
            />
            <LimitField
              label="Leads"
              icon={<Target size={14} />}
              value={maxLeads}
              onChange={setMaxLeads}
            />
            <LimitField
              label="Turns"
              icon={<RotateCw size={14} />}
              value={maxTurns}
              onChange={setMaxTurns}
            />
          </div>
          <p className="mt-2 text-xs text-text-faint">
            Hard caps enforced by the agent&apos;s tools — not suggestions the agent can override.
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 self-start rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Starting run…" : "Start run"}
          {!submitting && <ArrowRight size={15} strokeWidth={2.25} />}
        </button>
      </form>

      <div>
        <p className="mb-3 text-sm font-medium text-text">Recent runs</p>
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
          {recentRuns === null && (
            <p className="px-5 py-6 text-sm text-text-muted">Loading…</p>
          )}
          {recentRuns?.length === 0 && (
            <p className="px-5 py-6 text-sm text-text-muted">
              No runs yet — start one above to see it here.
            </p>
          )}
          {recentRuns && recentRuns.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-text-faint">
                  <th className="px-5 py-2.5">Objective</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5">Leads</th>
                  <th className="px-5 py-2.5">Started</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((run) => (
                  <tr
                    key={run.id}
                    onClick={() => router.push(`/runs/${run.id}`)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-hover"
                  >
                    <td className="max-w-xs truncate px-5 py-3 text-text">{run.objective}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={run.status} />
                    </td>
                    <td className="px-5 py-3 text-text-muted">
                      {run.qualifiedCount}/{run.limits.max_leads}
                    </td>
                    <td className="px-5 py-3 text-text-muted">
                      {new Date(run.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function LimitField({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-text-muted">
        <span className="text-text-faint">{icon}</span>
        {label}
      </label>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary-subtle"
      />
    </div>
  );
}
