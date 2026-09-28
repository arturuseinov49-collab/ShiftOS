import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/env";
import { appOrigin } from "@/lib/app-origin";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = appOrigin(request.url);
  const code = url.searchParams.get("code");
  if (code && supabaseConfig()) {
    const db = await createClient();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(new URL("/workspace", origin), {
        headers: { "Cache-Control": "no-store" },
      });
  }
  // Fixed local redirect; never accept a caller-supplied redirect URL.
  return NextResponse.redirect(new URL("/login?error=callback", origin), {
    headers: { "Cache-Control": "no-store" },
  });
}
