import { getSupabaseServerClient } from "@/lib/supabase/server";

type ToolResultBlock = { type: "text"; text: string };
export type ToolResult = {
  content: ToolResultBlock[];
  isError?: boolean;
  structuredContent?: Record<string, unknown>;
};

const MAX_SUMMARY_LENGTH = 2000;

function truncate(value: string, max = MAX_SUMMARY_LENGTH) {
  return value.length > max ? `${value.slice(0, max)}… (truncated)` : value;
}

function summarizeInput(args: unknown) {
  try {
    return truncate(JSON.stringify(args));
  } catch {
    return "(unserializable input)";
  }
}

function summarizeResult(result: ToolResult) {
  const text = result.content
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text)
    .join("\n");
  return truncate(text || "(no text content)");
}

/**
 * Wraps a tool handler so every call is written to the tool_calls table
 * automatically — the agent can't skip or misreport logging, since it never
 * calls the logging step itself.
 */
export function withLogging<Args>(
  runId: string,
  toolName: string,
  purpose: string,
  handler: (args: Args) => Promise<ToolResult>
) {
  return async (args: Args): Promise<ToolResult> => {
    const supabase = getSupabaseServerClient();
    const inputSummary = summarizeInput(args);

    try {
      const result = await handler(args);

      await supabase.from("tool_calls").insert({
        run_id: runId,
        tool_name: toolName,
        purpose,
        input_summary: inputSummary,
        result_summary: summarizeResult(result),
        status: result.isError ? "error" : "success",
        error_message: result.isError ? summarizeResult(result) : null,
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      await supabase.from("tool_calls").insert({
        run_id: runId,
        tool_name: toolName,
        purpose,
        input_summary: inputSummary,
        result_summary: null,
        status: "error",
        error_message: truncate(message),
      });

      return {
        content: [{ type: "text", text: `${toolName} failed: ${message}` }],
        isError: true,
      };
    }
  };
}
