"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ChefHat,
  ListTodo,
  ClipboardCheck,
  ReceiptText,
  ChartNoAxesCombined,
  Files,
  Users,
  Plug,
  UtensilsCrossed,
  GraduationCap,
  Sparkles,
  Settings2,
  Menu,
  X,
  Plus,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  BookOpen,
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
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Brand } from "@/components/workspace/navigation";
import {
  type DemoSection,
  type DemoRole,
  type OperationTask,
  departmentNames,
  restaurants,
  roles,
  roleNames,
  demoDate,
} from "@/modules/operations/types";
import {
  canManage,
  allowedSections,
  employeeFor,
  visibleTasks,
  isOverdue,
} from "@/modules/operations/logic";
import { financials, rubles } from "@/modules/finance/calculations";
import { demoWorkspace } from "@/modules/workspace/demo";
import { cn } from "@/lib/utils";
import { useDemo } from "./provider";
import {
  type DemoContext,
  Panel,
  Metric,
  Pill,
  Empty,
  Progress,
  fieldClass,
} from "./common";
import { Tasks, TaskEditor, TaskDetail, TaskRow } from "./tasks";
import { Departments, Checklists, Orders, Team, areaIcons } from "./operations";
import { Finance, Invoices } from "./finance";
import { Integrations } from "./integrations";
import { Problems } from "./problems";

const nav = [
  { id: "dashboard", title: "Обзор", icon: LayoutDashboard },
  { id: "departments", title: "Кухня · бар · зал", icon: ChefHat },
  { id: "tasks", title: "Задачи", icon: ListTodo },
  { id: "checklists", title: "Чек-листы", icon: ClipboardCheck },
  { id: "orders", title: "Заказы", icon: ReceiptText },
  { id: "team", title: "Команда", icon: Users },
  { id: "finance", title: "Финансы", icon: ChartNoAxesCombined },
  { id: "invoices", title: "Накладные", icon: Files },
  { id: "integrations", title: "Интеграции", icon: Plug },
  { id: "menu", title: "Меню", icon: UtensilsCrossed },
  { id: "training", title: "Обучение", icon: GraduationCap },
  { id: "assistant", title: "Помощник", icon: Sparkles },
  { id: "settings", title: "Настройки", icon: Settings2 },
] as const;
const descriptions: Record<DemoSection, string> = {
  dashboard: "От первой заготовки до результата смены — всё связано.",
  departments: "Ответственные, график и стандарты каждого участка.",
  tasks: "Поставить. Назначить. Проверить результат.",
  checklists: "Готовность участка начинается с понятного стандарта.",
  orders: "Общая очередь с отдельными действиями кухни, бара и зала.",
  finance: "Выручка, расходы и результат, который остаётся бизнесу.",
  invoices: "Поставки, приёмка, расхождения и расчёты с поставщиками.",
  team: "Кто за что отвечает и как распределена нагрузка.",
  integrations: "Данные из iiko и r_keeper в одном рабочем пространстве.",
  menu: "Состав, аллергены и доступность блюд — под рукой.",
  training: "Короткие материалы, которые помогают в работе.",
  assistant: "Внимание к проблемам, которые требуют действия.",
  settings: "Сценарий демо и возможности разных ролей.",
};
export function DemoWorkspace({ section }: { section: DemoSection }) {
  const ctx = useDemo();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [editing, setEditing] = useState<OperationTask | null | undefined>(
    undefined,
  );
  const [detail, setDetail] = useState<string | null>(null);
  const allowed = allowedSections(ctx.actor);
  const manager = canManage(ctx.actor);
  const title =
    section === "dashboard"
      ? ctx.actor.role === "employee"
        ? "Моя смена"
        : "Всё заведение перед глазами"
      : nav.find((n) => n.id === section)!.title;
  const restaurant = restaurants.find((r) => r.id === ctx.state.restaurantId)!;
  function changeRole(role: DemoRole) {
    ctx.apply((s) => ({ ...s, role }));
    setEditing(undefined);
    setDetail(null);
    router.push("/demo");
  }
  function sidebar() {
    return (
      <div className="flex h-full flex-col overflow-y-auto bg-[#233d33] px-5 py-7 text-[#c1cdc4]">
        <Link
          href="/demo"
          className="px-2"
          onClick={() => setMobileOpen(false)}
          aria-label="ShiftOS — обзор"
        >
          <Brand dark />
        </Link>
        <div className="mb-5 mt-7 border-b border-white/10 px-2 pb-5">
          <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-[#819d8c]">
            Рабочее пространство
          </p>
          <p className="mt-2 text-sm font-medium text-white">
            North Collective
          </p>
          <p className="mt-1 text-[11px] text-[#aebfaf]">
            {roleNames[ctx.actor.role]} · демо
          </p>
        </div>
        <nav aria-label="Основная навигация" className="space-y-1">
          {nav
            .filter((n) => allowed.includes(n.id))
            .map(({ id, title: label, icon: Icon }) => (
              <Link
                key={id}
                href={`/demo/${id}`}
                onClick={() => setMobileOpen(false)}
                aria-current={section === id ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] transition hover:bg-white/5 hover:text-white",
                  section === id &&
                    "bg-[#dce8c7] font-semibold text-[#263d2e] hover:bg-[#dce8c7] hover:text-[#263d2e]",
                  id === "finance" && "mt-4",
                )}
              >
                <Icon size={17} strokeWidth={1.65} />
                {ctx.actor.role === "employee" && id === "tasks"
                  ? "Мои задачи"
                  : label}
              </Link>
            ))}
        </nav>
        <div className="mt-auto pt-7">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
            <p className="text-xs font-medium text-[#e0e8d8]">
              Сильная смена — общая работа.
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-[#9eb3a4]">
              Кухня, бар и зал видят свой следующий шаг.
            </p>
          </div>
          <Link
            href="/login"
            className="mt-4 flex items-center justify-between px-2 text-xs"
          >
            Войти в рабочий аккаунт
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    );
  }
  if (!ctx.ready)
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-center">
          <Brand />
          <p className="mt-4 text-sm text-muted-foreground">
            Готовим рабочее пространство…
          </p>
        </div>
      </div>
    );
  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only fixed z-50 bg-white p-4 focus:not-sr-only"
      >
        Перейти к содержимому
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[238px] lg:block">
        {sidebar()}
      </aside>
      <div className="lg:pl-[238px]">
        <header className="border-b bg-white px-4 py-4 sm:px-8 xl:px-10">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <div className="flex min-w-0 items-center gap-2">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    aria-label="Открыть меню"
                  >
                    <Menu size={20} />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[285px] gap-0 border-none p-0 [&>button]:text-white"
                >
                  <SheetTitle className="sr-only">Навигация ShiftOS</SheetTitle>
                  <SheetDescription className="sr-only">
                    Разделы для выбранной роли
                  </SheetDescription>
                  {sidebar()}
                </SheetContent>
              </Sheet>
              <div>
                <label htmlFor="restaurant" className="sr-only">
                  Выберите заведение
                </label>
                <select
                  id="restaurant"
                  className="max-w-[200px] bg-transparent text-sm font-semibold"
                  value={ctx.state.restaurantId}
                  onChange={(e) => {
                    const id = e.target.value;
                    ctx.apply((s) => ({
                      ...s,
                      restaurantId: id,
                      employeeId: s.employees.find(
                        (p) => p.restaurantId === id && p.active,
                      )!.id,
                    }));
                    setEditing(undefined);
                    setDetail(null);
                  }}
                >
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {restaurant.address}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label
                  htmlFor="demo-role"
                  className="mb-1 block text-[10px] text-muted-foreground"
                >
                  Роль в демо
                </label>
                <select
                  id="demo-role"
                  className="h-9 rounded-lg border bg-[#f6f8f0] px-2 text-xs font-semibold"
                  value={ctx.actor.role}
                  onChange={(e) => changeRole(e.target.value as DemoRole)}
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {roleNames[r]}
                    </option>
                  ))}
                </select>
              </div>
              {ctx.actor.role === "employee" && (
                <div>
                  <label
                    htmlFor="demo-person"
                    className="mb-1 block text-[10px] text-muted-foreground"
                  >
                    Сотрудник в демо
                  </label>
                  <select
                    id="demo-person"
                    className="h-9 max-w-[195px] rounded-lg border px-2 text-xs"
                    value={ctx.state.employeeId}
                    onChange={(e) => {
                      ctx.apply((s) => ({ ...s, employeeId: e.target.value }));
                      setDetail(null);
                    }}
                  >
                    {ctx.state.employees
                      .filter(
                        (e) =>
                          e.active && e.restaurantId === ctx.state.restaurantId,
                      )
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name} · {departmentNames[e.department]}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              <span className="hidden rounded-full bg-[#eff3e7] px-3 py-2 text-[10px] text-[#65735a] xl:block">
                29 сентября · 16:00
              </span>
            </div>
          </div>
        </header>
        <main
          id="main-content"
          className="mx-auto max-w-[1600px] px-4 pb-14 pt-6 sm:px-8 xl:px-10"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
            <span>
              Рабочее пространство <span className="mx-2">/</span>
              {nav.find((n) => n.id === section)!.title}
            </span>
            <span className="rounded-full border border-[#e5d8bf] bg-[#faf3e6] px-2.5 py-1 text-[#8d7147]">
              Демо-данные · изменения только в браузере
            </span>
          </div>
          <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[27px] font-semibold leading-tight tracking-[-.9px] sm:text-[32px]">
                {title}
              </h1>
              <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
                {descriptions[section]}
              </p>
            </div>
            {manager && ["dashboard", "tasks"].includes(section) && (
              <Button onClick={() => setEditing(null)}>
                <Plus size={16} />
                Новая задача
              </Button>
            )}
          </div>
          {!allowed.includes(section) ? (
            <Panel>
              <div className="mx-auto max-w-md py-9 text-center">
                <ShieldCheck size={35} className="mx-auto text-[#789165]" />
                <h2 className="mt-4 text-xl font-semibold">
                  Раздел недоступен для этой роли
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {roleNames[ctx.actor.role]} видит только инструменты своей
                  работы. Переключение ролей доступно здесь для знакомства с
                  демо.
                </p>
                <Button asChild className="mt-5">
                  <Link href="/demo">К моей работе</Link>
                </Button>
              </div>
            </Panel>
          ) : (
            <>
              {section === "dashboard" && (
                <Dashboard ctx={ctx} onOpen={(t) => setDetail(t.id)} />
              )}
              {section === "departments" && <Departments ctx={ctx} />}
              {section === "tasks" && (
                <Tasks
                  ctx={ctx}
                  onOpen={(t) => setDetail(t.id)}
                  onNew={() => setEditing(null)}
                />
              )}
              {section === "checklists" && <Checklists ctx={ctx} />}
              {section === "orders" && <Orders ctx={ctx} />}
              {section === "finance" && <Finance ctx={ctx} />}
              {section === "invoices" && <Invoices ctx={ctx} />}
              {section === "team" && <Team ctx={ctx} />}
              {section === "integrations" && <Integrations ctx={ctx} />}
              {section === "menu" && <Knowledge kind="menu" ctx={ctx} />}
              {section === "training" && (
                <Knowledge kind="training" ctx={ctx} />
              )}
              {section === "assistant" && <Assistant ctx={ctx} />}
              {section === "settings" && <Settings />}
            </>
          )}
          <footer className="mt-10 flex flex-wrap justify-between gap-2 border-t pt-5 text-[10px] text-muted-foreground">
            <span>ShiftOS · Пространство для сильной команды</span>
            <span>
              Демо-сценарий 29.09.2026 · реальные кассы и AI не подключены
            </span>
          </footer>
        </main>
      </div>
      {ctx.message && (
        <div
          role={ctx.error ? "alert" : "status"}
          className={cn(
            "fixed bottom-4 left-4 right-4 z-[100] mx-auto flex max-w-xl items-start gap-4 rounded-xl border p-4 text-xs shadow-lg",
            ctx.error
              ? "border-[#e4b9ab] bg-[#fff1eb] text-[#9a3c29]"
              : "border-[#bdcbaa] bg-[#f3f8e9] text-[#36552b]",
          )}
        >
          <span className="flex-1 leading-relaxed">{ctx.message}</span>
          <button
            aria-label="Закрыть уведомление"
            onClick={ctx.dismiss}
            className="shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {manager && editing !== undefined && (
        <TaskEditor
          ctx={ctx}
          task={editing}
          close={() => setEditing(undefined)}
        />
      )}{" "}
      {detail && (
        <TaskDetail
          ctx={ctx}
          id={detail}
          close={() => setDetail(null)}
          edit={(task) => {
            setDetail(null);
            setEditing(task);
          }}
        />
      )}
    </div>
  );
}
function Dashboard({
  ctx,
  onOpen,
}: {
  ctx: DemoContext;
  onOpen: (task: OperationTask) => void;
}) {
  const tasks = visibleTasks(ctx.state, ctx.actor);
  const active = tasks.filter((t) => t.status !== "done");
  const review = active.filter((t) => t.status === "review");
  const overdue = active.filter(isOverdue);
  const employee = employeeFor(ctx.state, ctx.actor);
  const manager = canManage(ctx.actor);
  const report = financials(
    ctx.state,
    ctx.state.restaurantId,
    demoDate,
    demoDate,
  );
  const areas = ctx.state.areas.filter(
    (a) =>
      a.restaurantId === ctx.state.restaurantId &&
      (manager || a.department === employee?.department),
  );
  const openOrders = ctx.state.orders.filter(
    (o) =>
      o.restaurantId === ctx.state.restaurantId &&
      !["closed", "cancelled"].includes(o.status),
  );
  return (
    <div className="space-y-6">
      {!manager && <NextActions ctx={ctx} onOpen={onOpen} />}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ctx.actor.role === "owner" ? (
          <>
            <Metric
              label="Выручка сегодня"
              value={rubles(report.revenue)}
              hint={`${report.count} закрытых заказов`}
              dark
            />
            <Metric
              label="Опер. результат"
              value={rubles(report.profit)}
              hint={`Рентабельность ${report.margin.toFixed(1)}%`}
              negative={report.profit < 0}
            />
          </>
        ) : (
          <>
            <Metric
              label={manager ? "Задачи смены" : "Мои открытые задачи"}
              value={active.length}
              hint={
                manager ? "Кухня, бар и зал" : (employee?.name ?? "Сотрудник")
              }
              dark
            />
            <Metric
              label="Готово"
              value={tasks.filter((t) => t.status === "done").length}
              hint="Результат подтверждён"
            />
          </>
        )}
        <Metric
          label="Требуют внимания"
          value={overdue.length + review.length}
          hint={`${overdue.length} просрочено · ${review.length} на проверке`}
        />
        <Metric
          label="В очереди заказов"
          value={openOrders.length}
          hint="Общая очередь заведения"
        />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[1.65fr_1fr]">
        <Panel
          title={manager ? "Пульс участков" : "Мой участок"}
          description="Готовность к смене и текущая нагрузка"
          action={
            manager && (
              <Link
                href="/demo/departments"
                className="text-xs font-medium text-[#6d805b]"
              >
                Настроить участки ↗
              </Link>
            )
          }
        >
          <div className={cn("grid gap-3", manager && "md:grid-cols-3")}>
            {areas.map((a) => {
              const Icon = areaIcons[a.department];
              const list = ctx.state.checklists.find(
                (c) =>
                  c.restaurantId === a.restaurantId &&
                  c.department === a.department,
              )!;
              const count = list.items.filter((i) => i.done).length;
              const local = ctx.state.tasks.filter(
                (t) =>
                  t.restaurantId === a.restaurantId &&
                  t.department === a.department &&
                  t.status !== "done",
              );
              return (
                <Link
                  href={manager ? "/demo/departments" : "/demo/checklists"}
                  key={a.department}
                  className="rounded-xl border bg-[#fafbf7] p-4 transition hover:border-[#a4b58e]"
                >
                  <div className="flex items-center justify-between">
                    <Icon size={21} strokeWidth={1.6} />
                    <Pill
                      tone={count === list.items.length ? "green" : "orange"}
                    >
                      {count}/{list.items.length}
                    </Pill>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    {departmentNames[a.department]}
                  </h3>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {ctx.state.employees.find((e) => e.id === a.leadId)?.name}
                  </p>
                  <div className="my-4">
                    <Progress value={(count / list.items.length) * 100} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {local.length} задач в работе{" "}
                    <ArrowRight size={12} className="ml-1 inline" />
                  </p>
                </Link>
              );
            })}
          </div>
        </Panel>
        <section className="rounded-2xl border border-[#d6dec5] bg-[#eaf0dc] p-6">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#6d8454]">
            <Sparkles size={16} />
            Фокус смены
          </div>
          <h2 className="mt-5 text-xl font-semibold leading-snug">
            {review.length > 0 && manager
              ? "Команда ждёт обратной связи"
              : overdue.length
                ? "Начните с просроченных задач"
                : "Держим темп вместе"}
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-[#6b785f]">
            {manager
              ? `Проверьте ${review.length} результата и распределите ${active.filter((t) => !t.assigneeId).length} свободные задачи. Каждый сотрудник увидит свой следующий шаг.`
              : `Ваш участок — ${employee ? departmentNames[employee.department].toLowerCase() : "не выбран"}. Выполните задачи, отметьте чек-лист и передайте результат администратору.`}
          </p>
          <Button
            variant="outline"
            asChild
            className="mt-6 border-[#c6d2b2] bg-white/60"
          >
            <Link href="/demo/tasks">
              {manager ? "К задачам смены" : "Мои задачи"}
              <ArrowRight size={14} />
            </Link>
          </Button>
        </section>
      </div>
      {manager && (
        <Panel
          title="Что мешает смене"
          description="Конкретные отклонения, их источник и ответственный. Подсказки обновляются после ваших действий."
        >
          <Problems ctx={ctx} limit={3} />
        </Panel>
      )}
      {manager && <NextActions ctx={ctx} onOpen={onOpen} />}
      {ctx.actor.role === "owner" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/demo/finance"
            className="flex items-center justify-between rounded-2xl border bg-white p-5"
          >
            <div>
              <h2 className="text-sm font-semibold">Что осталось бизнесу</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Прибыль, расходы и сравнение заведений
              </p>
            </div>
            <ChartNoAxesCombined size={24} className="text-[#7c9464]" />
          </Link>
          <Link
            href="/demo/integrations"
            className="flex items-center justify-between rounded-2xl border bg-white p-5"
          >
            <div>
              <h2 className="text-sm font-semibold">
                Вся сеть в одной системе
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Настройки iiko и r_keeper
              </p>
            </div>
            <Plug size={24} className="text-[#7c9464]" />
          </Link>
        </div>
      )}
    </div>
  );
}
function NextActions({
  ctx,
  onOpen,
}: {
  ctx: DemoContext;
  onOpen: (task: OperationTask) => void;
}) {
  const active = visibleTasks(ctx.state, ctx.actor).filter(
    (t) => t.status !== "done",
  );
  return (
    <Panel
      title={
        canManage(ctx.actor)
          ? "Ближайшие действия"
          : "Мои задачи и очередь участка"
      }
      description="Сначала приоритетные задачи и незавершённая работа"
      action={
        <Link href="/demo/tasks" className="text-xs font-medium text-[#6d805b]">
          Все задачи ↗
        </Link>
      }
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {[...active]
          .sort(
            (a, b) =>
              Number(b.priority === "high") - Number(a.priority === "high") ||
              a.dueAt.localeCompare(b.dueAt),
          )
          .slice(0, 4)
          .map((task) => (
            <TaskRow key={task.id} task={task} ctx={ctx} onOpen={onOpen} />
          ))}
      </div>
      {!active.length && (
        <Empty
          title="Отличная работа"
          text="Открытых задач пока нет. Проверьте чек-лист участка."
        />
      )}
    </Panel>
  );
}
function Knowledge({
  kind,
  ctx,
}: {
  kind: "menu" | "training";
  ctx: DemoContext;
}) {
  const [query, setQuery] = useState("");
  const [lesson, setLesson] = useState<
    (typeof demoWorkspace.training)[number] | null
  >(null);
  return (
    <div className="space-y-5">
      <input
        aria-label={kind === "menu" ? "Поиск по меню" : "Поиск обучения"}
        className={`${fieldClass} max-w-lg`}
        placeholder={
          kind === "menu"
            ? "Название, состав или аллерген"
            : "Название материала"
        }
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kind === "menu"
          ? demoWorkspace.menu
              .filter((m) =>
                `${m.name} ${m.description} ${m.allergens.join(" ")}`
                  .toLocaleLowerCase("ru")
                  .includes(query.toLocaleLowerCase("ru")),
              )
              .map((m) => (
                <Panel key={m.id}>
                  <div className="flex justify-between">
                    <Pill>{m.category}</Pill>
                    <Pill tone={m.available ? "green" : "orange"}>
                      {m.available ? "Доступно" : "Стоп-лист"}
                    </Pill>
                  </div>
                  <h2 className="mt-5 text-lg font-semibold">{m.name}</h2>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {m.description}
                  </p>
                  <p className="mt-4 text-xs text-[#9d6846]">
                    Аллергены: {m.allergens.join(", ") || "уточните по ТТК"}
                  </p>
                  <p className="mt-5 border-t pt-4 text-lg font-semibold">
                    {rubles(m.price * 100)}
                  </p>
                </Panel>
              ))
          : demoWorkspace.training
              .filter(
                (l) =>
                  (canManage(ctx.actor) || l.status === "published") &&
                  l.title
                    .toLocaleLowerCase("ru")
                    .includes(query.toLocaleLowerCase("ru")),
              )
              .map((l) => (
                <Panel key={l.id}>
                  <div className="flex items-center justify-between">
                    <BookOpen size={25} className="text-[#809868]" />
                    <Pill tone={l.status === "published" ? "green" : "neutral"}>
                      {l.status === "published" ? "Для команды" : "Черновик"}
                    </Pill>
                  </div>
                  <h2 className="mt-5 text-lg font-semibold">{l.title}</h2>
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {l.content}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-5"
                    onClick={() => setLesson(l)}
                  >
                    Открыть материал
                    <ArrowRight size={14} />
                  </Button>
                </Panel>
              ))}
      </div>
      {lesson && (
        <Dialog open onOpenChange={(open) => !open && setLesson(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="leading-snug">{lesson.title}</DialogTitle>
              <DialogDescription>Материал базы знаний · демо</DialogDescription>
            </DialogHeader>
            <p className="text-sm leading-7">{lesson.content}</p>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
function Assistant({ ctx }: { ctx: DemoContext }) {
  return (
    <div className="space-y-5">
      <Panel
        title="Где смене нужна помощь"
        description="Правила проверяют заказы, готовность участков и приёмку. Внешняя AI-модель не подключена."
      >
        <Problems ctx={ctx} />
      </Panel>
    </div>
  );
}
function Settings() {
  const ctx = useDemo();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="space-y-5">
      <Panel
        title="Кому что доступно"
        description="В демо роль выбирается сверху. В рабочем приложении её задаёт членство в организации."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            [
              "Сотрудник",
              "Свои задачи и очередь участка",
              "Чек-листы своего участка",
              "Приготовление или выдача заказов",
              "Меню и опубликованное обучение",
            ],
            [
              "Администратор",
              "Задачи всех участков и проверка",
              "Настройка участков и команды",
              "Заказы и приёмка накладных",
              "Без прибыли и ключей интеграций",
            ],
            [
              "Владелец",
              "Все операционные инструменты",
              "Выручка, расходы, прибыль и убытки",
              "Оплата накладных и отчёты сети",
              "Подключения iiko и r_keeper",
            ],
          ].map(([title, ...lines]) => (
            <div key={title} className="rounded-xl border p-5">
              <ShieldCheck size={22} className="text-[#7c9368]" />
              <h2 className="mt-4 text-lg font-semibold">{title}</h2>
              <ul className="mt-4 space-y-3 text-xs leading-relaxed text-muted-foreground">
                {lines.map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>
      <Panel
        title="Демонстрационный сценарий"
        description="Вымышленные заведения и данные. Все изменения хранятся в этом браузере."
      >
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Смена зафиксирована на 29 сентября 2026, 16:00. Это позволяет
          проверять просрочки и сравнивать финансовый результат на одинаковых
          данных. Переключение ролей демонстрирует поведение интерфейса; защита
          реальных данных использует серверную сессию и RLS.
        </p>
        <Button
          variant="outline"
          className="mt-5"
          onClick={() => setConfirm(true)}
        >
          <RotateCcw size={15} />
          Сбросить демо-данные
        </Button>
      </Panel>
      {confirm && (
        <Dialog open onOpenChange={setConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Восстановить исходное демо?</DialogTitle>
              <DialogDescription>
                Добавленные задачи, сотрудники, расходы и настройки в этом
                браузере будут заменены исходным сценарием.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  ctx.reset();
                  setConfirm(false);
                }}
              >
                Восстановить демо
              </Button>
              <Button variant="outline" onClick={() => setConfirm(false)}>
                Отмена
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
