"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "./tenant";
export async function signOut() {
  const db = await createClient();
  const { error } = await db.auth.signOut();
  if (error) throw new Error("Sign out failed");
  redirect("/login");
}
export async function createOrganization(_: { error: string }, form: FormData) {
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(100),
      restaurant: z.string().trim().min(2).max(100),
    })
    .safeParse({ name: form.get("name"), restaurant: form.get("restaurant") });
  if (!parsed.success)
    return { error: "Название организации и заведения: от 2 до 100 символов." };
  let organizationId: string;
  try {
    const { db } = await requireUser();
    const { data, error } = await db.rpc("create_organization", {
      organization_name: parsed.data.name,
      restaurant_name: parsed.data.restaurant,
    });
    if (error || !data)
      return {
        error:
          "Не удалось создать организацию. Проверьте миграции и права доступа.",
      };
    organizationId = data;
  } catch {
    return { error: "Войдите снова и повторите попытку." };
  }
  redirect(`/workspace/${organizationId}/dashboard`);
}
