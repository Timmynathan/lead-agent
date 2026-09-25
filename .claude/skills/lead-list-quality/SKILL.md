---
name: lead-list-quality
description: Run a final quality scorecard over the saved leads for a run before finishing — checks the list has 10 qualified companies, no duplicates, complete fields, and no safety violations. Use this near the end of a run, after enough candidates have been discovered and qualified.
---

# Lead-List Quality

Check the quality of the final lead list before finishing a run.

## Required Checks

- The list contains 10 qualified companies (or fewer, with a clear explanation, if the candidate
  pool ran out within the tool-call limits).
- Each company has a name and domain.
- Each company has qualification reasoning.
- Each company has source context.
- Each company has outreach drafts.
- No personal email finding or email validation was attempted.
- Duplicate companies were removed.
- Companies marked `needs_review` are not counted as qualified leads.

## Scorecard

| Dimension | What To Check |
| --- | --- |
| ICP Fit | The lead matches the hard filters in the qualification objective. |
| Evidence Quality | The qualification decision uses real source context. |
| Duplicate Rate | The same company does not appear more than once. |
| Outreach Relevance | The email sequence uses company-specific context. |
| Data Completeness | Required fields are present in Supabase. |
| Safety Compliance | The agent did not find emails, validate emails, or send outreach. |

## Pass Standard

The submitted list should include 10 qualified companies that pass the checks above. If the agent
cannot find 10 qualified companies from the first candidate pool, and the discovery/scrape limits
allow another pass, search again within the tool-call limit. Otherwise, stop and return fewer
qualified leads — do not pad the list with `needs_review` or weak `qualified` calls just to hit 10.
