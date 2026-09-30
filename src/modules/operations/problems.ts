import {
  type Actor,
  type DemoState,
  type Department,
  departmentNames,
  demoDate,
  demoNow,
} from "./types";
import { canManage, saveTask } from "./logic";
import { financials, rubles } from "../finance/calculations";

export type ShiftProblem = {
  id: string;
  title: string;
  evidence: string;
  instruction: string;
  department: Department;
  href: string;
  priority: "high" | "normal";
};

// Explicit rules over observed demo facts. No inference about employee intent.
export function shiftProblems(state: DemoState, actor: Actor): ShiftProblem[] {
  if (!canManage(actor)) return [];
  const problems: ShiftProblem[] = [];
  const areas = state.areas.filter(
    (a) => a.restaurantId === state.restaurantId,
  );
  const now = new Date(demoNow).getTime();
  for (const order of state.orders.filter(
    (o) =>
      o.restaurantId === state.restaurantId &&
      ["new", "preparing"].includes(o.status),
  )) {
    const minutes = Math.max(
      0,
      Math.floor((now - new Date(order.placedAt).getTime()) / 60000),
    );
    for (const area of areas) {
      const pending = order.items.filter(
        (i) => i.department === area.department && !i.ready,
      );
      if (!pending.length || minutes <= area.targetMinutes) continue;
      problems.push({
        id: `delay-${order.id}-${area.department}`,
        title: `Заказ ${order.number} задерживается · ${departmentNames[area.department]}`,
        evidence: `${order.table} · ${minutes} мин с поступления, норматив участка ${area.targetMinutes} мин. Не готовы: ${pending.map((i) => i.title).join(", ")}.`,
        instruction: `Уточните готовность позиций заказа ${order.number}, согласуйте время с залом и сообщите гостю. Зафиксируйте причину задержки и результат.`,
        department: area.department,
        href: `/demo/orders?order=${encodeURIComponent(order.id)}`,
        priority: "high",
      });
    }
  }
  for (const invoice of state.invoices.filter(
    (i) => i.restaurantId === state.restaurantId && i.status === "discrepancy",
  )) {
    const difference = invoice.items.reduce(
      (sum, i) => sum + Math.round((i.quantity - i.received) * i.priceMinor),
      0,
    );
    problems.push({
      id: `supply-${invoice.id}`,
      title: `Расхождение в поставке ${invoice.number}`,
      evidence: `${invoice.supplier} · разница документа и приёмки ${rubles(difference)}. ${invoice.note || "Количество не совпало."} Оплата заблокирована.`,
      instruction: `Сверьте приёмку ${invoice.number} с поставщиком. Получите исправленный документ на фактическое количество либо договоритесь о допоставке. Приложите номер документа к результату.`,
      department: invoice.department,
      href: `/demo/invoices?invoice=${encodeURIComponent(invoice.id)}`,
      priority: "high",
    });
  }
  for (const area of areas) {
    const checklist = state.checklists.find(
      (c) =>
        c.restaurantId === state.restaurantId &&
        c.department === area.department,
    );
    const missing = checklist?.items.filter((i) => !i.done) ?? [];
    if (!missing.length || `${demoDate}T${area.opens}` > demoNow.slice(0, 16))
      continue;
    problems.push({
      id: `readiness-${state.restaurantId}-${area.department}-${demoDate}`,
      title: `Готовность участка не подтверждена · ${departmentNames[area.department]}`,
      evidence: `Начало работы ${area.opens}. Не отмечено: ${missing.map((i) => i.title).join(", ")}. Это отсутствие подтверждения, а не доказательство невыполненной работы.`,
      instruction: `Проверьте готовность участка и отметьте фактически выполненные пункты: ${missing.map((i) => i.title).join(", ")}. Сообщите администратору об отклонениях.`,
      department: area.department,
      href: `/demo/checklists?area=${area.department}`,
      priority: "normal",
    });
  }
  if (actor.role === "owner") {
    const result = financials(state, state.restaurantId, demoDate, demoDate);
    if (result.profit < 0)
      problems.push({
        id: `loss-${state.restaurantId}-${demoDate}`,
        title: "Смена пока убыточна",
        evidence: `Операционный результат ${rubles(result.profit)} по закрытым заказам и внесённым расходам. Смена ещё не завершена.`,
        instruction:
          "Проверьте полноту продаж, себестоимость и разовые расходы в отчёте. Не принимайте решения о персонале по одному промежуточному показателю.",
        department: "floor",
        href: "/demo/finance",
        priority: "high",
      });
  }
  return problems.sort(
    (a, b) => Number(b.priority === "high") - Number(a.priority === "high"),
  );
}

export function assignProblem(
  state: DemoState,
  actor: Actor,
  problemId: string,
): DemoState {
  const problem = shiftProblems(state, actor).find((p) => p.id === problemId);
  if (!problem) throw new Error("Проблема уже устранена или недоступна.");
  if (problem.href === "/demo/finance")
    throw new Error("Финансовый разбор доступен владельцу в отчёте.");
  const key = `problem-${problem.id}`;
  if (
    state.tasks.some(
      (t) => t.restaurantId === state.restaurantId && t.templateKey === key,
    )
  )
    return state;
  const area = state.areas.find(
    (a) =>
      a.restaurantId === state.restaurantId &&
      a.department === problem.department,
  )!;
  return saveTask(state, actor, {
    id: key,
    templateKey: key,
    restaurantId: state.restaurantId,
    title: problem.title,
    description: `${problem.evidence}\n\n${problem.instruction}`,
    department: problem.department,
    assigneeId: area.leadId,
    dueAt: `${demoDate}T16:30`,
    status: "todo",
    priority: problem.priority,
    note: "",
  });
}
