// src/lib/supabase-client.ts (client-side only)
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Browser client — use in Client Components */
export const supabaseBrowser = () =>
  createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
