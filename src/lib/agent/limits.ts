import type { RunLimits } from "@/lib/supabase/types";

/**
 * Defaults sized against real observed behavior, not guesses. A first full
 * run at 60/40/10/90 completed with only 6/10 qualified: it hit the
 * max_candidates=60 wall after 3 discover_companies calls, but ~18% of its
 * scrapes (5 of 33) were wasted re-scraping companies that had already
 * resurfaced from an earlier batch — discover_companies wasn't deduplicating
 * against candidates it had already returned this run. That's now fixed
 * (discover_companies and scrape_website both dedupe against what's already
 * been seen), so the same 60-candidate budget should go further, but the
 * caps below are also raised for margin while that fix gets validated.
 *
 * max_candidates is cheap to raise: discover_companies always pays a flat
 * ~$0.27 per call for a 100-result batch regardless of how many candidates we
 * keep from it, so a higher cap mostly just means "keep more from the batch
 * you already paid for" rather than "pay more." max_scrapes is the real
 * per-unit cost driver (one Firecrawl call each) and is sized to actually
 * support a ~20-30% qualify rate reaching 10 qualified.
 */
export const DEFAULT_RUN_LIMITS: RunLimits = {
  max_candidates: 100,
  max_scrapes: 50,
  max_leads: 10,
  max_turns: 100,
};

// Hard ceilings a user-supplied override can never exceed, regardless of what
// the request body says — the PRD requires limits to be tool/run enforced,
// not agent- or client-decided.
const MAX_ALLOWED: RunLimits = {
  max_candidates: 150,
  max_scrapes: 70,
  max_leads: 10,
  max_turns: 130,
};

export function resolveRunLimits(overrides: Partial<RunLimits> | undefined): RunLimits {
  const merged = { ...DEFAULT_RUN_LIMITS, ...overrides };

  const clamp = (value: number, min: number, max: number) =>
    Number.isFinite(value) ? Math.min(Math.max(Math.round(value), min), max) : min;

  return {
    max_candidates: clamp(merged.max_candidates, 1, MAX_ALLOWED.max_candidates),
    max_scrapes: clamp(merged.max_scrapes, 1, MAX_ALLOWED.max_scrapes),
    max_leads: clamp(merged.max_leads, 1, MAX_ALLOWED.max_leads),
    max_turns: clamp(merged.max_turns, 1, MAX_ALLOWED.max_turns),
  };
}
