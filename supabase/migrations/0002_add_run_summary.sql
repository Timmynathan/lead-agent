-- Adds a place to persist the agent's own final wrap-up text, separate from
-- error_message (which stays reserved for actual failures). Without this,
-- a run that finishes successfully but short of the qualified-lead target
-- has no record of why it stopped short, even though the agent explains
-- itself in its final response.
alter table runs add column summary text;
