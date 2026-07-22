import type { createDb } from "@workspace/db";

// Present when running as a Cloudflare Worker; absent under Node.
export type Bindings = {
  HYPERDRIVE?: { connectionString: string };
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  ADMIN_EMAILS?: string;
  NODE_ENV?: string;
};

export type SessionUser = {
  email: string;
  name: string | null;
  picture: string | null;
};

export type Variables = {
  db: ReturnType<typeof createDb>["db"];
  user?: SessionUser;
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };
