import { z } from "zod";
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { getApifyClient, getOrganizationsActorId } from "@/lib/apify/client";
import { withLogging } from "@/lib/agent/withLogging";
import type { RunLimits } from "@/lib/supabase/types";

export const discoverCompaniesSchema = {
  industries: z
    .array(z.string())
    .describe("Industry/niche keywords from the refined ICP, e.g. ['B2B SaaS']"),
  locations: z
    .array(z.string())
    .describe("Geography filters from the refined ICP, e.g. ['United States']"),
  employee_min: z.number().int().min(0).describe("Minimum headcount from the refined ICP"),
  employee_max: z.number().int().min(0).describe("Maximum headcount from the refined ICP"),
  requested_count: z
    .number()
    .int()
    .min(1)
    .describe(
      "How many new candidates you want returned after filtering. The underlying search always " +
        "fetches a fixed batch regardless of this number, so prefer calling this tool once per " +
        "run rather than repeatedly with small counts."
    ),
};

type DiscoverCompaniesArgs = {
  industries: string[];
  locations: string[];
  employee_min: number;
  employee_max: number;
  requested_count: number;
};

export interface DiscoveredCompany {
  company_name: string;
  company_domain: string;
  employee_count_range: string | null;
  industry: string | null;
  location: string | null;
}

// Confirmed via a live test run against braveleads/company-organization-finder-apollo-linkedin:
// its `totalResults` input has a hard minimum of 100, billed per result, so every call costs
// roughly the same regardless of how few results we keep. We always request the minimum and do
// our own filtering/truncation in code afterward.
const ACTOR_BATCH_SIZE = 100;

type RawActorItem = {
  organizationName?: string;
  organizationWebsite?: string;
  organizationCountry?: string;
  organizationCity?: string;
  organizationState?: string;
  organizationSize?: string;
  organizationIndustry?: string;
  organizationIndustries?: string;
  organizationTags?: string;
};

function buildActorInput(args: DiscoverCompaniesArgs) {
  return {
    totalResults: ACTOR_BATCH_SIZE,
    companyCountry: args.locations,
    keywords: args.industries,
  };
}

function parseSizeRange(size: string | undefined): [number, number] | null {
  if (!size) return null;
  // Observed formats from this actor: "20 - 99", "10,001+", ">10000".
  const plus = size.match(/^>?\s*(\d[\d,]*)\s*\+?$/);
  if (plus && /[+>]/.test(size)) {
    return [Number(plus[1].replace(/,/g, "")), Infinity];
  }
  const range = size.match(/^(\d[\d,]*)\s*-\s*(\d[\d,]*)$/);
  if (range) {
    return [Number(range[1].replace(/,/g, "")), Number(range[2].replace(/,/g, ""))];
  }
  return null;
}

function rangesOverlap(a: [number, number], b: [number, number]) {
  return a[0] <= b[1] && a[1] >= b[0];
}

function normalizeActorItem(item: RawActorItem): DiscoveredCompany | null {
  if (!item.organizationName || !item.organizationWebsite) return null;

  let domain = item.organizationWebsite;
  try {
    domain = new URL(
      item.organizationWebsite.startsWith("http")
        ? item.organizationWebsite
        : `https://${item.organizationWebsite}`
    ).hostname.replace(/^www\./, "");
  } catch {
    // leave domain as-is if it doesn't parse as a URL
  }

  const location = [item.organizationCity, item.organizationState, item.organizationCountry]
    .filter(Boolean)
    .join(", ");

  return {
    company_name: item.organizationName,
    company_domain: domain,
    employee_count_range: item.organizationSize ?? null,
    industry: item.organizationIndustries ?? item.organizationIndustry ?? null,
    location: location || null,
  };
}

/**
 * The actor's own country/keyword filters are best-effort (confirmed via a live
 * test: a "United States" filter still returned a company headquartered in
 * China), so we re-apply the ICP's hard filters here in code using the
 * structured fields the actor does return. Companies with unparseable/missing
 * size or location data are kept rather than excluded — we can't verify them
 * from this data alone, so the lead-qualification skill decides from scraped
 * evidence downstream instead of us silently dropping them.
 */
function passesHardFilters(company: DiscoveredCompany, args: DiscoverCompaniesArgs): boolean {
  if (company.location) {
    const matchesLocation = args.locations.some((loc) =>
      company.location!.toLowerCase().includes(loc.toLowerCase())
    );
    if (!matchesLocation) return false;
  }

  const sizeRange = parseSizeRange(company.employee_count_range ?? undefined);
  if (sizeRange && !rangesOverlap(sizeRange, [args.employee_min, args.employee_max])) {
    return false;
  }

  return true;
}

export function createDiscoverCompaniesTool(
  runId: string,
  limits: RunLimits,
  getDiscoveredCount: () => number,
  incrementDiscoveredCount: (n: number) => void,
  seenDomains: Set<string>
) {
  const handler = async (args: DiscoverCompaniesArgs) => {
    const remaining = limits.max_candidates - getDiscoveredCount();
    if (remaining <= 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Candidate limit reached (${limits.max_candidates}). No further discovery calls are allowed this run.`,
          },
        ],
        isError: true,
      };
    }

    const cappedCount = Math.min(args.requested_count, remaining);

    const client = getApifyClient();
    const actorId = getOrganizationsActorId();
    const input = buildActorInput(args);

    const run = await client.actor(actorId).call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    const beforeDedup = items
      .map((item) => normalizeActorItem(item as RawActorItem))
      .filter((c): c is DiscoveredCompany => c !== null)
      .filter((c) => passesHardFilters(c, args));

    const companies = beforeDedup
      .filter((c) => !seenDomains.has(c.company_domain))
      .slice(0, cappedCount);

    companies.forEach((c) => seenDomains.add(c.company_domain));
    incrementDiscoveredCount(companies.length);

    const duplicateCount = beforeDedup.length - companies.length;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              companies,
              note:
                companies.length === 0
                  ? "No new candidates passed the ICP's filters in this batch — everything that matched was already discovered earlier. Try noticeably different industries/keywords rather than immediately re-running with the same ones — each call has a real cost."
                  : duplicateCount > 0
                    ? `${duplicateCount} result(s) from this batch were already discovered earlier and were skipped.`
                    : undefined,
            },
            null,
            2
          ),
        },
      ],
      structuredContent: { companies },
    };
  };

  return tool(
    "discover_companies",
    "Search for candidate companies via Apify using ICP-derived filters, then locally filters results against the ICP's location and headcount hard filters and against companies already discovered earlier this run. Each call fetches a fixed-cost batch (~100 raw results) regardless of requested_count, so calling it again for a fresh batch is fine and expected when your first batch didn't yield enough qualified leads — just never call it per-candidate. Vary keywords between calls, since identical filters mostly return the same companies you've already seen.",
    discoverCompaniesSchema,
    withLogging(runId, "discover_companies", "Search for candidate companies", handler),
    { annotations: { readOnlyHint: false, openWorldHint: true } }
  );
}
