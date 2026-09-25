import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { resolveRunLimits } from "@/lib/agent/limits";
import { runAgent } from "@/lib/agent/runAgent";
import { validateObjective } from "@/lib/agent/validateObjective";

const createRunSchema = z.object({
  objective: z.string().trim().min(10, "Describe the qualification objective in a bit more detail."),
  limits: z
    .object({
      max_candidates: z.number().int().optional(),
      max_scrapes: z.number().int().optional(),
      max_leads: z.number().int().optional(),
      max_turns: z.number().int().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createRunSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, {
      status: 400,
    });
  }

  const objectiveCheck = await validateObjective(parsed.data.objective);
  if (!objectiveCheck.ok) {
    return NextResponse.json({ error: objectiveCheck.error }, { status: 400 });
  }

  const limits = resolveRunLimits(parsed.data.limits);
  const supabase = getSupabaseServerClient();

  const { data: run, error } = await supabase
    .from("runs")
    .insert({ objective: parsed.data.objective, limits, status: "pending" })
    .select("id")
    .single();

  if (error || !run) {
    return NextResponse.json({ error: error?.message ?? "Failed to create run." }, { status: 500 });
  }

  // Fire-and-forget: this process stays alive (persistent Node server), so
  // the agent run continues after this response is sent without needing any
  // serverless-specific background-execution mechanism.
  runAgent(run.id).catch((err) => {
    console.error(`Unhandled error in runAgent(${run.id})`, err);
  });

  return NextResponse.json({ runId: run.id }, { status: 201 });
}

export async function GET() {
  const supabase = getSupabaseServerClient();

  const { data: runs, error } = await supabase
    .from("runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !runs) {
    return NextResponse.json({ error: error?.message ?? "Failed to load runs." }, { status: 500 });
  }

  const runIds = runs.map((r) => r.id);
  const { data: leads } = await supabase
    .from("leads")
    .select("run_id, qualification_status")
    .in("run_id", runIds.length > 0 ? runIds : ["00000000-0000-0000-0000-000000000000"]);

  const qualifiedCounts = new Map<string, number>();
  for (const lead of leads ?? []) {
    if (lead.qualification_status === "qualified") {
      qualifiedCounts.set(lead.run_id, (qualifiedCounts.get(lead.run_id) ?? 0) + 1);
    }
  }

  const runsWithCounts = runs.map((run) => ({
    ...run,
    qualifiedCount: qualifiedCounts.get(run.id) ?? 0,
  }));

  return NextResponse.json({ runs: runsWithCounts });
}
