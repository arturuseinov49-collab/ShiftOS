import "server-only";
import { requireTenant } from "@/modules/identity/tenant";
import type { WorkspaceData, Task } from "./types";
export async function loadWorkspace(
  organizationId: string,
): Promise<WorkspaceData> {
  const { db } = await requireTenant(organizationId);
  // Explicit scoping is defense in depth; RLS independently enforces membership/permissions.
  const [
    org,
    restaurants,
    tasks,
    employees,
    categories,
    menu,
    training,
    checklists,
    items,
    write,
  ] = await Promise.all([
    db.from("organizations").select("name").eq("id", organizationId).single(),
    db
      .from("restaurants")
      .select("id,name,address")
      .eq("organization_id", organizationId)
      .order("name"),
    db
      .from("tasks")
      .select("id,restaurant_id,title,status,priority,due_at,assignee_id")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(200),
    db
      .from("employees")
      .select("id,restaurant_id,full_name,position,status")
      .eq("organization_id", organizationId)
      .order("full_name")
      .limit(200),
    db
      .from("menu_categories")
      .select("id,name")
      .eq("organization_id", organizationId),
    db
      .from("menu_items")
      .select(
        "id,name,category_id,price,currency,available,description,allergens",
      )
      .eq("organization_id", organizationId)
      .order("name")
      .limit(200),
    db
      .from("training")
      .select("id,title,content,status")
      .eq("organization_id", organizationId)
      .order("created_at"),
    db
      .from("checklists")
      .select("id,restaurant_id,title,kind")
      .eq("organization_id", organizationId),
    db
      .from("checklist_items")
      .select("id,checklist_id,title")
      .eq("organization_id", organizationId)
      .order("sort_order"),
    db.rpc("has_permission", {
      org_id: organizationId,
      permission: "tasks.write",
    }),
  ]);
  if (
    [
      org,
      restaurants,
      tasks,
      employees,
      categories,
      menu,
      training,
      checklists,
      items,
      write,
    ].some((r) => r.error)
  )
    throw new Error("Workspace data unavailable");
  const people = employees.data ?? [];
  return {
    organizationId,
    organizationName: org.data!.name,
    mode: "live",
    canWriteTasks: !!write.data,
    restaurants: restaurants.data ?? [],
    tasks: (tasks.data ?? []).map((t) => ({
      id: t.id,
      restaurantId: t.restaurant_id,
      title: t.title,
      status: t.status as Task["status"],
      priority: t.priority as Task["priority"],
      assignee:
        people.find((p) => p.id === t.assignee_id)?.full_name ?? "Не назначен",
      due: t.due_at
        ? new Intl.DateTimeFormat("ru-RU", {
            timeZone: "Europe/Moscow",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(t.due_at))
        : "Без срока",
    })),
    employees: people.map((p) => ({
      id: p.id,
      restaurantId: p.restaurant_id,
      name: p.full_name,
      position: p.position,
      initials: p.full_name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join(""),
      active: p.status === "active",
    })),
    menu: (menu.data ?? []).map((m) => ({
      ...m,
      category:
        categories.data?.find((c) => c.id === m.category_id)?.name ?? "Меню",
    })),
    training: training.data ?? [],
    checklists: (checklists.data ?? []).map((c) => ({
      id: c.id,
      restaurantId: c.restaurant_id,
      title: c.title,
      kind: c.kind,
      items: (items.data ?? [])
        .filter((i) => i.checklist_id === c.id)
        .map((i) => ({ id: i.id, title: i.title, done: false })),
    })),
  };
}
