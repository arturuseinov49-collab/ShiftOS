export const sections = [
  "dashboard",
  "tasks",
  "checklists",
  "team",
  "menu",
  "training",
  "assistant",
  "settings",
] as const;
export type Section = (typeof sections)[number];
export type Task = {
  id: string;
  restaurantId: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "normal" | "high";
  assignee: string;
  due: string;
};
export type Checklist = {
  id: string;
  restaurantId: string;
  title: string;
  kind: string;
  items: { id: string; title: string; done: boolean }[];
};
export type WorkspaceData = {
  organizationId: string;
  organizationName: string;
  mode: "demo" | "live";
  canWriteTasks: boolean;
  restaurants: { id: string; name: string; address: string }[];
  tasks: Task[];
  checklists: Checklist[];
  employees: {
    id: string;
    restaurantId: string;
    name: string;
    position: string;
    initials: string;
    active: boolean;
  }[];
  menu: {
    id: string;
    name: string;
    category: string;
    price: number;
    currency: string;
    available: boolean;
    description: string;
    allergens: string[];
  }[];
  training: { id: string; title: string; content: string; status: string }[];
};
