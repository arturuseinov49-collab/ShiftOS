"use client";
import { createBrowserClient } from "@supabase/ssr";
import { supabaseConfig } from "@/lib/env";
import type { Database } from "./database.types";
export function createClient() {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase is not configured");
  return createBrowserClient<Database>(config.url, config.key);
}
