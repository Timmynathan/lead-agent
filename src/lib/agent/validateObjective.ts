import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

const NICHE_CHECK_TOOL = {
  name: "report_niche_check",
  description:
    "Report whether the objective names a real niche, industry, or type of company or service to target.",
  input_schema: {
    type: "object" as const,
    properties: {
      has_niche: {
        type: "boolean" as const,
        description:
          "True if the objective identifies at least one concrete industry, niche, company type, or " +
          "business/service category. False if it is a generic request with no real indication of what " +
          "kind of company to search for, such as just asking for 'leads' or 'good companies'.",
      },
      reason: {
        type: "string" as const,
        description: "One short sentence explaining the judgment.",
      },
    },
    required: ["has_niche", "reason"],
  },
};

/**
 * Uses a small, fast model to judge whether the objective actually names a
 * target niche, rather than a word-count heuristic that can't understand
 * meaning. This is a single, cheap classification call, separate from the
 * main research agent, not the full Agent SDK loop.
 */
export async function validateObjective(
  objective: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    tools: [NICHE_CHECK_TOOL],
    tool_choice: { type: "tool", name: "report_niche_check" },
    messages: [
      {
        role: "user",
        content: `A user is submitting a lead-qualification objective to an AI research agent. Decide
whether it gives the agent enough to search on: does it name at least one concrete industry, niche,
company type, or business/service category to target? It does not need geography, company size, or
any other detail, just a real subject to search for.

Objective: "${objective}"`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");

  if (!toolUse || toolUse.type !== "tool_use") {
    // Fail open: if the classification itself didn't come back cleanly, let
    // the run proceed rather than block the user on our own error.
    return { ok: true };
  }

  const input = toolUse.input as { has_niche: boolean; reason: string };

  if (!input.has_niche) {
    return {
      ok: false,
      error:
        `This objective doesn't specify what kind of company to target. ${input.reason} ` +
        `Add an industry, niche, or the type of business you're after, for example "Find 10 US B2B ` +
        `SaaS companies with 10 to 100 employees that may need AI automation support."`,
    };
  }

  return { ok: true };
}
