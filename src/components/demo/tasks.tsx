"use client";
import { useState } from "react";
import {
  Clock3,
  UserRound,
  Pencil,
  ArrowRight,
  Plus,
  WandSparkles,
  List,
  Columns3,
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
  type Department,
  type OperationTask,
  departments,
  departmentNames,
  taskStatuses,
  statusNames,
  demoDate,
} from "@/modules/operations/types";
import {
  canManage,
  visibleTasks,
  isOverdue,
  saveTask,
  transitionTask,
  distributeTasks,
} from "@/modules/operations/logic";
import { taskTemplates } from "@/modules/operations/fixtures";
import {
  type DemoContext,
  Panel,
  Pill,
  Empty,
  Field,
  fieldClass,
} from "./common";
import { cn } from "@/lib/utils";

export function TaskRow({
  task,
  ctx,
  onOpen,
}: {
  task: OperationTask;
  ctx: DemoContext;
  onOpen: (task: OperationTask) => void;
}) {
  const person = ctx.state.employees.find((e) => e.id === task.assigneeId);
  return (
    <button
      onClick={() => onOpen(task)}
      aria-label={`Открыть задачу: ${task.title}`}
      className="w-full rounded-xl border bg-white p-4 text-left transition hover:border-[#a1b28d] hover:shadow-sm"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Pill>{departmentNames[task.department]}</Pill>
        {task.priority === "high" && <Pill tone="orange">Приоритет</Pill>}
      </div>
      <p
        className={cn(
          "text-sm font-semibold leading-relaxed",
          task.status === "done" && "text-muted-foreground",
        )}
      >
        {task.title}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <UserRound size={13} />
          {person?.name ?? "Без исполнителя"}
        </span>
        <span
          className={cn(
            "flex items-center gap-1",
            isOverdue(task) && "font-semibold text-[#b64a30]",
          )}
        >
          <Clock3 size={12} />
          {task.dueAt.slice(8, 10)}.{task.dueAt.slice(5, 7)} ·{" "}
          {task.dueAt.slice(11)}
          {isOverdue(task) ? " · просрочено" : ""}
        </span>
      </div>
    </button>
  );
}
export function Tasks({
  ctx,
  onOpen,
  onNew,
}: {
  ctx: DemoContext;
  onOpen: (task: OperationTask) => void;
  onNew: () => void;
}) {
  const [department, setDepartment] = useState("all");
  const [person, setPerson] = useState("all");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<"board" | "list">("board");
  const manager = canManage(ctx.actor);
  const tasks = visibleTasks(ctx.state, ctx.actor).filter(
    (t) =>
      (department === "all" || t.department === department) &&
      (person === "all" || t.assigneeId === person) &&
      t.title.toLocaleLowerCase("ru").includes(query.toLocaleLowerCase("ru")) &&
      (filter === "all" ||
        (filter === "overdue" && isOverdue(t)) ||
        (filter === "unassigned" && !t.assigneeId) ||
        filter === t.status),
  );
  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex flex-wrap justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              ["all", "Все задачи"],
              ["overdue", "Просроченные"],
              ["unassigned", "Без исполнителя"],
              ["review", "На проверке"],
            ].map(([id, label]) => (
              <Button
                key={id}
                variant={filter === id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter(id)}
              >
                {label}
              </Button>
            ))}
          </div>
          {manager && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                ctx.apply(
                  (s) => distributeTasks(s, ctx.actor),
                  "Задачи распределены по участкам с учётом нагрузки.",
                )
              }
            >
              <WandSparkles size={15} />
              Распределить свободные
            </Button>
          )}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_220px_auto]">
          <input
            className={fieldClass}
            placeholder="Название задачи…"
            aria-label="Поиск задач"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className={fieldClass}
            aria-label="Фильтр участка"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="all">Все участки</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {departmentNames[d]}
              </option>
            ))}
          </select>
          <select
            className={fieldClass}
            aria-label="Фильтр исполнителя"
            value={person}
            onChange={(e) => setPerson(e.target.value)}
          >
            <option value="all">Все исполнители</option>
            <option value="">Не назначен</option>
            {ctx.state.employees
              .filter((e) => e.restaurantId === ctx.state.restaurantId)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
          </select>
          <div className="flex gap-1">
            <Button
              variant={view === "board" ? "secondary" : "ghost"}
              size="icon"
              aria-label="Доска задач"
              onClick={() => setView("board")}
            >
              <Columns3 size={17} />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              aria-label="Список задач"
              onClick={() => setView("list")}
            >
              <List size={17} />
            </Button>
          </div>
        </div>
      </Panel>
      {tasks.length === 0 ? (
        <Empty
          title="Задачи не найдены"
          text="Измените фильтры или добавьте задачу для выбранного участка."
        />
      ) : view === "board" ? (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          {taskStatuses.map((status) => (
            <section
              key={status}
              aria-label={statusNames[status]}
              className="rounded-2xl bg-[#edf0e7] p-3"
            >
              <div className="mb-3 flex items-center justify-between px-1 py-1">
                <h2 className="text-xs font-semibold">{statusNames[status]}</h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs">
                  {tasks.filter((t) => t.status === status).length}
                </span>
              </div>
              <div className="space-y-3">
                {tasks
                  .filter((t) => t.status === status)
                  .map((t) => (
                    <TaskRow key={t.id} task={t} ctx={ctx} onOpen={onOpen} />
                  ))}
                {!tasks.some((t) => t.status === status) && (
                  <p className="py-7 text-center text-xs text-muted-foreground">
                    Нет задач
                  </p>
                )}
                {status === "todo" && manager && (
                  <Button variant="ghost" className="w-full" onClick={onNew}>
                    <Plus size={14} />
                    Добавить
                  </Button>
                )}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {tasks.map((t) => (
            <div key={t.id}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {statusNames[t.status]}
              </p>
              <TaskRow task={t} ctx={ctx} onOpen={onOpen} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export function TaskEditor({
  ctx,
  task,
  close,
}: {
  ctx: DemoContext;
  task: OperationTask | null;
  close: () => void;
}) {
  const [department, setDepartment] = useState<Department>(
    task?.department ?? "kitchen",
  );
  const [assignee, setAssignee] = useState(task?.assigneeId ?? "");
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [error, setError] = useState("");
  function submit(form: FormData) {
    if (!title.trim()) {
      setError("Укажите название задачи.");
      return;
    }
    const value: OperationTask = {
      id: task?.id ?? crypto.randomUUID(),
      restaurantId: ctx.state.restaurantId,
      title,
      description,
      department,
      assigneeId: assignee,
      dueAt: String(form.get("due")),
      priority: form.get("priority") === "high" ? "high" : "normal",
      status: task?.status ?? "todo",
      note: task?.note ?? "",
      templateKey: task?.templateKey,
    };
    if (
      ctx.apply(
        (s) => saveTask(s, ctx.actor, value),
        task ? "Задача обновлена." : "Задача добавлена.",
      )
    )
      close();
  }
  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {task ? "Редактировать задачу" : "Новая задача"}
          </DialogTitle>
          <DialogDescription>
            Участок → исполнитель → срок. Сотрудник передаёт результат на
            проверку.
          </DialogDescription>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          {!task && (
            <Field label="Быстрый шаблон" htmlFor="template">
              <select
                id="template"
                className={fieldClass}
                defaultValue=""
                onChange={(e) => {
                  const t = taskTemplates.find((t) => t.id === e.target.value);
                  if (t) {
                    setTitle(t.title);
                    setDescription(t.description);
                    setDepartment(t.department);
                    setAssignee("");
                  }
                }}
              >
                <option value="">Своя задача</option>
                {taskTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Что нужно сделать?" htmlFor="task-title">
            <input
              id="task-title"
              className={fieldClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              autoFocus
              placeholder="Например, проверить поставку"
            />
          </Field>
          <Field
            label="Инструкция и критерий готовности"
            htmlFor="task-description"
          >
            <textarea
              id="task-description"
              className={`${fieldClass} h-24 py-3`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              placeholder="Что проверить и какой результат передать"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Участок задачи" htmlFor="task-department">
              <select
                id="task-department"
                className={fieldClass}
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value as Department);
                  setAssignee("");
                }}
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {departmentNames[d]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Исполнитель" htmlFor="task-assignee">
              <select
                id="task-assignee"
                className={fieldClass}
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              >
                <option value="">Очередь участка</option>
                {ctx.state.employees
                  .filter(
                    (e) =>
                      e.active &&
                      e.restaurantId === ctx.state.restaurantId &&
                      e.department === department,
                  )
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Срок выполнения" htmlFor="task-due">
              <input
                type="datetime-local"
                name="due"
                id="task-due"
                className={fieldClass}
                defaultValue={task?.dueAt ?? `${demoDate}T18:00`}
                required
              />
            </Field>
            <Field label="Приоритет" htmlFor="task-priority">
              <select
                name="priority"
                id="task-priority"
                className={fieldClass}
                defaultValue={task?.priority ?? "normal"}
              >
                <option value="normal">Обычный</option>
                <option value="high">Высокий</option>
              </select>
            </Field>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full">
            {task ? "Сохранить задачу" : "Создать задачу"}
            <ArrowRight size={15} />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function TaskDetail({
  ctx,
  id,
  close,
  edit,
}: {
  ctx: DemoContext;
  id: string;
  close: () => void;
  edit: (task: OperationTask) => void;
}) {
  const task = visibleTasks(ctx.state, ctx.actor).find((t) => t.id === id);
  const [note, setNote] = useState(task?.note ?? "");
  const [error, setError] = useState("");
  if (!task) return null;
  const manager = canManage(ctx.actor);
  function change(status: OperationTask["status"]) {
    if (status === "review" && !note.trim()) {
      setError("Добавьте результат работы.");
      return;
    }
    if (
      ctx.apply(
        (s) => transitionTask(s, ctx.actor, id, status, note),
        "Статус задачи обновлён.",
      )
    )
      close();
  }
  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-5 leading-snug">{task.title}</DialogTitle>
          <DialogDescription>
            {departmentNames[task.department]} · {statusNames[task.status]}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          <Pill tone={isOverdue(task) ? "red" : "neutral"}>
            Срок: {task.dueAt.replace("T", " ")}
          </Pill>
          <Pill>
            {ctx.state.employees.find((e) => e.id === task.assigneeId)?.name ??
              "Очередь участка"}
          </Pill>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {task.description || "Дополнительных инструкций нет."}
        </p>
        <Field label="Результат работы / комментарий" htmlFor="task-note">
          <textarea
            id="task-note"
            className={`${fieldClass} h-24 py-3`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            readOnly={
              task.status === "done" || (!manager && task.status === "review")
            }
            placeholder="Что сделано, есть ли отклонения"
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {task.status === "todo" && (
            <Button onClick={() => change("in_progress")}>
              {task.assigneeId || manager ? "Начать работу" : "Взять себе"}
            </Button>
          )}
          {task.status === "in_progress" && (
            <Button onClick={() => change("review")}>
              Передать на проверку
            </Button>
          )}
          {manager && task.status === "review" && (
            <>
              <Button onClick={() => change("done")}>Принять результат</Button>
              <Button variant="outline" onClick={() => change("in_progress")}>
                На доработку
              </Button>
            </>
          )}
          {manager && ["todo", "in_progress"].includes(task.status) && (
            <Button variant="outline" onClick={() => change("done")}>
              Завершить задачу
            </Button>
          )}
          {manager && task.status === "done" && (
            <Button variant="outline" onClick={() => change("todo")}>
              Вернуть в работу
            </Button>
          )}
          {manager && (
            <Button variant="ghost" onClick={() => edit(task)}>
              <Pencil size={14} />
              Редактировать
            </Button>
          )}
        </div>
        {!manager && task.status === "review" && (
          <p className="text-xs text-muted-foreground">
            Результат проверяет администратор или владелец.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
