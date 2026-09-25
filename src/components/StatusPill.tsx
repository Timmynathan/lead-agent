"use client";

import { LoadingDots } from "./LoadingDots";

const STATUS_STYLES: Record<string, { label: string; text: string; bg: string; dot: string }> = {
  pending: { label: "Pending", text: "text-info", bg: "bg-info-subtle", dot: "bg-info" },
  running: { label: "Running", text: "text-info", bg: "bg-info-subtle", dot: "bg-info" },
  completed: { label: "Completed", text: "text-success", bg: "bg-success-subtle", dot: "bg-success" },
  failed: { label: "Failed", text: "text-danger", bg: "bg-danger-subtle", dot: "bg-danger" },
  success: { label: "Success", text: "text-success", bg: "bg-success-subtle", dot: "bg-success" },
  error: { label: "Error", text: "text-danger", bg: "bg-danger-subtle", dot: "bg-danger" },
  qualified: { label: "Qualified", text: "text-success", bg: "bg-success-subtle", dot: "bg-success" },
  not_qualified: { label: "Not qualified", text: "text-danger", bg: "bg-danger-subtle", dot: "bg-danger" },
  needs_review: { label: "Needs review", text: "text-warning", bg: "bg-warning-subtle", dot: "bg-warning" },
};

const LIVE_STATUSES = new Set(["pending", "running"]);

export function StatusPill({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? {
    label: status,
    text: "text-text-muted",
    bg: "bg-bg",
    dot: "bg-text-faint",
  };
  const isLive = LIVE_STATUSES.has(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {isLive && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${style.dot} opacity-75`}
          />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${style.dot}`} />
      </span>
      {style.label}
      {isLive && <LoadingDots />}
    </span>
  );
}
