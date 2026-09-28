"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Plus,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Users,
  ClipboardCheck,
  ListTodo,
  Sparkles,
  ChevronRight,
  Search,
  X,
  BookOpen,
  Circle,
  CheckCircle2,
  Store,
  ShieldCheck,
  Database,
  SlidersHorizontal,
  RotateCcw,
  Coffee,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar, navigation } from "./navigation";
import { cn } from "@/lib/utils";
import type {
  WorkspaceData,
  Section,
  Task,
  Checklist,
} from "@/modules/workspace/types";
import { createTask, updateTaskStatus } from "@/modules/tasks/actions";

const storageKey = "shiftos-demo-v1";
export function Workspace({
  data,
  section,
}: {
  data: WorkspaceData;
  section: Section;
}) {
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState(
    data.restaurants[0]?.id ?? "",
  );
  const [tasks, setTasks] = useState(data.tasks);
  const [checklists, setChecklists] = useState(data.checklists);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [lesson, setLesson] = useState<
    WorkspaceData["training"][number] | null
  >(null);
  const isDemo = data.mode === "demo";
  const base = isDemo ? "/demo" : `/workspace/${data.organizationId}`;
  const restaurant = data.restaurants.find((r) => r.id === restaurantId);
  const localTasks = tasks.filter((t) => t.restaurantId === restaurantId);
  const localChecklists = checklists.filter(
    (c) => c.restaurantId === restaurantId,
  );
  const people = data.employees.filter((e) => e.restaurantId === restaurantId);
  const open = localTasks.filter((t) => t.status !== "done");
  const done = localTasks.filter((t) => t.status === "done").length;
  const urgent = open.filter((t) => t.priority === "high").length;
  const currentTitle = navigation.find((n) => n.id === section)!.title;
  const listedTasks = localTasks.filter(
    (t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "all" ||
        (filter === "done" ? t.status === "done" : t.status !== "done")),
  );

  /* eslint-disable react-hooks/set-state-in-effect -- Restore browser-only demo storage after SSR hydration. Live data never uses this effect. */
  useEffect(() => {
    if (!isDemo) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        // Only restore demo UI state; never reuse it as a source for live requests.
        if (
          Array.isArray(saved.tasks) &&
          saved.tasks.every(
            (t: Task) =>
              typeof t.id === "string" &&
              typeof t.title === "string" &&
              ["todo", "done", "in_progress"].includes(t.status),
          )
        )
          setTasks(saved.tasks);
        if (
          Array.isArray(saved.checklists) &&
          saved.checklists.every((c: Checklist) => Array.isArray(c.items))
        )
          setChecklists(saved.checklists);
        if (data.restaurants.some((r) => r.id === saved.restaurantId))
          setRestaurantId(saved.restaurantId);
      }
    } catch {
      /* Private browsing or stale demo data: fall back to fixtures. */
    }
    setReady(true);
  }, [data.restaurants, isDemo]);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isDemo && ready) {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ tasks, checklists, restaurantId }),
        );
      } catch {
        /* Demo also works without storage. */
      }
    }
  }, [tasks, checklists, restaurantId, isDemo, ready]);

  function toggleTask(task: Task) {
    if (!data.canWriteTasks) return;
    const status = task.status === "done" ? "todo" : "done";
    if (isDemo) {
      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status } : t)));
      return;
    }
    startTransition(async () => {
      const result = await updateTaskStatus(
        data.organizationId,
        task.id,
        status,
      );
      if (result.error) setMessage(result.error);
      else {
        setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status } : t)));
        router.refresh();
      }
    });
  }
  function addTask(form: FormData) {
    const title = String(form.get("title") ?? "").trim();
    const priority = form.get("priority") === "high" ? "high" : "normal";
    if (!title || !restaurantId) return;
    startTransition(async () => {
      const result = isDemo
        ? { id: crypto.randomUUID() }
        : await createTask({
            organizationId: data.organizationId,
            restaurantId,
            title,
            priority,
          });
      if ("error" in result) {
        setMessage(result.error ?? "Не удалось создать задачу");
        return;
      }
      setTasks([
        {
          id: result.id,
          restaurantId,
          title,
          priority,
          status: "todo",
          assignee: "Не назначен",
          due: "Без срока",
        },
        ...tasks,
      ]);
      setNewTaskOpen(false);
      setMessage(
        isDemo ? "Задача добавлена в демо-пространство." : "Задача сохранена.",
      );
      if (!isDemo) router.refresh();
    });
  }
  function toggleChecklist(checklistId: string, itemId: string) {
    if (!isDemo) return;
    setChecklists(
      checklists.map((c) =>
        c.id === checklistId
          ? {
              ...c,
              items: c.items.map((i) =>
                i.id === itemId ? { ...i, done: !i.done } : i,
              ),
            }
          : c,
      ),
    );
  }
  function taskList(items: Task[]) {
    return items.length ? (
      <div className="divide-y divide-border/70">
        {items.map((task) => (
          <div key={task.id} className="group flex items-center gap-3 py-4">
            <button
              disabled={pending || !data.canWriteTasks}
              aria-label={`${task.status === "done" ? "Вернуть" : "Выполнить"}: ${task.title}`}
              onClick={() => toggleTask(task)}
              className={cn(
                "grid size-[21px] shrink-0 place-items-center rounded-md border transition-colors disabled:cursor-not-allowed",
                task.status === "done"
                  ? "border-[#65815d] bg-[#65815d] text-white"
                  : "border-[#cfd5c7] hover:border-primary",
              )}
            >
              {task.status === "done" && <Check size={14} />}
            </button>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-[13px] font-medium leading-relaxed",
                  task.status === "done" &&
                    "text-muted-foreground line-through",
                )}
              >
                {task.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span>{task.assignee}</span>
                <span className="flex items-center gap-1">
                  <Clock3 size={11} />
                  {task.due}
                </span>
                {task.status === "in_progress" && (
                  <span className="text-[#5d7352]">В работе</span>
                )}
              </div>
            </div>
            {task.priority === "high" && task.status !== "done" && (
              <span className="rounded bg-[#fff0e8] px-2 py-1 text-[10px] font-medium text-[#b85635]">
                Приоритет
              </span>
            )}
          </div>
        ))}
      </div>
    ) : (
      <Empty
        title="Задач пока нет"
        text="Добавьте первую задачу для этого заведения."
      />
    );
  }

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only fixed z-50 bg-white p-4 focus:not-sr-only"
      >
        Перейти к содержимому
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[238px] lg:block">
        <Sidebar
          section={section}
          base={base}
          organization={data.organizationName}
          mode={data.mode}
        />
      </aside>
      <div className="lg:pl-[238px]">
        <header className="flex h-[82px] items-center justify-between gap-3 border-b border-border bg-white px-4 sm:px-8 xl:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Открыть меню"
                >
                  <Menu size={21} />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[280px] gap-0 border-none p-0"
              >
                <SheetTitle className="sr-only">Навигация ShiftOS</SheetTitle>
                <SheetDescription className="sr-only">
                  Разделы рабочего пространства
                </SheetDescription>
                <Sidebar
                  section={section}
                  base={base}
                  organization={data.organizationName}
                  mode={data.mode}
                  onNavigate={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>
            <span className="hidden size-9 shrink-0 place-items-center rounded-lg border bg-[#f8f9f5] sm:grid">
              <Store size={17} />
            </span>
            <div className="min-w-0">
              <label htmlFor="restaurant" className="sr-only">
                Выберите заведение
              </label>
              <select
                id="restaurant"
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                className="max-w-[185px] cursor-pointer bg-transparent text-[13px] font-semibold focus:outline-primary sm:max-w-none"
              >
                {data.restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                {restaurant?.address || "Ваше заведение"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden items-center gap-2 text-[11px] text-muted-foreground sm:flex">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  isDemo ? "bg-[#bf8b4b]" : "bg-[#65815d]",
                )}
              />
              {isDemo ? "Демонстрационный режим" : "Рабочее пространство"}
            </span>
            <Link
              href={isDemo ? "/login" : "/workspace"}
              aria-label={isDemo ? "Войти в аккаунт" : "Мои организации"}
              className="grid size-9 place-items-center rounded-full border border-[#d8dfcb] bg-[#edf1e5] text-[11px] font-semibold"
            >
              {isDemo ? "АС" : "РП"}
            </Link>
          </div>
        </header>

        <main
          id="main-content"
          className="mx-auto max-w-[1540px] px-4 pb-10 pt-6 sm:px-8 sm:pt-8 xl:px-10"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span>
              Рабочее пространство <span className="mx-2 opacity-40">/</span>{" "}
              <span className="text-foreground">{currentTitle}</span>
            </span>
            <span className="rounded-full border border-[#e2d5be] bg-[#faf2e5] px-2.5 py-1 text-[10px] text-[#957544]">
              {isDemo
                ? "Демо-данные · изменения только в браузере"
                : "SPRINT 01"}
            </span>
          </div>
          <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[28px] font-semibold tracking-[-0.9px] sm:text-[32px]">
                {section === "dashboard"
                  ? "Хороший день начинается с порядка"
                  : currentTitle}
              </h1>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                {section === "dashboard"
                  ? "Всё, что важно для вашего заведения, — в одном месте."
                  : descriptions[section]}
              </p>
            </div>
            {(section === "dashboard" || section === "tasks") && (
              <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={!restaurantId || !data.canWriteTasks}
                    className="h-10 rounded-lg px-4 text-xs shadow-none"
                  >
                    <Plus size={16} />
                    Новая задача
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Новая задача</DialogTitle>
                    <DialogDescription>
                      {restaurant?.name} ·{" "}
                      {isDemo
                        ? "сохранится в этом браузере"
                        : "сохранится в вашей организации"}
                    </DialogDescription>
                  </DialogHeader>
                  <form action={addTask} className="space-y-4">
                    <div>
                      <label
                        htmlFor="task-title"
                        className="mb-2 block text-sm"
                      >
                        Что нужно сделать?
                      </label>
                      <Input
                        id="task-title"
                        name="title"
                        autoFocus
                        required
                        maxLength={200}
                        placeholder="Например, проверить поставку"
                      />
                    </div>
                    <div>
                      <label htmlFor="priority" className="mb-2 block text-sm">
                        Приоритет
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        className="h-10 w-full rounded-md border px-3 text-sm"
                      >
                        <option value="normal">Обычный</option>
                        <option value="high">Высокий</option>
                      </select>
                    </div>
                    <Button disabled={pending} type="submit" className="w-full">
                      {pending ? "Сохраняем…" : "Создать задачу"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          {message && (
            <div
              role="status"
              className="mb-5 flex items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3 text-sm"
            >
              {message}
              <button
                aria-label="Закрыть сообщение"
                onClick={() => setMessage("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {section === "dashboard" && (
            <>
              <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-5">
                <Metric
                  icon={ListTodo}
                  label="Задачи заведения"
                  value={`${done}/${localTasks.length}`}
                  note={
                    open.length
                      ? `${open.length} ещё в работе`
                      : "Все задачи завершены"
                  }
                  progress={
                    localTasks.length ? (done / localTasks.length) * 100 : 0
                  }
                />
                <Metric
                  icon={ClipboardCheck}
                  label={isDemo ? "Чек-листы" : "Шаблоны чек-листов"}
                  value={
                    isDemo
                      ? `${localChecklists.filter((c) => c.items.length && c.items.every((i) => i.done)).length}/${localChecklists.length}`
                      : String(localChecklists.length)
                  }
                  note={
                    isDemo
                      ? "Подготовка и стандарты"
                      : "Выполнение — следующий спринт"
                  }
                />
                <Metric
                  icon={Users}
                  label="Команда заведения"
                  value={String(people.filter((p) => p.active).length).padStart(
                    2,
                    "0",
                  )}
                  note="Активные сотрудники"
                />
                <Metric
                  icon={BookOpen}
                  label="База знаний"
                  value={String(
                    data.training.filter((t) => t.status === "published")
                      .length,
                  ).padStart(2, "0")}
                  note="Опубликованные материалы"
                />
              </div>
              <div className="mb-6 grid items-stretch gap-5 xl:grid-cols-[1.6fr_1fr]">
                <section className="relative overflow-hidden rounded-xl border border-[#d9e2ce] bg-[#eaf0df] p-5 sm:p-7">
                  <div className="relative z-10">
                    <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-[#56734e]">
                      <Sparkles size={15} />
                      Ваш фокус на сегодня
                      <span className="rounded border border-[#c5d3b5] px-1.5 py-0.5 text-[8px] tracking-wider">
                        {isDemo ? "DEMO" : "ОБЗОР"}
                      </span>
                    </div>
                    <h2 className="max-w-[380px] text-[22px] font-semibold leading-snug tracking-tight">
                      {urgent
                        ? `${urgent} ${urgent === 1 ? "задача требует" : "задачи требуют"} вашего внимания`
                        : "Есть время для главного"}
                    </h2>
                    <p className="mt-3 max-w-[380px] text-xs leading-6 text-[#64725a]">
                      {urgent
                        ? "Начните с задач высокого приоритета. Затем проверьте готовность зала и напомните команде о стандартах."
                        : "Проверьте задачи и подготовку заведения. Слаженная работа команды создаёт лучший опыт для гостей."}
                    </p>
                    <Link
                      href={`${base}/tasks`}
                      className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#355637]"
                    >
                      Перейти к задачам <ArrowRight size={14} />
                    </Link>
                  </div>
                  <div
                    aria-hidden="true"
                    className="absolute -bottom-8 -right-6 grid size-44 place-items-center rounded-full border-[28px] border-[#dce6cb]/65"
                  >
                    <Leaf
                      size={58}
                      className="rotate-[-25deg] text-[#afc39b]/55"
                    />
                  </div>
                </section>
                <section className="rounded-xl border bg-white p-5 sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Команда рядом</h2>
                    <Link href={`${base}/team`} aria-label="Открыть команду">
                      <ArrowUpRight
                        size={17}
                        className="text-muted-foreground"
                      />
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {people.length ? (
                      people.slice(0, 3).map((p, i) => (
                        <div key={p.id} className="flex items-center gap-3">
                          <Avatar initials={p.initials} index={i} />
                          <div>
                            <p className="text-xs font-medium">{p.name}</p>
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              {p.position}
                            </p>
                          </div>
                          <span
                            className="ml-auto size-1.5 rounded-full bg-[#95ad80]"
                            aria-label={
                              p.active ? "Активный сотрудник" : "Неактивен"
                            }
                          />
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Сотрудники ещё не добавлены.
                      </p>
                    )}
                  </div>
                  <p className="mt-5 border-t pt-3 text-[10px] text-muted-foreground">
                    Справочник команды · без учёта присутствия
                  </p>
                </section>
              </div>
              <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
                <section className="rounded-xl border bg-white px-5 py-5 sm:px-6">
                  <SectionHead
                    title="Задачи в фокусе"
                    subtitle="Маленькие действия. Большой результат."
                    href={`${base}/tasks`}
                  />
                  {taskList(
                    [
                      ...open,
                      ...localTasks.filter((t) => t.status === "done"),
                    ].slice(0, 4),
                  )}
                  <Link
                    href={`${base}/tasks`}
                    className="mt-2 flex items-center justify-center gap-2 border-t pt-4 text-xs text-muted-foreground"
                  >
                    Все задачи <ArrowRight size={13} />
                  </Link>
                </section>
                <section className="rounded-xl border bg-white p-5 sm:p-6">
                  <SectionHead
                    title="Стандарты под контролем"
                    subtitle={
                      isDemo
                        ? "Чек-листы вашего заведения"
                        : "Шаблоны для будущих смен"
                    }
                    href={`${base}/checklists`}
                  />
                  <div className="mt-5 space-y-5">
                    {localChecklists.length ? (
                      localChecklists.map((c) => (
                        <Link
                          href={`${base}/checklists`}
                          key={c.id}
                          className="block"
                        >
                          <div className="mb-2 flex justify-between gap-2 text-xs">
                            <span className="font-medium">{c.title}</span>
                            <span className="text-muted-foreground">
                              {isDemo
                                ? `${c.items.filter((i) => i.done).length}/${c.items.length}`
                                : `${c.items.length} пунктов`}
                            </span>
                          </div>
                          {isDemo && (
                            <div className="h-1.5 overflow-hidden rounded-full bg-[#edf0e7]">
                              <div
                                style={{
                                  width: `${c.items.length ? (c.items.filter((i) => i.done).length / c.items.length) * 100 : 0}%`,
                                }}
                                className="h-full rounded-full bg-[#8fa47c]"
                              />
                            </div>
                          )}
                        </Link>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Шаблонов пока нет.
                      </p>
                    )}
                  </div>
                  <div className="mt-6 flex items-center gap-2 rounded-lg bg-[#f7f8f3] p-3 text-[10px] leading-relaxed text-muted-foreground">
                    <ShieldCheck
                      size={16}
                      className="shrink-0 text-[#849673]"
                    />
                    Стабильный сервис начинается с привычек.
                  </div>
                </section>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[#d9decf] px-5 py-4">
                <div className="flex items-center gap-3">
                  <Coffee size={19} className="text-[#9ba58e]" />
                  <p className="text-xs text-muted-foreground">
                    Знания, которые помогают каждый день
                  </p>
                </div>
                <Link
                  href={`${base}/training`}
                  className="inline-flex items-center gap-2 text-xs font-medium"
                >
                  Открыть обучение <ArrowRight size={14} />
                </Link>
              </div>
            </>
          )}
          {section === "tasks" && (
            <section className="rounded-xl border bg-white p-5 sm:p-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-1 rounded-lg bg-muted p-1">
                  {[
                    ["all", "Все"],
                    ["open", "В работе"],
                    ["done", "Выполнены"],
                  ].map(([id, title]) => (
                    <button
                      key={id}
                      onClick={() => setFilter(id)}
                      className={cn(
                        "rounded-md px-3 py-2 text-xs",
                        filter === id && "bg-white shadow-sm",
                      )}
                    >
                      {title}
                    </button>
                  ))}
                </div>
                <div className="relative w-full sm:w-64">
                  <Search
                    size={15}
                    className="absolute left-3 top-3 text-muted-foreground"
                  />
                  <Input
                    aria-label="Поиск задач"
                    placeholder="Найти задачу…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              {taskList(listedTasks)}
            </section>
          )}
          {section === "checklists" && (
            <>
              <div className="mb-5 text-xs text-muted-foreground">
                {isDemo
                  ? "Нажмите на пункт, чтобы отметить выполнение. Изменения сохраняются в браузере."
                  : "Показаны шаблоны. Запуск и история выполнения смен будут добавлены в следующем спринте."}
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {localChecklists.map((c) => (
                  <section
                    key={c.id}
                    className="rounded-xl border bg-white p-5"
                  >
                    <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <ClipboardCheck size={14} />
                      {c.kind === "closing" ? "Закрытие" : "Подготовка"}
                    </div>
                    <h2 className="mb-5 font-semibold">{c.title}</h2>
                    <div className="space-y-4">
                      {c.items.map((item) => (
                        <button
                          key={item.id}
                          disabled={!isDemo}
                          onClick={() => toggleChecklist(c.id, item.id)}
                          className="flex w-full items-start gap-3 text-left text-xs leading-relaxed"
                        >
                          {item.done ? (
                            <CheckCircle2
                              size={18}
                              className="shrink-0 text-[#789367]"
                            />
                          ) : (
                            <Circle
                              size={18}
                              className="shrink-0 text-[#ccd4c3]"
                            />
                          )}
                          <span
                            className={item.done ? "text-muted-foreground" : ""}
                          >
                            {item.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              {!localChecklists.length && (
                <Empty
                  title="Чек-листов пока нет"
                  text="Здесь появятся стандарты открытия и закрытия заведения."
                />
              )}
            </>
          )}
          {section === "team" && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {people.map((p, i) => (
                <section
                  key={p.id}
                  className="flex items-center gap-4 rounded-xl border bg-white p-6"
                >
                  <Avatar initials={p.initials} index={i} />
                  <div>
                    <h2 className="text-sm font-semibold">{p.name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.position}
                    </p>
                    <Badge
                      variant="secondary"
                      className="mt-3 text-[10px] font-normal"
                    >
                      {p.active ? "Активный сотрудник" : "Неактивен"}
                    </Badge>
                  </div>
                </section>
              ))}
              {!people.length && (
                <Empty
                  title="Команда ещё не добавлена"
                  text="Приглашения сотрудников — следующий шаг разработки."
                />
              )}
            </div>
          )}
          {section === "menu" && (
            <>
              <div className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
                <UtensilsIcon />
                Общее меню организации · {data.menu.length} позиций
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {data.menu.map((item, index) => (
                  <section
                    key={item.id}
                    className="overflow-hidden rounded-xl border bg-white"
                  >
                    <div
                      className={cn(
                        "flex h-28 items-end justify-between p-5",
                        [
                          "bg-[#ebeedf]",
                          "bg-[#f0e8df]",
                          "bg-[#ede5de]",
                          "bg-[#e4ece7]",
                        ][index % 4],
                      )}
                    >
                      <span className="text-[10px] uppercase tracking-[.12em] text-[#6b745f]">
                        {item.category}
                      </span>
                      <Coffee
                        size={36}
                        strokeWidth={1}
                        className="text-[#83917a]/65"
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-sm font-semibold">{item.name}</h2>
                        <span className="whitespace-nowrap text-xs font-semibold">
                          {new Intl.NumberFormat("ru-RU", {
                            style: "currency",
                            currency: item.currency,
                            maximumFractionDigits: 0,
                          }).format(item.price)}
                        </span>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                      <p className="mt-4 text-[10px] text-muted-foreground">
                        Аллергены:{" "}
                        {item.allergens.length
                          ? item.allergens.join(", ")
                          : "уточните по ТТК"}
                      </p>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "mt-4 text-[10px] font-normal",
                          !item.available && "bg-[#fbebe2] text-[#a56444]",
                        )}
                      >
                        {item.available ? "В меню" : "Стоп-лист"}
                      </Badge>
                    </div>
                  </section>
                ))}
              </div>
              {!data.menu.length && (
                <Empty
                  title="Меню ещё не добавлено"
                  text="Здесь будут блюда, состав, аллергены и доступность."
                />
              )}
            </>
          )}
          {section === "training" && (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {data.training.map((t, i) => (
                <section
                  key={t.id}
                  className="flex flex-col rounded-xl border bg-white p-6"
                >
                  <span className="mb-7 text-3xl font-light text-[#aab59b]">
                    0{i + 1}
                  </span>
                  <Badge
                    variant="outline"
                    className="mb-3 w-fit text-[10px] font-normal"
                  >
                    {t.status === "published" ? "Опубликован" : "Черновик"}
                  </Badge>
                  <h2 className="mb-3 text-lg font-semibold">{t.title}</h2>
                  <p className="mb-6 line-clamp-3 text-xs leading-6 text-muted-foreground">
                    {t.content}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-auto text-xs"
                    onClick={() => setLesson(t)}
                  >
                    Открыть материал <ArrowRight size={14} />
                  </Button>
                </section>
              ))}
              {!data.training.length && (
                <Empty
                  title="База знаний пока пуста"
                  text="Здесь появятся стандарты, материалы и тесты команды."
                />
              )}
            </div>
          )}
          {section === "assistant" && (
            <section className="mx-auto max-w-3xl rounded-xl border bg-white p-6 sm:p-10">
              <span className="mb-6 grid size-12 place-items-center rounded-xl bg-[#eaf0df] text-[#617a50]">
                <Sparkles size={25} />
              </span>
              <Badge variant="outline" className="mb-4 text-[10px]">
                {isDemo
                  ? "Демонстрация · без языковой модели"
                  : "AI ещё не подключён"}
              </Badge>
              <h2 className="text-2xl font-semibold">
                Ваш помощник в ежедневных решениях
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Здесь появятся брифинги по заведению, ответы по стандартам и
                рекомендации по задачам. Основа уже подготовлена: отдельный AI
                gateway получает только данные выбранной организации.
              </p>
              <div className="my-6 rounded-xl bg-[#f5f7ef] p-5">
                <p className="mb-2 text-xs font-semibold">
                  Обзор по текущим задачам
                </p>
                <p className="text-sm leading-7">
                  Открытых задач: {open.length}. Высокий приоритет: {urgent}.{" "}
                  {urgent
                    ? "Начните с приоритетных задач и уточните ответственных."
                    : "Проверьте готовность заведения по чек-листам."}
                </p>
                <p className="mt-3 text-[10px] text-muted-foreground">
                  Автоматическая сводка по числам, без обращения к AI.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href={`${base}/tasks`}>
                  Открыть задачи <ArrowRight size={15} />
                </Link>
              </Button>
            </section>
          )}
          {section === "settings" && (
            <div className="grid gap-5 xl:grid-cols-2">
              <section className="rounded-xl border bg-white p-6">
                <h2 className="mb-5 flex items-center gap-2 font-semibold">
                  <SlidersHorizontal size={18} />
                  Рабочее пространство
                </h2>
                <dl className="space-y-4 text-sm">
                  <Setting label="Организация" value={data.organizationName} />
                  <Setting
                    label="Заведений"
                    value={String(data.restaurants.length)}
                  />
                  <Setting
                    label="Данные"
                    value={
                      isDemo ? "Демонстрационные" : "Supabase / PostgreSQL"
                    }
                  />
                  <Setting label="Версия" value="0.1.0 · первый спринт" />
                </dl>
                {isDemo && (
                  <Button
                    variant="outline"
                    className="mt-6 text-xs"
                    onClick={() => {
                      setTasks(data.tasks);
                      setChecklists(data.checklists);
                      setRestaurantId(data.restaurants[0]?.id ?? "");
                      setMessage("Демо-данные восстановлены.");
                    }}
                  >
                    <RotateCcw size={14} />
                    Сбросить демо-данные
                  </Button>
                )}
              </section>
              <section className="rounded-xl border bg-white p-6">
                <h2 className="mb-5 flex items-center gap-2 font-semibold">
                  <Database size={18} />
                  Подключения
                </h2>
                <dl className="space-y-4 text-sm">
                  <Setting
                    label="Supabase"
                    value={isDemo ? "Не используется в демо" : "Подключён"}
                  />
                  <Setting label="AI-провайдер" value="Не подключён" />
                  <Setting label="Камеры и vision" value="Будущий модуль" />
                </dl>
                <p className="mt-6 text-xs leading-6 text-muted-foreground">
                  Для работы с реальными данными настройте Supabase по
                  инструкции проекта и войдите в аккаунт.
                </p>
                <Button className="mt-4 text-xs" asChild>
                  <Link href={isDemo ? "/login" : "/workspace"}>
                    {isDemo ? "Открыть вход" : "Мои организации"}
                    <ArrowUpRight size={14} />
                  </Link>
                </Button>
              </section>
            </div>
          )}
          <footer className="mt-9 flex flex-wrap items-center justify-between gap-2 border-t pt-5 text-[10px] text-[#929a89]">
            <span>ShiftOS · Пространство для сильной команды</span>
            <span>Создано для гостеприимства</span>
          </footer>
        </main>
      </div>
      <Dialog
        open={!!lesson}
        onOpenChange={(open) => {
          if (!open) setLesson(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lesson?.title}</DialogTitle>
            <DialogDescription>Материал базы знаний</DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-7 text-muted-foreground">
            {lesson?.content}
          </p>
          <p className="border-t pt-4 text-xs text-muted-foreground">
            Прохождение тестов и сохранение прогресса — следующий спринт.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
  note,
  progress,
}: {
  icon: typeof ListTodo;
  label: string;
  value: string;
  note: string;
  progress?: number;
}) {
  return (
    <section className="relative rounded-xl border bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-1">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <Icon size={16} strokeWidth={1.6} className="shrink-0 text-[#9ba68f]" />
      </div>
      <p className="text-3xl font-medium tracking-tight">{value}</p>
      <p className="mt-2 text-[10px] text-muted-foreground">{note}</p>
      {progress !== undefined && (
        <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-transparent">
          <div
            style={{ width: `${progress}%` }}
            className="h-full bg-[#8fa47c]"
          />
        </div>
      )}
    </section>
  );
}
function Avatar({ initials, index }: { initials: string; index: number }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full text-[10px] font-medium",
        [
          "bg-[#ebe7dc] text-[#958158]",
          "bg-[#e5ebdf] text-[#738862]",
          "bg-[#f1e4dd] text-[#ae8065]",
          "bg-[#e3e9ed] text-[#6a8191]",
        ][index % 4],
      )}
    >
      {initials}
    </span>
  );
}
function SectionHead({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-2 text-[10px] text-muted-foreground">{subtitle}</p>
      </div>
      <Link href={href} aria-label={title}>
        <ChevronRight size={16} className="text-muted-foreground" />
      </Link>
    </div>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}
function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b pb-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-xs font-medium">{value}</dd>
    </div>
  );
}
function UtensilsIcon() {
  return <Coffee size={14} />;
}
const descriptions: Record<Section, string> = {
  dashboard: "",
  tasks: "Понятные приоритеты для слаженной работы.",
  checklists: "Единый стандарт. Каждая смена.",
  team: "Люди, которые создают атмосферу вашего заведения.",
  menu: "Блюда, состав и доступность в одной базе.",
  training: "Уверенная команда начинается со знаний.",
  assistant: "От данных к понятным действиям.",
  settings: "Ваше заведение, команда и подключения.",
};
