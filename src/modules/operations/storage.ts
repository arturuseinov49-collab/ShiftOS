import { stateSchema, restaurants, departments, type DemoState } from "./types";
export const demoStorageKey = "shiftos-operations-demo-v2";
export function restoreDemo(raw: string): DemoState | null {
  try {
    const result = stateSchema.safeParse(JSON.parse(raw));
    if (!result.success) return null;
    const s = result.data;
    const validRestaurant = (id: string) =>
      restaurants.some((r) => r.id === id);
    if (
      !validRestaurant(s.restaurantId) ||
      !s.employees.some(
        (e) =>
          e.id === s.employeeId &&
          e.restaurantId === s.restaurantId &&
          e.active,
      )
    )
      return null;
    if (
      [
        ...s.employees,
        ...s.tasks,
        ...s.areas,
        ...s.checklists,
        ...s.orders,
        ...s.expenses,
        ...s.invoices,
        ...s.connections,
      ].some((x) => !validRestaurant(x.restaurantId))
    )
      return null;
    for (const r of restaurants)
      for (const d of departments) {
        const areas = s.areas.filter(
          (a) => a.restaurantId === r.id && a.department === d,
        );
        if (
          areas.length !== 1 ||
          !s.employees.some(
            (e) =>
              e.id === areas[0].leadId &&
              e.restaurantId === r.id &&
              e.department === d &&
              e.active,
          )
        )
          return null;
        if (
          !s.checklists.some(
            (c) =>
              c.restaurantId === r.id &&
              c.department === d &&
              c.items.length > 0,
          )
        )
          return null;
      }
    if (
      s.tasks.some(
        (t) =>
          t.assigneeId &&
          !s.employees.some(
            (e) =>
              e.id === t.assigneeId &&
              e.restaurantId === t.restaurantId &&
              e.department === t.department,
          ),
      )
    )
      return null;
    if (s.orders.some((o) => o.discountMinor + o.refundMinor > o.totalMinor))
      return null;
    return s;
  } catch {
    return null;
  }
}
