---
name: icp-refinement
description: Turn a qualification objective (vague or specific) into structured ICP criteria — hard filters vs. soft preferences — before any company discovery call. Use this first, at the start of every run, before calling discover_companies.
---

# ICP Refinement

Turn a vague qualification objective into concrete ICP criteria before spending tool calls on
discovery and scraping. The agent should understand who counts as a good-fit company before it
searches.

## Minimum Criteria To Clarify

- Target company type
- Industry or niche
- Geography
- Company size or headcount range
- Relevant buyer or operator persona
- Business problem the company may have
- Hard disqualifiers
- Soft preferences

## Hard Filters vs Soft Preferences

Hard filters must be true for a lead to qualify. Examples: country must be United States, company
must be B2B, headcount must be between 10 and 100.

Soft preferences improve fit but should not automatically disqualify a company. Examples: recently
hiring operations roles, uses tools that may connect to automation workflows, publishes content
about scaling operations.

## Output

Produce this ICP object, then call the `save_run_icp` tool with it before calling
`discover_companies`:

```json
{
  "target_company_type": "",
  "industries": [],
  "geography": [],
  "headcount_range": "",
  "buyer_persona": "",
  "business_problem": "",
  "hard_filters": [],
  "soft_preferences": [],
  "disqualifiers": []
}
```

## Rules

- Do not treat every user preference as a hard filter.
- If the objective is too vague to search (e.g. no industry, geography, or size signal at all),
  make the narrowest reasonable assumption from context and say so in `hard_filters` reasoning
  rather than blocking — this app has no interactive clarification step, so proceed with your best
  structured read of the objective.
- Preserve every specific constraint the user gives — a specific objective's numbers, geography,
  and industry terms must show up in `hard_filters`, not get diluted into soft preferences.
- Keep the ICP narrow enough to search, but not so narrow that discovery returns nothing.
