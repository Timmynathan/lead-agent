import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const supabase = getSupabaseServerClient();

  const [{ data: run, error: runError }, { data: leads, error: leadsError }, { data: toolCalls, error: toolCallsError }] =
    await Promise.all([
      supabase.from("runs").select("*").eq("id", runId).single(),
      supabase
        .from("leads")
        .select("*")
        .eq("run_id", runId)
        .order("created_at", { ascending: true }),
      supabase
        .from("tool_calls")
        .select("*")
        .eq("run_id", runId)
        .order("created_at", { ascending: true }),
    ]);

  if (runError || !run) {
    return NextResponse.json({ error: runError?.message ?? "Run not found." }, { status: 404 });
  }

  if (leadsError || toolCallsError) {
    return NextResponse.json(
      { error: leadsError?.message ?? toolCallsError?.message ?? "Failed to load run detail." },
      { status: 500 }
    );
  }

  return NextResponse.json({ run, leads, toolCalls });
}
