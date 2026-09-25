import { z } from "zod";
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { withLogging } from "@/lib/agent/withLogging";
import type { RunLimits } from "@/lib/supabase/types";

const outreachEmailStepSchema = z.object({
  subject: z.string(),
  body: z.string(),
  personalization_note: z.string(),
});

export const saveLeadSchema = {
  company_name: z.string(),
  company_domain: z.string(),
  qualification_status: z.enum(["qualified", "not_qualified", "needs_review"]),
  confidence: z.number().min(0).max(1),
  fit_reasons: z.array(z.string()),
  concerns: z.array(z.string()),
  source_urls: z.array(z.string()),
  source_summary: z.string(),
  outreach_emails: z
    .array(outreachEmailStepSchema)
    .length(3)
    .optional()
    .describe("Required 3-step sequence when qualification_status is 'qualified'"),
  linkedin_message: z.string().optional().describe("Required when qualification_status is 'qualified'"),
};

type SaveLeadArgs = {
  company_name: string;
  company_domain: string;
  qualification_status: "qualified" | "not_qualified" | "needs_review";
  confidence: number;
  fit_reasons: string[];
  concerns: string[];
  source_urls: string[];
  source_summary: string;
  outreach_emails?: { subject: string; body: string; personalization_note: string }[];
  linkedin_message?: string;
};

export function createSaveLeadTool(
  runId: string,
  limits: RunLimits,
  getQualifiedCount: () => number,
  recordQualified: (domain: string) => void
) {
  const handler = async (args: SaveLeadArgs) => {
    if (args.qualification_status === "qualified" && getQualifiedCount() >= limits.max_leads) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Qualified lead limit reached (${limits.max_leads}). This company cannot be saved as qualified — mark it needs_review if evidence is genuinely mixed, or stop.`,
          },
        ],
        isError: true,
      };
    }

    if (args.qualification_status === "qualified" && !args.outreach_emails) {
      return {
        content: [
          {
            type: "text" as const,
            text: "qualified leads require a 3-step outreach_emails sequence. Use the outbound-copywriting skill first, then retry.",
          },
        ],
        isError: true,
      };
    }

    if (args.qualification_status === "qualified" && !args.linkedin_message?.trim()) {
      return {
        content: [
          {
            type: "text" as const,
            text: "qualified leads require a short linkedin_message. Use the outbound-copywriting skill first, then retry.",
          },
        ],
        isError: true,
      };
    }

    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("leads").upsert(
      {
        run_id: runId,
        company_name: args.company_name,
        company_domain: args.company_domain,
        qualification_status: args.qualification_status,
        confidence: args.confidence,
        fit_reasons: args.fit_reasons,
        concerns: args.concerns,
        source_urls: args.source_urls,
        source_summary: args.source_summary,
        outreach_emails: args.outreach_emails ?? null,
        linkedin_message: args.linkedin_message ?? null,
      },
      { onConflict: "run_id,company_domain" }
    );

    if (error) {
      return {
        content: [{ type: "text" as const, text: `Failed to save lead: ${error.message}` }],
        isError: true,
      };
    }

    if (args.qualification_status === "qualified") {
      recordQualified(args.company_domain);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `Saved ${args.company_name} as ${args.qualification_status}.`,
        },
      ],
    };
  };

  return tool(
    "save_lead",
    "Save or update a lead record for one company. Requires a 3-step outreach_emails sequence and a linkedin_message when qualification_status is 'qualified'. Refuses once the run's qualified-lead limit is reached.",
    saveLeadSchema,
    withLogging(runId, "save_lead", "Save qualification + outreach for a lead", handler),
    { annotations: { readOnlyHint: false } }
  );
}
