"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChefHat,
  Martini,
  ConciergeBell,
  ArrowRight,
  CheckCircle2,
  Circle,
  Settings2,
  Plus,
  Clock3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  type AreaSettings,
  type Department,
  type Order,
  departments,
  departmentNames,
  demoDate,
  demoNow,
} from "@/modules/operations/types";
import {
  canManage,
  employeeFor,
  saveArea,
  prepareShift,
  toggleCheck,
  markOrderItem,
  closeOrder,
  addEmployee,
  visibleTasks,
} from "@/modules/operations/logic";
import { rubles } from "@/modules/finance/calculations";
import {
  type DemoContext,
  Panel,
  Pill,
  Field,
  fieldClass,
  Progress,
  Empty,
} from "./common";
export const areaIcons = {
  kitchen: ChefHat,
  bar: Martini,
  floor: ConciergeBell,
};

export function Departments({ ctx }: { ctx: DemoContext }) {
  const [editing, setEditing] = useState<AreaSettings | null>(null);
  return (
    <>
      <div className="mb-5 rounded-2xl border border-[#dce4cd] bg-[#edf2e3] p-5 text-sm leading-relaxed">
        Каждый участок получает ответственного, график, норматив обслуживания и
        задачи открытия. Повторное открытие смены не создаёт дубликаты задач.
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-3">
        {ctx.state.areas
          .filter((a) => a.restaurantId === ctx.state.restaurantId)
          .map((a) => {
            const Icon = areaIcons[a.department];
            const people = ctx.state.employees.filter(
              (e) =>
                e.restaurantId === a.restaurantId &&
                e.department === a.department &&
                e.active,
            );
            const tasks = ctx.state.tasks.filter(
              (t) =>
                t.restaurantId === a.restaurantId &&
                t.department === a.department,
            );
            const list = ctx.state.checklists.find(
              (c) =>
                c.restaurantId === a.restaurantId &&
                c.department === a.department,
            )!;
            const ready = list.items.filter((i) => i.done).length;
            return (
              <Panel key={a.department}>
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl bg-[#eff2e5]">
                    <Icon size={24} strokeWidth={1.5} />
                  </span>
                  <Pill tone={ready === list.items.length ? "green" : "orange"}>
                    {ready === list.items.length
                      ? "Готов к работе"
                      : "Идёт подготовка"}
                  </Pill>
                </div>
                <h2 className="mt-5 text-2xl font-semibold">
                  {departmentNames[a.department]}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {a.opens} — {a.closes}
                  {a.closes < a.opens ? " следующего дня" : ""} ·{" "}
                  {people.length} сотрудника
                </p>
                <div className="my-5 rounded-xl bg-[#f8f9f4] p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Ответственный за участок
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {ctx.state.employees.find((e) => e.id === a.leadId)?.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Норматив: {a.targetMinutes} мин ·{" "}
                    {a.department === "floor"
                      ? "обслуживание"
                      : "приготовление"}
                  </p>
                </div>
                <div className="mb-2 flex justify-between text-xs">
                  <span>Готовность по чек-листу</span>
                  <span>
                    {ready}/{list.items.length}
                  </span>
                </div>
                <Progress value={(ready / list.items.length) * 100} />
                <div className="my-5 flex justify-between border-y py-3 text-xs">
                  <span>
                    Открытых задач{" "}
                    <strong>
                      {tasks.filter((t) => t.status !== "done").length}
                    </strong>
                  </span>
                  <span>
                    На проверке{" "}
                    <strong>
                      {tasks.filter((t) => t.status === "review").length}
                    </strong>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      ctx.apply(
                        (s) => prepareShift(s, ctx.actor, a.department),
                        "Задача открытия смены подготовлена. Повторы исключены.",
                      )
                    }
                  >
                    Подготовить смену
                    <ArrowRight size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(a)}
                    aria-label={`Настроить участок ${departmentNames[a.department]}`}
                  >
                    <Settings2 size={14} />
                    Настроить
                  </Button>
                </div>
              </Panel>
            );
          })}
      </div>
      {editing && (
        <Dialog open onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Настройка участка · {departmentNames[editing.department]}
              </DialogTitle>
              <DialogDescription>
                Эти параметры используются при подготовке смены и контроле
                очереди заказов.
              </DialogDescription>
            </DialogHeader>
            <form
              action={(form) => {
                const area = {
                  ...editing,
                  leadId: String(form.get("lead")),
                  opens: String(form.get("opens")),
                  closes: String(form.get("closes")),
                  targetMinutes: Number(form.get("target")),
                };
                if (
                  ctx.apply(
                    (s) => saveArea(s, ctx.actor, area),
                    "Настройки участка сохранены.",
                  )
                )
                  setEditing(null);
              }}
              className="space-y-4"
            >
              <Field label="Ответственный" htmlFor="area-lead">
                <select
                  id="area-lead"
                  name="lead"
                  className={fieldClass}
                  defaultValue={editing.leadId}
                >
                  {ctx.state.employees
                    .filter(
                      (e) =>
                        e.restaurantId === ctx.state.restaurantId &&
                        e.department === editing.department &&
                        e.active,
                    )
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Начало смены" htmlFor="opens">
                  <input
                    type="time"
                    name="opens"
                    id="opens"
                    defaultValue={editing.opens}
                    className={fieldClass}
                    required
                  />
                </Field>
                <Field label="Конец смены" htmlFor="closes">
                  <input
                    type="time"
                    name="closes"
                    id="closes"
                    defaultValue={editing.closes}
                    className={fieldClass}
                    required
                  />
                </Field>
              </div>
              <Field label="Норматив, минут" htmlFor="target">
                <input
                  type="number"
                  name="target"
                  id="target"
                  min={1}
                  max={120}
                  defaultValue={editing.targetMinutes}
                  className={fieldClass}
                  required
                />
              </Field>
              <Button type="submit" className="w-full">
                Сохранить настройки
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
export function Checklists({ ctx }: { ctx: DemoContext }) {
  const params = useSearchParams();
  const [department, setDepartment] = useState(() => {
    const area = params.get("area");
    return departments.find((d) => d === area) ?? "all";
  });
  const employee = employeeFor(ctx.state, ctx.actor);
  const lists = ctx.state.checklists.filter(
    (c) =>
      c.restaurantId === ctx.state.restaurantId &&
      (canManage(ctx.actor) || c.department === employee?.department) &&
      (department === "all" || c.department === department),
  );
  return (
    <div className="space-y-5">
      <select
        className={`${fieldClass} sm:max-w-xs`}
        aria-label="Участок чек-листов"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
      >
        <option value="all">Все доступные участки</option>
        {departments.map((d) => (
          <option key={d} value={d}>
            {departmentNames[d]}
          </option>
        ))}
      </select>
      <div className="grid items-start gap-5 xl:grid-cols-3">
        {lists.map((c) => {
          const done = c.items.filter((i) => i.done).length;
          return (
            <Panel
              key={c.id}
              title={c.title}
              description={`${departmentNames[c.department]} · смена 29 сентября`}
              action={
                <Pill tone={done === c.items.length ? "green" : "orange"}>
                  {done}/{c.items.length}
                </Pill>
              }
            >
              <Progress value={(done / c.items.length) * 100} />
              <div className="mt-4 divide-y">
                {c.items.map((i) => (
                  <button
                    key={i.id}
                    aria-pressed={i.done}
                    onClick={() =>
                      ctx.apply((s) => toggleCheck(s, ctx.actor, c.id, i.id))
                    }
                    className="flex w-full items-center gap-3 py-4 text-left text-sm"
                  >
                    {i.done ? (
                      <CheckCircle2
                        size={19}
                        className="shrink-0 text-[#6b8853]"
                      />
                    ) : (
                      <Circle size={19} className="shrink-0 text-[#bdc7b3]" />
                    )}
                    <span>{i.title}</span>
                  </button>
                ))}
              </div>
            </Panel>
          );
        })}
      </div>
      {!lists.length && (
        <Empty text="На выбранном участке нет доступных чек-листов." />
      )}
    </div>
  );
}
const orderNames: Record<Order["status"], string> = {
  new: "Новый",
  preparing: "Готовится",
  ready: "К выдаче",
  closed: "Закрыт",
  cancelled: "Отменён",
};
export function Orders({ ctx }: { ctx: DemoContext }) {
  const params = useSearchParams();
  const [view, setView] = useState("active");
  const [department, setDepartment] = useState("all");
  const [query, setQuery] = useState(
    () =>
      ctx.state.orders.find(
        (o) =>
          o.restaurantId === ctx.state.restaurantId &&
          o.id === params.get("order"),
      )?.number ?? "",
  );
  const manager = canManage(ctx.actor);
  const employee = employeeFor(ctx.state, ctx.actor);
  const selected = manager ? department : (employee?.department ?? "none");
  const orders = ctx.state.orders
    .filter(
      (o) =>
        o.restaurantId === ctx.state.restaurantId &&
        (view === "history"
          ? o.status === "closed" && o.day === demoDate
          : !["closed", "cancelled"].includes(o.status)) &&
        (selected === "all" ||
          selected === "floor" ||
          o.items.some((i) => i.department === selected)) &&
        `${o.number} ${o.table}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={view === "active" ? "secondary" : "ghost"}
            onClick={() => setView("active")}
          >
            В работе
          </Button>
          <Button
            variant={view === "history" ? "secondary" : "ghost"}
            onClick={() => setView("history")}
          >
            Закрытые за сегодня
          </Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            aria-label="Поиск заказов"
            className={fieldClass}
            placeholder="Номер заказа или стол"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {manager && (
            <select
              aria-label="Участок заказов"
              className={fieldClass}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="all">Вся очередь</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {departmentNames[d]}
                </option>
              ))}
            </select>
          )}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Демо-очередь на 29 сентября, 16:00. Изменения статусов происходят
          только в ShiftOS и не отправляются в кассу.
        </p>
      </Panel>
      <div className="grid items-start gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {orders.map((order) => {
          const minutes = Math.max(
            0,
            Math.floor(
              (new Date(demoNow).getTime() -
                new Date(order.placedAt).getTime()) /
                60000,
            ),
          );
          const visibleItems = order.items
            .map((item, index) => ({ item, index }))
            .filter(
              ({ item }) =>
                selected === "all" ||
                selected === "floor" ||
                item.department === selected,
            );
          const delayed =
            order.status !== "closed" &&
            visibleItems.some(
              ({ item }) =>
                !item.ready &&
                minutes >
                  (ctx.state.areas.find(
                    (a) =>
                      a.restaurantId === order.restaurantId &&
                      a.department === item.department,
                  )?.targetMinutes ?? 20),
            );
          return (
            <Panel key={order.id} className={delayed ? "border-[#e6b29f]" : ""}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">
                    {order.number}{" "}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      {order.table}
                    </span>
                  </h2>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {order.provider === "iiko" ? "iiko" : "r_keeper"} · демо
                  </p>
                </div>
                <Pill
                  tone={
                    order.status === "ready"
                      ? "green"
                      : delayed
                        ? "red"
                        : "neutral"
                  }
                >
                  {orderNames[order.status]}
                </Pill>
              </div>
              {order.status !== "closed" && (
                <p
                  className={`mt-4 flex items-center gap-1.5 text-xs ${delayed ? "text-[#b64a30]" : "text-muted-foreground"}`}
                >
                  <Clock3 size={14} />
                  {minutes} мин {delayed && "· превышен норматив участка"}
                </p>
              )}
              <div className="my-4 divide-y">
                {visibleItems.map(({ item, index }) => (
                  <div key={index} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        {item.quantity} × {item.title}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {departmentNames[item.department]}
                      </p>
                    </div>
                    {item.ready ? (
                      <CheckCircle2
                        className="shrink-0 text-[#6c8956]"
                        size={18}
                        aria-label="Готово"
                      />
                    ) : (
                      (manager || employee?.department === item.department) && (
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`Готово: ${order.number} ${item.title}`}
                          onClick={() =>
                            ctx.apply(
                              (s) =>
                                markOrderItem(s, ctx.actor, order.id, index),
                              "Позиция готова к выдаче.",
                            )
                          }
                        >
                          Готово
                        </Button>
                      )
                    )}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                {manager ? (
                  <p className="font-semibold">
                    {rubles(
                      order.totalMinor -
                        order.discountMinor -
                        order.refundMinor,
                    )}
                  </p>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {order.items.reduce((s, i) => s + i.quantity, 0)} позиций в
                    заказе
                  </span>
                )}
                {order.status === "ready" &&
                  (manager || employee?.department === "floor") && (
                    <Button
                      size="sm"
                      onClick={() =>
                        ctx.apply(
                          (s) => closeOrder(s, ctx.actor, order.id),
                          "Демо-заказ закрыт. Аналитика обновлена.",
                        )
                      }
                    >
                      Закрыть заказ
                    </Button>
                  )}
              </div>
            </Panel>
          );
        })}
      </div>
      {orders.length === 0 && (
        <Empty
          title="Очередь свободна"
          text="Заказов с выбранными параметрами нет."
        />
      )}
    </div>
  );
}
export function Team({ ctx }: { ctx: DemoContext }) {
  const [adding, setAdding] = useState(false);
  const [department, setDepartment] = useState("all");
  const people = ctx.state.employees.filter(
    (e) =>
      e.restaurantId === ctx.state.restaurantId &&
      (department === "all" || e.department === department),
  );
  return (
    <>
      <div className="mb-5 flex flex-wrap justify-between gap-3">
        <select
          className={`${fieldClass} sm:max-w-xs`}
          aria-label="Участок команды"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="all">Вся команда</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {departmentNames[d]}
            </option>
          ))}
        </select>
        <Button onClick={() => setAdding(true)}>
          <Plus size={15} />
          Добавить сотрудника
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {people.map((e) => {
          const tasks = ctx.state.tasks.filter(
            (t) => t.assigneeId === e.id && t.status !== "done",
          );
          return (
            <Panel key={e.id}>
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-[#edf1e4] text-sm font-semibold">
                  {e.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <div>
                  <h2 className="text-sm font-semibold">{e.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {e.position}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-between">
                <Pill>{departmentNames[e.department]}</Pill>
                <span className="text-xs text-muted-foreground">
                  {tasks.length} открытых задач
                </span>
              </div>
              <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                {tasks.filter((t) => t.status === "review").length} на проверке
                · {tasks.filter((t) => t.priority === "high").length}{" "}
                приоритетных
              </p>
            </Panel>
          );
        })}
      </div>
      {adding && (
        <Dialog open onOpenChange={(open) => !open && setAdding(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить сотрудника</DialogTitle>
              <DialogDescription>
                Демо-профиль станет доступен для назначения задач и просмотра
                режима сотрудника. Приглашение не отправляется.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              action={(form) => {
                const person = {
                  id: crypto.randomUUID(),
                  restaurantId: ctx.state.restaurantId,
                  name: String(form.get("name")).trim(),
                  position: String(form.get("position")).trim(),
                  department: String(form.get("department")) as Department,
                  active: true,
                };
                if (
                  ctx.apply(
                    (s) => addEmployee(s, ctx.actor, person),
                    "Сотрудник добавлен в демо-команду.",
                  )
                )
                  setAdding(false);
              }}
            >
              <Field label="Имя и фамилия" htmlFor="person-name">
                <input
                  id="person-name"
                  name="name"
                  required
                  maxLength={100}
                  className={fieldClass}
                />
              </Field>
              <Field label="Должность" htmlFor="person-position">
                <input
                  id="person-position"
                  name="position"
                  required
                  maxLength={100}
                  className={fieldClass}
                />
              </Field>
              <Field label="Участок сотрудника" htmlFor="person-dept">
                <select
                  id="person-dept"
                  name="department"
                  className={fieldClass}
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {departmentNames[d]}
                    </option>
                  ))}
                </select>
              </Field>
              <Button className="w-full" type="submit">
                Добавить в команду
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
// Re-exporting the selector keeps dashboards and boards consistent.
export { visibleTasks };
