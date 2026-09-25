import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { buildLeadsDocx } from "@/lib/export/toDocx";
import { buildLeadsPdf } from "@/lib/export/toPdf";
import type { LeadRow, RunRow } from "@/lib/supabase/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const format = new URL(request.url).searchParams.get("format");

  if (format !== "docx" && format !== "pdf") {
    return NextResponse.json({ error: "format must be 'docx' or 'pdf'." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const [{ data: run, error: runError }, { data: leads, error: leadsError }] = await Promise.all([
    supabase.from("runs").select("*").eq("id", runId).single<RunRow>(),
    supabase
      .from("leads")
      .select("*")
      .eq("run_id", runId)
      .eq("qualification_status", "qualified")
      .order("created_at", { ascending: true })
      .returns<LeadRow[]>(),
  ]);

  if (runError || !run) {
    return NextResponse.json({ error: runError?.message ?? "Run not found." }, { status: 404 });
  }
  if (leadsError || !leads) {
    return NextResponse.json({ error: leadsError?.message ?? "Failed to load leads." }, { status: 500 });
  }
  if (leads.length === 0) {
    return NextResponse.json({ error: "This run has no qualified leads to export yet." }, { status: 400 });
  }

  const filename = `scraping-bird-leads-${runId.slice(0, 8)}.${format}`;

  if (format === "docx") {
    const buffer = await buildLeadsDocx(run, leads);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const buffer = await buildLeadsPdf(run, leads);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
