import { query } from "@anthropic-ai/claude-agent-sdk";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { buildSystemPrompt } from "./prompt";
import { createLeadResearchServer } from "./tools";
import type { RunRow } from "@/lib/supabase/types";

const ALLOWED_TOOLS = [
  "Skill",
  "mcp__leadresearch__save_run_icp",
  "mcp__leadresearch__discover_companies",
  "mcp__leadresearch__scrape_website",
  "mcp__leadresearch__save_lead",
];

/**
 * Writes the run's final status. Tries the full update first; if that fails
 * (for example because the `summary` column hasn't been migrated in yet),
 * falls back to updating just the fields that matter most — status and
 * completed_at — rather than silently leaving the run stuck on "running"
 * forever. A run's terminal status must never be lost to a write error.
 */
async function finalizeRun(
  runId: string,
  fields: {
    status: "completed" | "failed";
    error_message: string | null;
    summary: string | null;
  }
) {
  const supabase = getSupabaseServerClient();
  const completed_at = new Date().toISOString();

  const { error } = await supabase
    .from("runs")
    .update({ ...fields, completed_at })
    .eq("id", runId);

  if (!error) return;

  console.error(`runAgent: full finalize update failed for run ${runId}, retrying without summary`, error);

  const { error: fallbackError } = await supabase
    .from("runs")
    .update({
      status: fields.status,
      error_message: fields.error_message,
      completed_at,
    })
    .eq("id", runId);

  if (fallbackError) {
    console.error(`runAgent: fallback finalize update also failed for run ${runId}`, fallbackError);
  }
}

/**
 * Runs the agent for a run row that's already been inserted with status
 * "pending". Intended to be invoked without being awaited by the request
 * handler (via waitUntil) so the HTTP response can return the runId
 * immediately while this continues in the background.
 */
export async function runAgent(runId: string) {
  const supabase = getSupabaseServerClient();

  const { data: run, error: fetchError } = await supabase
    .from("runs")
    .select("*")
    .eq("id", runId)
    .single<RunRow>();

  if (fetchError || !run) {
    console.error(`runAgent: could not load run ${runId}`, fetchError);
    return;
  }

  const { error: runningError } = await supabase
    .from("runs")
    .update({ status: "running" })
    .eq("id", runId);
  if (runningError) {
    console.error(`runAgent: failed to mark run ${runId} as running`, runningError);
  }

  try {
    const leadResearchServer = createLeadResearchServer(runId, run.limits);
    const systemPrompt = buildSystemPrompt(run.objective, run.limits);

    let finalText = "";
    let succeeded = false;

    for await (const message of query({
      prompt: "Begin the lead research run as described in your instructions.",
      options: {
        systemPrompt,
        cwd: process.cwd(),
        settingSources: ["project"],
        skills: "all",
        mcpServers: { leadresearch: leadResearchServer },
        allowedTools: ALLOWED_TOOLS,
        maxTurns: run.limits.max_turns,
      },
    })) {
      if (message.type === "result") {
        succeeded = message.subtype === "success";
        finalText =
          typeof (message as { result?: unknown }).result === "string"
            ? (message as { result: string }).result
            : `Run ended with subtype "${message.subtype}".`;
      }
    }

    await finalizeRun(runId, {
      status: succeeded ? "completed" : "failed",
      error_message: succeeded ? null : finalText,
      summary: succeeded ? finalText : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`runAgent: run ${runId} threw`, error);
    await finalizeRun(runId, { status: "failed", error_message: message, summary: null });
  }
}
