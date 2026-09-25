-- AI Lead Research and Outreach Agent — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) against your project.
-- All access goes through the Next.js server using the service-role key, so RLS is
-- enabled with no policies: the anon/public key can read or write nothing.

create extension if not exists "pgcrypto";

create type run_status as enum ('pending', 'running', 'completed', 'failed');
create type qualification_status as enum ('qualified', 'not_qualified', 'needs_review');
create type tool_call_status as enum ('success', 'error');

create table runs (
  id uuid primary key default gen_random_uuid(),
  objective text not null,
  refined_icp jsonb,
  limits jsonb not null,
  status run_status not null default 'pending',
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references runs (id) on delete cascade,
  company_name text not null,
  company_domain text not null,
  qualification_status qualification_status not null,
  confidence numeric(3, 2) not null check (confidence >= 0 and confidence <= 1),
  fit_reasons jsonb not null default '[]'::jsonb,
  concerns jsonb not null default '[]'::jsonb,
  source_urls jsonb not null default '[]'::jsonb,
  source_summary text not null,
  outreach_emails jsonb,
  linkedin_message text,
  created_at timestamptz not null default now(),
  unique (run_id, company_domain)
);

create table tool_calls (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references runs (id) on delete cascade,
  tool_name text not null,
  purpose text not null,
  input_summary text not null,
  result_summary text,
  status tool_call_status not null,
  error_message text,
  created_at timestamptz not null default now()
);

create index leads_run_id_idx on leads (run_id);
create index tool_calls_run_id_idx on tool_calls (run_id);

alter table runs enable row level security;
alter table leads enable row level security;
alter table tool_calls enable row level security;
