"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireTenant } from "@/modules/identity/tenant";
const taskInput = z
  .object({
    organizationId: z.uuid(),
    restaurantId: z.uuid(),
    title: z.string().trim().min(1).max(200),
    priority: z.enum(["normal", "high"]),
  })
  .strict();
export async function createTask(input: z.infer<typeof taskInput>) {
  const parsed = taskInput.safeParse(input);
  if (!parsed.success) return { error: "Проверьте название задачи." };
  try {
    const { organizationId, restaurantId, title, priority } = parsed.data;
    const { db, user } = await requireTenant(organizationId, "tasks.write");
    const { data, error } = await db
      .from("tasks")
      .insert({
        organization_id: organizationId,
        restaurant_id: restaurantId,
        title,
        priority,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error || !data)
      return { error: "Не удалось сохранить задачу. Проверьте права доступа." };
    revalidatePath(`/workspace/${organizationId}`, "layout");
    return { id: data.id };
  } catch {
    return { error: "Сессия истекла или недостаточно прав." };
  }
}
export async function updateTaskStatus(
  organizationId: string,
  taskId: string,
  status: "todo" | "done",
) {
  if (
    !z.uuid().safeParse(taskId).success ||
    !z.enum(["todo", "done"]).safeParse(status).success
  )
    return { error: "Некорректная задача." };
  try {
    const { db } = await requireTenant(organizationId, "tasks.write");
    const { error, data } = await db
      .from("tasks")
      .update({ status })
      .eq("organization_id", organizationId)
      .eq("id", taskId)
      .select("id")
      .single();
    if (error || !data) return { error: "Не удалось обновить задачу." };
    revalidatePath(`/workspace/${organizationId}`, "layout");
    return { ok: true };
  } catch {
    return { error: "Сессия истекла или недостаточно прав." };
  }
}
