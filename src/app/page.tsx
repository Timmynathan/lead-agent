import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Ban,
  Building2,
  Compass,
  Eye,
  Globe2,
  ListChecks,
  Mail,
  MailX,
  PenLine,
  ShieldCheck,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden bg-surface">
      <Nav />
      <Hero />
      <PipelineSection />
      <FeatureIconRow />
      <SafetySection />
      <PrincipleSection />
      <FinalCta />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-brand">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink">
            <Image src="/logo.png" alt="" width={20} height={20} className="invert" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink">Scraping Bird</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-ink md:flex">
          <a href="#pipeline" className="hover:opacity-70">
            How it works
          </a>
          <a href="#safety" className="hover:opacity-70">
            Safety
          </a>
        </nav>

        <Link
          href="/dashboard"
          className="rounded-lg bg-ink px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-85"
        >
          Open dashboard
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="diagonal-cut-bottom relative bg-brand pb-28 pt-16 md:pb-40 md:pt-20">
      <Sparkle className="absolute right-[8%] top-16 hidden md:block" size={28} />
      <Sparkle className="absolute right-[20%] top-56 hidden md:block" size={16} />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-5 md:grid-cols-2 md:px-8">
        <div>
          <p className="mb-4 inline-flex items-center rounded-full border border-ink/15 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink">
            AI Lead Research Agent
          </p>
          <h1 className="text-[40px] font-extrabold leading-[1.05] tracking-tight text-ink md:text-[56px]">
            Find your next customers.
            <br />
            Pre-qualified, automatically.
          </h1>
          <p className="mt-5 max-w-md text-lg text-ink/80">
            Give it a qualification objective. Scraping Bird refines the ICP, discovers real
            companies, reads their websites, qualifies them against your criteria, and drafts
            review-ready outreach — with every step logged for you to check.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg bg-ink px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-85"
            >
              Start a research run
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
            <a
              href="#pipeline"
              className="rounded-lg border-2 border-ink bg-white px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-brand-50"
            >
              See how it works
            </a>
          </div>

          <p className="mt-5 flex items-center gap-2 text-sm font-medium text-ink/70">
            <ShieldCheck size={16} className="shrink-0" />
            It never finds, validates, or sends anything. Humans review every lead.
          </p>
        </div>

        <HeroLeadCard />
      </div>
    </section>
  );
}

function HeroLeadCard() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <Sparkle className="absolute -left-8 -top-6" size={22} />
      <div className="rounded-2xl border border-ink/10 bg-white p-1.5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-1.5 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
        </div>
        <div className="rounded-xl bg-bg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-text">Acme Cloud</p>
              <p className="text-xs text-text-faint">acmecloud.io</p>
            </div>
            <span className="rounded-full bg-success-subtle px-2.5 py-1 text-[11px] font-bold text-success">
              Qualified
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div className="h-full w-[78%] rounded-full bg-ink" />
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-text-faint">
            Fit reasons
          </p>
          <ul className="mt-1.5 space-y-1 text-xs text-text-muted">
            <li>• US-based, 42 employees, B2B SaaS</li>
            <li>• Hiring for RevOps, scaling onboarding</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Sparkle({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M12 0C12 6.5 13 11 12 12C11 11 12 6.5 12 0Z M12 24C12 17.5 11 13 12 12C13 13 12 17.5 12 24Z M0 12C6.5 12 11 11 12 12C11 13 6.5 12 0 12Z M24 12C17.5 12 13 13 12 12C13 11 17.5 12 24 12Z"
        fill="#0F0F0E"
      />
    </svg>
  );
}

function PipelineSection() {
  return (
    <section id="pipeline" className="bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 text-center md:px-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          We turn one objective into 10 qualified leads
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
          No manual list-building, no copy-pasting into a spreadsheet. Just a plain-English
          objective in, review-ready leads out.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border-2 border-brand-border bg-brand p-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch md:gap-4 md:p-6">
          <div className="overflow-hidden rounded-xl bg-ink text-left">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <span className="text-xs font-semibold text-white/70">Objective</span>
            </div>
            <pre className="whitespace-pre-wrap p-4 font-mono text-[13px] leading-relaxed text-white/90">
{`"Find 10 US B2B SaaS companies
with 10 to 100 employees that
may need AI automation support."`}
            </pre>
          </div>

          <div className="hidden items-center justify-center md:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white">
              <ArrowRight size={18} strokeWidth={2.5} />
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl bg-white text-left md:mt-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="text-xs font-semibold text-text-faint">Qualified lead</span>
            </div>
            <pre className="whitespace-pre-wrap p-4 font-mono text-[13px] leading-relaxed text-text">
{`{
  "company_name": "Acme Cloud",
  "qualification_status": "qualified",
  "confidence": 0.78,
  "fit_reasons": [
    "US-based, 42 employees",
    "B2B SaaS, hiring for RevOps"
  ]
}`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

const PIPELINE_STEPS = [
  { icon: Compass, label: "ICP refinement" },
  { icon: Building2, label: "Company discovery" },
  { icon: Globe2, label: "Website scraping" },
  { icon: ListChecks, label: "Lead qualification" },
  { icon: PenLine, label: "Outreach drafting" },
];

function FeatureIconRow() {
  return (
    <section className="bg-surface pb-20 md:pb-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-5">
          {PIPELINE_STEPS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand">
                <Icon size={24} strokeWidth={2.25} className="text-ink" />
              </span>
              <p className="text-sm font-semibold text-text">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const SAFETY_CARDS = [
  {
    icon: MailX,
    title: "No email discovery",
    description:
      "There is no tool that can find or validate a personal email address. That capability simply doesn't exist in this app.",
  },
  {
    icon: Ban,
    title: "No auto-send",
    description:
      "Nothing is ever sent — no emails, no LinkedIn messages. Every draft waits for a human to read it first.",
  },
  {
    icon: ListChecks,
    title: "Every tool call logged",
    description:
      "Company search, scraping, qualification, and copywriting are all recorded in Supabase with input, output, and status.",
  },
  {
    icon: Eye,
    title: "Untrusted web content, always",
    description:
      "Scraped site text is treated as data, never instructions. It can't change the objective, limits, or what the agent does.",
  },
];

function SafetySection() {
  return (
    <section id="safety" className="bg-brand py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <p className="text-xs font-bold uppercase tracking-wider text-ink/70">Safety by design</p>
        <h2 className="mt-3 max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-4xl">
          Built so nothing goes out without a human
        </h2>
        <p className="mt-4 max-w-xl text-lg text-ink/80">
          The agent researches and drafts. It does not have the tools to do anything else — the
          boundaries are enforced in code, not just prompted.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SAFETY_CARDS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-brand-border bg-brand-light p-6"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink">
                <Icon size={18} className="text-white" />
              </span>
              <p className="mt-4 text-base font-bold text-ink">{title}</p>
              <p className="mt-1.5 text-sm text-ink/75">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PrincipleSection() {
  return (
    <section className="bg-ink py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <p className="text-2xl font-bold leading-snug text-white md:text-4xl">
          &ldquo;This agent researches and drafts.{" "}
          <span className="text-brand">
            It never finds emails, validates them, or sends anything
          </span>{" "}
          — a human reviews every qualified lead before it leaves the app.&rdquo;
        </p>
        <p className="mt-6 text-sm font-semibold text-white/60">How Scraping Bird works</p>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-surface py-24 text-center md:py-32">
      <div className="mx-auto max-w-2xl px-5 md:px-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-ink md:text-5xl">
          Ready to find your next 10 customers?
        </h2>
        <p className="mt-4 text-lg text-text-muted">
          Describe your ICP, set your limits, and let Scraping Bird do the research.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-ink px-7 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-85"
        >
          Start a research run
          <ArrowRight size={16} strokeWidth={2.5} />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-ink py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 text-center md:flex-row md:justify-between md:text-left">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand">
            <Image src="/logo.png" alt="" width={16} height={16} />
          </span>
          <span className="text-sm font-bold text-white">Scraping Bird</span>
          <span className="ml-2 flex items-center gap-1 text-xs text-white/50">
            <Mail size={12} />
            Built for Koya Talent
          </span>
        </div>
        <Link href="/dashboard" className="text-sm font-semibold text-brand hover:underline">
          Open dashboard →
        </Link>
      </div>
    </footer>
  );
}
