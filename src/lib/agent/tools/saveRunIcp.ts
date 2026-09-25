import { z } from "zod";
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { withLogging } from "@/lib/agent/withLogging";

export const saveRunIcpSchema = {
  target_company_type: z.string(),
  industries: z.array(z.string()),
  geography: z.array(z.string()),
  headcount_range: z.string(),
  buyer_persona: z.string(),
  business_problem: z.string(),
  hard_filters: z.array(z.string()),
  soft_preferences: z.array(z.string()),
  disqualifiers: z.array(z.string()),
};

type SaveRunIcpArgs = {
  target_company_type: string;
  industries: string[];
  geography: string[];
  headcount_range: string;
  buyer_persona: string;
  business_problem: string;
  hard_filters: string[];
  soft_preferences: string[];
  disqualifiers: string[];
};

export function createSaveRunIcpTool(runId: string) {
  const handler = async (args: SaveRunIcpArgs) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("runs").update({ refined_icp: args }).eq("id", runId);

    if (error) {
      return {
        content: [{ type: "text" as const, text: `Failed to save ICP: ${error.message}` }],
        isError: true,
      };
    }

    return {
      content: [{ type: "text" as const, text: "Refined ICP saved to the run record." }],
    };
  };

  return tool(
    "save_run_icp",
    "Persist the refined ICP criteria onto the run record. Call this once, first, before discover_companies.",
    saveRunIcpSchema,
    withLogging(runId, "save_run_icp", "Persist refined ICP to run record", handler),
    { annotations: { readOnlyHint: false } }
  );
}
