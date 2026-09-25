import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import type { RunLimits } from "@/lib/supabase/types";
import { createSaveRunIcpTool } from "./saveRunIcp";
import { createDiscoverCompaniesTool } from "./discoverCompanies";
import { createScrapeWebsiteTool } from "./scrapeWebsite";
import { createSaveLeadTool } from "./saveLead";

/**
 * All run-scoped state (discovered/scraped/qualified counts) lives here, in
 * memory, for the lifetime of a single agent run. This is safe because one
 * run corresponds to exactly one query() call in one process — there's no
 * concurrency across runs to coordinate.
 */
export function createLeadResearchServer(runId: string, limits: RunLimits) {
  let discoveredCount = 0;
  let scrapedCount = 0;
  const qualifiedDomains = new Set<string>();
  const seenDomains = new Set<string>();

  const saveRunIcp = createSaveRunIcpTool(runId);

  const discoverCompanies = createDiscoverCompaniesTool(
    runId,
    limits,
    () => discoveredCount,
    (n) => {
      discoveredCount += n;
    },
    seenDomains
  );

  const scrapedContentCache = new Map<string, string>();
  const scrapeWebsite = createScrapeWebsiteTool(
    runId,
    limits,
    () => scrapedCount,
    () => {
      scrapedCount += 1;
    },
    scrapedContentCache
  );

  const saveLead = createSaveLeadTool(
    runId,
    limits,
    () => qualifiedDomains.size,
    (domain) => qualifiedDomains.add(domain)
  );

  return createSdkMcpServer({
    name: "leadresearch",
    version: "1.0.0",
    tools: [saveRunIcp, discoverCompanies, scrapeWebsite, saveLead],
  });
}
