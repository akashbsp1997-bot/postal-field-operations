import { createClient } from "@supabase/supabase-js";

let supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";

supabaseUrl = supabaseUrl.trim();
if (supabaseUrl && !supabaseUrl.startsWith("http://") && !supabaseUrl.startsWith("https://")) {
  supabaseUrl = "https://" + supabaseUrl;
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type { User, Session } from "@supabase/supabase-js";
