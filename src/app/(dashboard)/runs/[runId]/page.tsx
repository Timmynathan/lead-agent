"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  Globe2,
  ListChecks,
  Loader2,
  Target,
  Wrench,
} from "lucide-react";
import { StatusPill } from "@/components/StatusPill";
import { LoadingDots } from "@/components/LoadingDots";
import type { LeadRow, RunRow, ToolCallRow } from "@/lib/supabase/types";

interface RunDetail {
  run: RunRow;
  leads: LeadRow[];
  toolCalls: ToolCallRow[];
}

const POLL_INTERVAL_MS = 4000;

export default function RunPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);
  const [detail, setDetail] = useState<RunDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/runs/${runId}`, { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setError(data.error ?? "Failed to load run.");
          return;
        }

        setError(null);
        setDetail(data);

        if (data.run.status === "pending" || data.run.status === "running") {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch {
        if (!cancelled) {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [runId]);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text"
      >
        <ArrowLeft size={15} strokeWidth={2.25} />
        New run
      </Link>

      {error && <p className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger">{error}</p>}
      {!detail && !error && <p className="text-sm text-text-muted">Loading run…</p>}

      {detail && (
        <div className="flex flex-col gap-6">
          <RunSummary run={detail.run} leadCount={detail.leads.length} />
          {(detail.run.status === "pending" || detail.run.status === "running") && (
            <LiveActivityBanner run={detail.run} toolCalls={detail.toolCalls} />
          )}
          <IcpCard icp={detail.run.refined_icp} />
          <LeadsSection leads={detail.leads} />
          <ToolCallsSection toolCalls={detail.toolCalls} />
        </div>
      )}
    </div>
  );
}

const TOOL_ACTION_LABELS: Record<string, string> = {
  save_run_icp: "Refining the ICP",
  discover_companies: "Searching for candidate companies",
  scrape_website: "Reading a company website",
  save_lead: "Saving a qualification decision",
};

function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)}m ago`;
}

function LiveActivityBanner({ run, toolCalls }: { run: RunRow; toolCalls: ToolCallRow[] }) {
  const lastCall = toolCalls[toolCalls.length - 1];
  const actionLabel = lastCall
    ? (TOOL_ACTION_LABELS[lastCall.tool_name] ?? lastCall.tool_name)
    : "Starting up";

  return (
    <div className="flex items-center gap-4 rounded-xl border border-brand-border bg-brand-light px-5 py-4">
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink">
        <Loader2 size={16} className="animate-spin text-white" strokeWidth={2.5} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center text-sm font-bold text-ink">
          {run.status === "pending" ? "Starting the run" : actionLabel}
          <LoadingDots />
        </p>
        <p className="text-xs text-ink/70">
          {lastCall
            ? `Last action: ${lastCall.tool_name} · ${timeAgo(lastCall.created_at)}`
            : "The agent will save its refined ICP first, then start discovery."}
        </p>
      </div>
      <div className="hidden shrink-0 items-center gap-4 text-right sm:flex">
        <div>
          <p className="text-lg font-bold text-ink">{toolCalls.length}</p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink/60">Tool calls</p>
        </div>
      </div>
    </div>
  );
}

function RunSummary({ run, leadCount }: { run: RunRow; leadCount: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 font-mono text-xs text-text-faint">{run.id}</p>
          <h1 className="text-lg font-semibold leading-snug text-text">{run.objective}</h1>
        </div>
        <StatusPill status={run.status} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={<Building2 size={15} />} label="Candidate cap" value={run.limits.max_candidates} />
        <StatTile icon={<Globe2 size={15} />} label="Scrape cap" value={run.limits.max_scrapes} />
        <StatTile icon={<Target size={15} />} label="Lead target" value={run.limits.max_leads} />
        <StatTile icon={<ListChecks size={15} />} label="Leads saved" value={leadCount} />
      </div>

      {run.status === "failed" && run.error_message && (
        <p className="mt-4 rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger">
          {run.error_message}
        </p>
      )}
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-bg px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-text-faint">
        {icon}
        <span className="text-xs font-medium text-text-muted">{label}</span>
      </div>
      <p className="mt-1.5 text-xl font-semibold text-text">{value}</p>
    </div>
  );
}

function IcpCard({ icp }: { icp: RunRow["refined_icp"] }) {
  return (
    <SectionCard title="Refined ICP">
      {!icp ? (
        <p className="text-sm text-text-muted">
          Not saved yet — the agent saves this before discovery begins.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Target company type" value={icp.target_company_type} />
          <Field label="Headcount range" value={icp.headcount_range} />
          <ChipField label="Industries" values={icp.industries} />
          <ChipField label="Geography" values={icp.geography} />
          <Field label="Buyer persona" value={icp.buyer_persona} />
          <Field label="Business problem" value={icp.business_problem} />
          <ChipField label="Hard filters" values={icp.hard_filters} tone="warning" />
          <ChipField label="Soft preferences" values={icp.soft_preferences} tone="info" />
          <ChipField label="Disqualifiers" values={icp.disqualifiers} tone="danger" />
        </div>
      )}
    </SectionCard>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-text-faint">{label}</p>
      <p className="text-sm text-text">{value || "—"}</p>
    </div>
  );
}

function ChipField({
  label,
  values,
  tone = "neutral",
}: {
  label: string;
  values: string[];
  tone?: "neutral" | "danger" | "warning" | "info";
}) {
  const toneClasses =
    tone === "danger"
      ? "bg-danger-subtle text-danger"
      : tone === "warning"
        ? "bg-warning-subtle text-warning"
        : tone === "info"
          ? "bg-info-subtle text-info"
          : "bg-bg text-text-muted";

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-text-faint">{label}</p>
      {values.length === 0 ? (
        <p className="text-sm text-text-faint">—</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span key={v} className={`rounded-md px-2 py-1 text-xs ${toneClasses}`}>
              {v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
      <h2 className="mb-4 text-sm font-semibold text-text">{title}</h2>
      {children}
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  // A vivid amber, not the muted --color-warning text tone — that one reads
  // too close to danger-red as a thin filled bar.
  const color = pct >= 70 ? "bg-success" : pct >= 40 ? "bg-amber-500" : "bg-danger";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-bg">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-text-muted">{pct}%</span>
    </div>
  );
}

function LeadsSection({ leads }: { leads: LeadRow[] }) {
  const qualified = leads.filter((l) => l.qualification_status === "qualified");
  const needsReview = leads.filter((l) => l.qualification_status === "needs_review");
  const notQualified = leads.filter((l) => l.qualification_status === "not_qualified");

  return (
    <SectionCard title={`Leads (${leads.length})`}>
      {leads.length === 0 ? (
        <p className="text-sm text-text-muted">No leads saved yet.</p>
      ) : (
        <div className="flex flex-col gap-6">
          <LeadGroup
            label="Qualified"
            description="The deliverable — ready for a human to review and send."
            tone="success"
            leads={qualified}
            emptyText="None yet."
          />
          {needsReview.length > 0 && (
            <LeadGroup
              label="Needs review"
              description="Evidence was incomplete or mixed — a human should look at these before deciding."
              tone="warning"
              leads={needsReview}
              collapsible
              defaultOpen
            />
          )}
          {notQualified.length > 0 && (
            <LeadGroup
              label="Not qualified"
              description="Audit trail only — evaluated and ruled out."
              tone="danger"
              leads={notQualified}
              collapsible
            />
          )}
        </div>
      )}
    </SectionCard>
  );
}

function LeadGroup({
  label,
  description,
  tone,
  leads,
  emptyText,
  collapsible = false,
  defaultOpen = false,
}: {
  label: string;
  description: string;
  tone: "success" | "warning" | "danger";
  leads: LeadRow[];
  emptyText?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const dotClass =
    tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-danger";

  const header = (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      <span className="text-sm font-bold text-text">
        {label} ({leads.length})
      </span>
      <span className="text-xs text-text-faint">— {description}</span>
    </div>
  );

  const body =
    leads.length === 0 ? (
      <p className="mt-2 text-sm text-text-faint">{emptyText}</p>
    ) : (
      <div className="mt-2 flex flex-col divide-y divide-border rounded-lg border border-border">
        {leads.map((lead) => (
          <LeadRowCard key={lead.id} lead={lead} />
        ))}
      </div>
    );

  if (!collapsible) {
    return (
      <div>
        {header}
        {body}
      </div>
    );
  }

  return (
    <details className="group" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
        {header}
        <ChevronDown
          size={14}
          className="ml-auto shrink-0 text-text-faint transition-transform group-open:rotate-180"
        />
      </summary>
      {body}
    </details>
  );
}

function LeadRowCard({ lead }: { lead: LeadRow }) {
  const initial = lead.company_name.charAt(0).toUpperCase();

  return (
    <details className="group px-3 py-3">
      <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text">{lead.company_name}</p>
          <p className="truncate text-xs text-text-faint">{lead.company_domain}</p>
        </div>
        <ConfidenceBar value={lead.confidence} />
        <StatusPill status={lead.qualification_status} />
        <ChevronDown
          size={16}
          className="shrink-0 text-text-faint transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="mt-3 grid grid-cols-1 gap-4 rounded-lg bg-bg p-4 sm:grid-cols-2">
        {lead.fit_reasons.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-text-faint">Fit reasons</p>
            <ul className="list-disc space-y-1 pl-4 text-sm text-text">
              {lead.fit_reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
        {lead.concerns.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-text-faint">Concerns</p>
            <ul className="list-disc space-y-1 pl-4 text-sm text-text-muted">
              {lead.concerns.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="sm:col-span-2">
          <p className="mb-1.5 text-xs font-medium text-text-faint">Source</p>
          <p className="text-sm text-text">{lead.source_summary}</p>
          {lead.source_urls.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {lead.source_urls.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lead.outreach_emails && (
          <div className="sm:col-span-2">
            <p className="mb-2 text-xs font-medium text-text-faint">Outreach sequence</p>
            <div className="flex flex-col gap-3">
              {lead.outreach_emails.map((step, i) => (
                <div key={i} className="rounded-lg border border-border bg-surface p-3">
                  <p className="text-xs font-semibold text-text">
                    Email {i + 1} — {step.subject}
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-text-muted">{step.body}</p>
                  <p className="mt-1.5 text-xs italic text-text-faint">{step.personalization_note}</p>
                </div>
              ))}
              {lead.linkedin_message && (
                <div className="rounded-lg border border-border bg-surface p-3">
                  <p className="text-xs font-semibold text-text">LinkedIn message</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-text-muted">
                    {lead.linkedin_message}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

function ToolCallsSection({ toolCalls }: { toolCalls: ToolCallRow[] }) {
  return (
    <SectionCard title={`Tool-call log (${toolCalls.length})`}>
      {toolCalls.length === 0 ? (
        <p className="text-sm text-text-muted">No tool calls recorded yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {toolCalls.map((call) => (
            <details key={call.id} className="group py-2.5 first:pt-0 last:pb-0">
              <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
                <Wrench size={14} className="shrink-0 text-text-faint" />
                <span className="font-mono text-xs text-text">{call.tool_name}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-text-faint">
                  {call.purpose}
                </span>
                <span className="shrink-0 text-xs text-text-faint">
                  {new Date(call.created_at).toLocaleTimeString()}
                </span>
                <StatusPill status={call.status} />
                <ChevronDown
                  size={14}
                  className="shrink-0 text-text-faint transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="mt-2 grid grid-cols-1 gap-3 rounded-lg bg-bg p-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-medium text-text-faint">Input</p>
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-surface p-2 font-mono text-[11px] leading-relaxed text-text-muted">
                    {call.input_summary}
                  </pre>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-text-faint">Result</p>
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-surface p-2 font-mono text-[11px] leading-relaxed text-text-muted">
                    {call.error_message ?? call.result_summary ?? "—"}
                  </pre>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
