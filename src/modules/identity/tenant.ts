import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/env";

export class AccessError extends Error {
  constructor(public readonly status: 401 | 403 | 503) {
    super("Access denied or unavailable");
  }
}
export async function requireUser() {
  if (!supabaseConfig()) throw new AccessError(503);
  const db = await createClient();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new AccessError(401);
  return { db, user: data.user };
}
export async function requireTenant(
  organizationId: string,
  permission?: string,
) {
  if (!z.uuid().safeParse(organizationId).success) throw new AccessError(403);
  const { db, user } = await requireUser();
  const { data: membership, error } = await db
    .from("memberships")
    .select("id, role_id")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (error || !membership) throw new AccessError(403);
  if (permission) {
    const { data: allowed, error } = await db.rpc("has_permission", {
      org_id: organizationId,
      permission,
    });
    if (error || !allowed) throw new AccessError(403);
  }
  return { db, user, organizationId, membership };
}
