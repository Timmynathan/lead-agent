export type RunStatus = "pending" | "running" | "completed" | "failed";
export type QualificationStatus = "qualified" | "not_qualified" | "needs_review";
export type ToolCallStatus = "success" | "error";

// These are plain `type` object literals, not `interface`s, on purpose:
// Supabase's typed client requires each table's Row/Insert/Update to
// structurally satisfy Record<string, unknown>, which `interface` does not
// (interfaces don't structurally satisfy index-signature constraints the way
// object type literals do), causing every query to silently type as `never`.
export type RunLimits = {
  max_candidates: number;
  max_scrapes: number;
  max_leads: number;
  max_turns: number;
};

export type RefinedIcp = {
  target_company_type: string;
  industries: string[];
  geography: string[];
  headcount_range: string;
  buyer_persona: string;
  business_problem: string;
  hard_filters: string[];
  soft_preferences: string[];
  disqualifiers: string[];
};

export type RunRow = {
  id: string;
  objective: string;
  refined_icp: RefinedIcp | null;
  limits: RunLimits;
  status: RunStatus;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

export type OutreachEmailStep = {
  subject: string;
  body: string;
  personalization_note: string;
};

export type LeadRow = {
  id: string;
  run_id: string;
  company_name: string;
  company_domain: string;
  qualification_status: QualificationStatus;
  confidence: number;
  fit_reasons: string[];
  concerns: string[];
  source_urls: string[];
  source_summary: string;
  outreach_emails: OutreachEmailStep[] | null;
  linkedin_message: string | null;
  created_at: string;
};

export type ToolCallRow = {
  id: string;
  run_id: string;
  tool_name: string;
  purpose: string;
  input_summary: string;
  result_summary: string | null;
  status: ToolCallStatus;
  error_message: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      runs: {
        Row: RunRow;
        Insert: Partial<RunRow> & { objective: string; limits: RunLimits };
        Update: Partial<RunRow>;
        Relationships: [];
      };
      leads: {
        Row: LeadRow;
        Insert: Omit<LeadRow, "id" | "created_at">;
        Update: Partial<LeadRow>;
        Relationships: [];
      };
      tool_calls: {
        Row: ToolCallRow;
        Insert: Omit<ToolCallRow, "id" | "created_at">;
        Update: Partial<ToolCallRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
