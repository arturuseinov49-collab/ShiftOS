"use client";
import Link from "next/link";
import {
  LayoutDashboard,
  ListTodo,
  ClipboardCheck,
  Users,
  UtensilsCrossed,
  GraduationCap,
  Sparkles,
  Settings2,
  ArrowUpRight,
  Leaf,
} from "lucide-react";
import type { Section } from "@/modules/workspace/types";
import { cn } from "@/lib/utils";
export const navigation = [
  { id: "dashboard", title: "Обзор", icon: LayoutDashboard },
  { id: "tasks", title: "Задачи", icon: ListTodo },
  { id: "checklists", title: "Чек-листы", icon: ClipboardCheck },
  { id: "team", title: "Команда", icon: Users },
  { id: "menu", title: "Меню", icon: UtensilsCrossed },
  { id: "training", title: "Обучение", icon: GraduationCap },
  { id: "assistant", title: "AI-управляющий", icon: Sparkles },
  { id: "settings", title: "Настройки", icon: Settings2 },
] as const;
export function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 text-2xl font-bold tracking-tight",
        dark && "text-white",
      )}
    >
      <span className="grid size-9 place-items-center rounded-xl bg-[#d8603b] text-white">
        <Leaf size={21} strokeWidth={2.2} />
      </span>
      Shift<span className="-ml-2 font-normal opacity-60">OS</span>
    </div>
  );
}
export function Sidebar({
  section,
  base,
  organization,
  mode,
  onNavigate,
}: {
  section: Section;
  base: string;
  organization: string;
  mode: "demo" | "live";
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-[#233d33] px-5 py-8 text-[#c2cdc5]">
      <Link
        href={base}
        onClick={onNavigate}
        aria-label="ShiftOS — обзор"
        className="px-3"
      >
        <Brand dark />
      </Link>
      <div className="mb-8 mt-9 border-b border-white/10 px-3 pb-5">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#829e8e]">
          Рабочее пространство
        </p>
        <p className="text-sm font-medium text-white">{organization}</p>
      </div>
      <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#829e8e]">
        Управление
      </p>
      <nav aria-label="Основная навигация" className="space-y-1.5">
        {navigation.map(({ id, title, icon: Icon }, i) => (
          <Link
            key={id}
            href={`${base}/${id}`}
            onClick={onNavigate}
            aria-current={section === id ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] transition-colors hover:bg-white/8 hover:text-white",
              section === id &&
                "bg-[#dce8c7] font-semibold text-[#263d2e] hover:bg-[#dce8c7] hover:text-[#263d2e]",
              i === 6 && "mt-7",
            )}
          >
            <Icon size={18} strokeWidth={1.7} />
            {title}
            {id === "assistant" && (
              <span className="ml-auto text-[9px] opacity-60">BETA</span>
            )}
          </Link>
        ))}
      </nav>
      <div className="mt-auto pt-10">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <Sparkles size={20} className="mb-3 text-[#dce8c7]" />
          <p className="text-sm font-medium text-white">
            Больше времени на гостей
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#a5b8ad]">
            Рутина — в систему.
            <br />
            Гостеприимство — людям.
          </p>
        </div>
        <Link
          href={mode === "demo" ? "/login" : "/workspace"}
          className="mt-5 flex items-center gap-3 px-2 py-2 text-xs hover:text-white"
        >
          <span className="grid size-8 place-items-center rounded-full bg-[#486353] text-[10px] text-white">
            {mode === "demo" ? "ДМ" : "РП"}
          </span>
          <span>
            {mode === "demo" ? "Демо-пространство" : "Мои организации"}
            <span className="mt-0.5 block text-[10px] text-[#829e8e]">
              {mode === "demo" ? "Перейти к входу" : "Сменить организацию"}
            </span>
          </span>
          <ArrowUpRight size={15} className="ml-auto" />
        </Link>
      </div>
    </div>
  );
}
