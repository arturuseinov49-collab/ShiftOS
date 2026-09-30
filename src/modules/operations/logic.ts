import {
  type Actor,
  type DemoState,
  type DemoSection,
  type OperationTask,
  type AreaSettings,
  type Invoice,
  type Employee,
  demoSections,
  demoNow,
  demoDate,
  taskSchema,
  areaSchema,
  employeeSchema,
} from "./types";
import { taskTemplates } from "./fixtures";

export const canManage = (actor: Actor) =>
  actor.role === "owner" || actor.role === "admin";
export function allowedSections(actor: Actor): DemoSection[] {
  if (actor.role === "owner") return [...demoSections];
  if (actor.role === "admin")
    return demoSections.filter(
      (s) => !["finance", "integrations", "settings"].includes(s),
    );
  return ["dashboard", "tasks", "checklists", "orders", "menu", "training"];
}
export function employeeFor(state: DemoState, actor: Actor) {
  return state.employees.find(
    (e) =>
      e.id === actor.employeeId &&
      e.restaurantId === state.restaurantId &&
      e.active,
  );
}
export function visibleTasks(state: DemoState, actor: Actor): OperationTask[] {
  const employee = employeeFor(state, actor);
  return state.tasks.filter(
    (t) =>
      t.restaurantId === state.restaurantId &&
      (canManage(actor) ||
        (!!employee &&
          (t.assigneeId === employee.id ||
            (!t.assigneeId && t.department === employee.department)))),
  );
}
export function isOverdue(task: OperationTask) {
  return (
    task.status !== "done" &&
    new Date(`${task.dueAt}:00+03:00`).getTime() < new Date(demoNow).getTime()
  );
}
export function saveTask(
  state: DemoState,
  actor: Actor,
  input: OperationTask,
): DemoState {
  if (!canManage(actor))
    throw new Error("Распределение задач доступно администратору и владельцу.");
  const task = taskSchema.parse(input);
  if (task.restaurantId !== state.restaurantId)
    throw new Error("Выберите задачу текущего заведения.");
  if (
    task.assigneeId &&
    !state.employees.some(
      (e) =>
        e.id === task.assigneeId &&
        e.restaurantId === task.restaurantId &&
        e.department === task.department &&
        e.active,
    )
  )
    throw new Error(
      "Исполнитель должен работать на этом участке и в этом заведении.",
    );
  const current = state.tasks.find((t) => t.id === task.id);
  if (current && current.restaurantId !== state.restaurantId)
    throw new Error("Задача другого заведения недоступна.");
  return {
    ...state,
    tasks: current
      ? state.tasks.map((t) => (t.id === task.id ? task : t))
      : [task, ...state.tasks],
  };
}
export function transitionTask(
  state: DemoState,
  actor: Actor,
  id: string,
  status: OperationTask["status"],
  note = "",
): DemoState {
  const task = visibleTasks(state, actor).find((t) => t.id === id);
  if (!task) throw new Error("Задача недоступна.");
  const manager = canManage(actor);
  const permitted = manager
    ? {
        todo: ["in_progress", "done"],
        in_progress: ["review", "done", "todo"],
        review: ["done", "in_progress"],
        done: ["todo"],
      }
    : { todo: ["in_progress"], in_progress: ["review"], review: [], done: [] };
  if (!permitted[task.status].includes(status))
    throw new Error("Этот переход недоступен для вашей роли.");
  const employee = employeeFor(state, actor);
  if (!manager && task.assigneeId && task.assigneeId !== employee?.id)
    throw new Error("Это задача другого сотрудника.");
  if (status === "review" && !note.trim())
    throw new Error("Добавьте результат работы перед отправкой на проверку.");
  return {
    ...state,
    tasks: state.tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            status,
            assigneeId:
              !manager && !t.assigneeId ? actor.employeeId : t.assigneeId,
            note: note.trim().slice(0, 1000) || t.note,
          }
        : t,
    ),
  };
}
export function distributeTasks(state: DemoState, actor: Actor): DemoState {
  if (!canManage(actor)) throw new Error("Недостаточно прав.");
  const tasks = state.tasks.map((t) => ({ ...t }));
  for (const task of tasks.filter(
    (t) =>
      t.restaurantId === state.restaurantId &&
      !t.assigneeId &&
      t.status === "todo",
  )) {
    const people = state.employees.filter(
      (e) =>
        e.active &&
        e.restaurantId === state.restaurantId &&
        e.department === task.department,
    );
    people.sort(
      (a, b) =>
        tasks.filter((t) => t.assigneeId === a.id && t.status !== "done")
          .length -
          tasks.filter((t) => t.assigneeId === b.id && t.status !== "done")
            .length || a.name.localeCompare(b.name, "ru"),
    );
    if (people[0]) task.assigneeId = people[0].id;
  }
  return { ...state, tasks };
}
export function saveArea(
  state: DemoState,
  actor: Actor,
  input: AreaSettings,
): DemoState {
  if (!canManage(actor)) throw new Error("Недостаточно прав.");
  const area = areaSchema.parse(input);
  if (
    area.restaurantId !== state.restaurantId ||
    !state.employees.some(
      (e) =>
        e.id === area.leadId &&
        e.department === area.department &&
        e.restaurantId === area.restaurantId &&
        e.active,
    )
  )
    throw new Error("Выберите ответственного из команды участка.");
  if (
    ![area.opens, area.closes].every(
      (t) => Number(t.slice(0, 2)) < 24 && Number(t.slice(3)) < 60,
    )
  )
    throw new Error("Укажите корректное время.");
  return {
    ...state,
    areas: state.areas.map((a) =>
      a.restaurantId === area.restaurantId && a.department === area.department
        ? area
        : a,
    ),
  };
}
export function prepareShift(
  state: DemoState,
  actor: Actor,
  department: AreaSettings["department"],
): DemoState {
  if (!canManage(actor)) throw new Error("Недостаточно прав.");
  const area = state.areas.find(
    (a) => a.restaurantId === state.restaurantId && a.department === department,
  )!;
  const template = taskTemplates.find((t) => t.department === department)!;
  const key = `${demoDate}-${state.restaurantId}-${department}`;
  if (state.tasks.some((t) => t.templateKey === key)) return state;
  return saveTask(state, actor, {
    id: `shift-${key}`,
    restaurantId: state.restaurantId,
    title: template.title,
    description: template.description,
    department,
    assigneeId: area.leadId,
    dueAt: `${demoDate}T${area.opens}`,
    status: "todo",
    priority: "high",
    note: "",
    templateKey: key,
  });
}
export function toggleCheck(
  state: DemoState,
  actor: Actor,
  checklistId: string,
  itemId: string,
): DemoState {
  const list = state.checklists.find(
    (c) => c.id === checklistId && c.restaurantId === state.restaurantId,
  );
  if (
    !list ||
    (!canManage(actor) &&
      list.department !== employeeFor(state, actor)?.department)
  )
    throw new Error("Чек-лист другого участка недоступен.");
  return {
    ...state,
    checklists: state.checklists.map((c) =>
      c.id === list.id
        ? {
            ...c,
            items: c.items.map((i) =>
              i.id === itemId ? { ...i, done: !i.done } : i,
            ),
          }
        : c,
    ),
  };
}
export function markOrderItem(
  state: DemoState,
  actor: Actor,
  orderId: string,
  index: number,
): DemoState {
  const order = state.orders.find(
    (o) => o.id === orderId && o.restaurantId === state.restaurantId,
  );
  if (!order || !["new", "preparing"].includes(order.status))
    throw new Error("Заказ недоступен для приготовления.");
  const item = order.items[index];
  if (
    !item ||
    item.ready ||
    (!canManage(actor) &&
      item.department !== employeeFor(state, actor)?.department)
  )
    throw new Error("Действие недоступно на вашем участке.");
  const items = order.items.map((i, n) =>
    n === index ? { ...i, ready: true } : i,
  );
  return {
    ...state,
    orders: state.orders.map((o) =>
      o.id === order.id
        ? {
            ...o,
            items,
            status: items.every((i) => i.ready) ? "ready" : "preparing",
          }
        : o,
    ),
  };
}
export function closeOrder(
  state: DemoState,
  actor: Actor,
  orderId: string,
): DemoState {
  if (!canManage(actor) && employeeFor(state, actor)?.department !== "floor")
    throw new Error("Закрыть заказ может сотрудник зала или администратор.");
  const order = state.orders.find(
    (o) => o.id === orderId && o.restaurantId === state.restaurantId,
  );
  if (!order || order.status !== "ready")
    throw new Error("Сначала приготовьте все позиции заказа.");
  return {
    ...state,
    orders: state.orders.map((o) =>
      o.id === orderId ? { ...o, status: "closed", closedAt: demoNow } : o,
    ),
  };
}
export function receiveInvoice(
  state: DemoState,
  actor: Actor,
  id: string,
  received: number[],
  note: string,
): DemoState {
  if (!canManage(actor)) throw new Error("Приёмка доступна администратору.");
  const invoice = state.invoices.find(
    (i) => i.id === id && i.restaurantId === state.restaurantId,
  );
  if (
    !invoice ||
    invoice.status !== "expected" ||
    received.length !== invoice.items.length ||
    received.some((n) => !Number.isFinite(n) || n < 0 || n > 100000)
  )
    throw new Error("Проверьте количество в накладной.");
  const items = invoice.items.map((i, index) => ({
    ...i,
    received: received[index],
  }));
  const discrepancy = items.some((i) => i.quantity !== i.received);
  if (discrepancy && !note.trim())
    throw new Error("Опишите расхождение с накладной.");
  return {
    ...state,
    invoices: state.invoices.map((i) =>
      i.id === id
        ? {
            ...i,
            items,
            status: discrepancy ? "discrepancy" : "received",
            note: note.slice(0, 1000),
          }
        : i,
    ),
  };
}
export function acceptCorrectedInvoice(
  state: DemoState,
  actor: Actor,
  id: string,
  resolution: string,
): DemoState {
  if (!canManage(actor)) throw new Error("Сверка доступна администратору.");
  const invoice = state.invoices.find(
    (i) => i.id === id && i.restaurantId === state.restaurantId,
  );
  if (!invoice || invoice.status !== "discrepancy" || !resolution.trim())
    throw new Error(
      "Укажите, какой исправленный документ согласован с поставщиком.",
    );
  const items = invoice.items
    .filter((i) => i.received > 0)
    .map((i) => ({ ...i, quantity: i.received }));
  if (!items.length)
    throw new Error("Пустую поставку нельзя принять к оплате.");
  return {
    ...state,
    invoices: state.invoices.map((i) =>
      i.id === id
        ? {
            ...i,
            items,
            status: "received",
            note: `${i.note}\nИсправленный документ: ${resolution.trim().slice(0, 400)}`.slice(
              -1000,
            ),
          }
        : i,
    ),
  };
}
export function payInvoice(
  state: DemoState,
  actor: Actor,
  id: string,
): DemoState {
  if (actor.role !== "owner") throw new Error("Оплату отмечает владелец.");
  const invoice = state.invoices.find(
    (i) => i.id === id && i.restaurantId === state.restaurantId,
  );
  if (!invoice || invoice.status !== "received" || invoice.paid)
    throw new Error("Сначала примите накладную без расхождений.");
  return {
    ...state,
    invoices: state.invoices.map((i) =>
      i.id === id ? { ...i, paid: true } : i,
    ),
  };
}
export const invoiceTotal = (invoice: Invoice) =>
  invoice.items.reduce(
    (sum, i) => sum + Math.round(i.quantity * i.priceMinor),
    0,
  );
export function addEmployee(
  state: DemoState,
  actor: Actor,
  input: Employee,
): DemoState {
  if (!canManage(actor)) throw new Error("Недостаточно прав.");
  const person = employeeSchema.parse(input);
  if (
    person.restaurantId !== state.restaurantId ||
    state.employees.some((e) => e.id === person.id)
  )
    throw new Error("Некорректный сотрудник.");
  return { ...state, employees: [...state.employees, person] };
}
