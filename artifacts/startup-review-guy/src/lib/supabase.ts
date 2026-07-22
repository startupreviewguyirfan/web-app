import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Admin login is optional (see CLAUDE.md) — public pages must keep working
// even when Supabase env vars aren't configured, so this is `null` rather
// than throwing, and callers (admin pages, the auth-state listener) check it.
export const supabase: SupabaseClient | null =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey)
    : null;
