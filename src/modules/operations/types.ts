import { z } from "zod";

export const departments = ["kitchen", "bar", "floor"] as const;
export type Department = (typeof departments)[number];
export const departmentNames: Record<Department, string> = {
  kitchen: "Кухня",
  bar: "Бар",
  floor: "Зал",
};
export const roles = ["owner", "admin", "employee"] as const;
export type DemoRole = (typeof roles)[number];
export const roleNames: Record<DemoRole, string> = {
  owner: "Владелец",
  admin: "Администратор",
  employee: "Сотрудник",
};
export const demoSections = [
  "dashboard",
  "departments",
  "tasks",
  "checklists",
  "orders",
  "finance",
  "invoices",
  "team",
  "integrations",
  "menu",
  "training",
  "assistant",
  "settings",
] as const;
export type DemoSection = (typeof demoSections)[number];
export const taskStatuses = ["todo", "in_progress", "review", "done"] as const;
export const statusNames = {
  todo: "К выполнению",
  in_progress: "В работе",
  review: "На проверке",
  done: "Готово",
};
export const demoNow = "2026-09-29T16:00:00+03:00";
export const demoDate = "2026-09-29";
const id = z.string().min(1).max(100);
const text = z.string().trim().min(1).max(200);
const money = z.number().int().nonnegative().max(1_000_000_000);
const department = z.enum(departments);
export const employeeSchema = z.object({
  id,
  restaurantId: id,
  name: text,
  position: text,
  department,
  active: z.boolean(),
});
export type Employee = z.infer<typeof employeeSchema>;
export const taskSchema = z.object({
  id,
  restaurantId: id,
  title: text,
  description: z.string().max(2000),
  department,
  assigneeId: z.string().max(100),
  dueAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    .refine((value) => {
      const date = new Date(`${value}:00Z`);
      return (
        Number.isFinite(date.getTime()) &&
        date.toISOString().slice(0, 16) === value
      );
    }, "Укажите корректные дату и время."),
  priority: z.enum(["normal", "high"]),
  status: z.enum(taskStatuses),
  note: z.string().max(1000),
  templateKey: z.string().optional(),
});
export type OperationTask = z.infer<typeof taskSchema>;
export type Actor = { role: DemoRole; employeeId: string };
export const areaSchema = z.object({
  restaurantId: id,
  department,
  leadId: id,
  opens: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  closes: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  targetMinutes: z.number().int().min(1).max(120),
});
export type AreaSettings = z.infer<typeof areaSchema>;
const checklistSchema = z.object({
  id,
  restaurantId: id,
  department,
  title: text,
  items: z.array(z.object({ id, title: text, done: z.boolean() })).max(50),
});
export type OperationChecklist = z.infer<typeof checklistSchema>;
const orderItem = z.object({
  title: text,
  department,
  quantity: z.number().int().min(1),
  ready: z.boolean(),
});
export const orderSchema = z.object({
  id,
  restaurantId: id,
  externalId: id,
  provider: z.enum(["iiko", "rkeeper"]),
  connectionId: id,
  number: text,
  day: z.iso.date(),
  table: text,
  status: z.enum(["new", "preparing", "ready", "closed", "cancelled"]),
  placedAt: z.iso.datetime({ offset: true }),
  closedAt: z.iso.datetime({ offset: true }).nullable(),
  totalMinor: money,
  discountMinor: money,
  refundMinor: money,
  costMinor: money,
  items: z.array(orderItem).min(1).max(50),
});
export type Order = z.infer<typeof orderSchema>;
export const expenseCategories = [
  "payroll",
  "rent",
  "services",
  "marketing",
  "other",
] as const;
export const expenseNames = {
  payroll: "Команда",
  rent: "Аренда",
  services: "Сервисы и коммунальные",
  marketing: "Маркетинг",
  other: "Прочее",
};
export const expenseSchema = z.object({
  id,
  restaurantId: id,
  day: z.iso.date(),
  category: z.enum(expenseCategories),
  title: text,
  amountMinor: money,
});
export type Expense = z.infer<typeof expenseSchema>;
export const invoiceSchema = z.object({
  id,
  restaurantId: id,
  number: text,
  supplier: text,
  day: z.iso.date(),
  dueDay: z.iso.date(),
  department,
  status: z.enum(["expected", "received", "discrepancy"]),
  paid: z.boolean(),
  note: z.string().max(2000),
  items: z
    .array(
      z.object({
        id,
        title: text,
        unit: text,
        quantity: z.number().positive(),
        received: z.number().nonnegative(),
        priceMinor: money,
      }),
    )
    .min(1)
    .max(100),
});
export type Invoice = z.infer<typeof invoiceSchema>;
export const connectionSchema = z.object({
  id,
  restaurantId: id,
  provider: z.enum(["iiko", "rkeeper"]),
  externalRestaurant: text,
  orders: z.boolean(),
  inventory: z.boolean(),
  state: z.enum(["draft", "ready", "paused"]),
  lastSync: z.string().nullable(),
  log: z.array(z.string().max(300)).max(10),
});
export type Connection = z.infer<typeof connectionSchema>;
export const stateSchema = z.object({
  version: z.literal(2),
  restaurantId: id,
  role: z.enum(roles),
  employeeId: id,
  employees: z.array(employeeSchema).max(200),
  tasks: z.array(taskSchema).max(1000),
  areas: z.array(areaSchema).max(20),
  checklists: z.array(checklistSchema).max(100),
  orders: z.array(orderSchema).max(3000),
  expenses: z.array(expenseSchema).max(1000),
  invoices: z.array(invoiceSchema).max(500),
  connections: z.array(connectionSchema).max(20),
});
export type DemoState = z.infer<typeof stateSchema>;
export const restaurants = [
  { id: "north", name: "Север · бистро", address: "ул. Лесная, 12" },
  { id: "ember", name: "Искра · бар", address: "ул. Малая, 8" },
];
