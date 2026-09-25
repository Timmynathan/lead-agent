"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, ShieldCheck } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNewRun = pathname === "/dashboard";

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-5 md:flex">
        <Link href="/" className="flex items-center gap-2 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand p-1.5">
            <Image src="/logo.png" alt="" width={20} height={20} />
          </span>
          <span className="text-[15px] font-bold tracking-tight text-text">Scraping Bird</span>
        </Link>

        <nav className="mt-8 flex flex-col gap-1">
          <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-text-faint">
            Workspace
          </p>
          <Link
            href="/dashboard"
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
              isNewRun
                ? "bg-primary-subtle text-ink"
                : "text-text-muted hover:bg-surface-hover hover:text-text"
            }`}
          >
            <Plus size={16} strokeWidth={2.25} />
            New run
          </Link>
        </nav>

        <div className="mt-auto flex items-start gap-2 rounded-lg border border-border bg-bg px-3 py-3 text-xs text-text-muted">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-text-faint" />
          <span>Drafts only. No emails are found, validated, or sent by this agent.</span>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-5xl px-5 py-8 md:px-10">{children}</div>
      </main>
    </div>
  );
}
