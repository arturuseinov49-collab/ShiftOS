"use client";
import type { ReactNode } from "react";
import { ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Actor, DemoState } from "@/modules/operations/types";
export type DemoContext = {
  state: DemoState;
  actor: Actor;
  apply: (update: (state: DemoState) => DemoState, success?: string) => boolean;
};
export const fieldClass =
  "h-11 w-full min-w-0 rounded-lg border bg-white px-3 text-sm outline-offset-2";
export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-semibold text-[#526057]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
export function Panel({
  children,
  className,
  title,
  description,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-2xl border bg-white p-5 sm:p-6",
        className,
      )}
    >
      {title && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            {description && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "orange" | "red";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-semibold",
        {
          neutral: "bg-[#f0f1eb] text-[#62705e]",
          green: "bg-[#e9f1dd] text-[#416335]",
          orange: "bg-[#fbeddc] text-[#956325]",
          red: "bg-[#fbe8e3] text-[#a6422b]",
        }[tone],
      )}
    >
      {children}
    </span>
  );
}
export function Metric({
  label,
  value,
  hint,
  dark = false,
  negative = false,
}: {
  label: string;
  value: string | number;
  hint: string;
  dark?: boolean;
  negative?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border p-5",
        dark ? "border-[#233d33] bg-[#233d33] text-white" : "bg-white",
      )}
    >
      <p
        className={cn(
          "text-xs",
          dark ? "text-[#bdcdb9]" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-4 break-words text-[27px] font-semibold tracking-tight sm:text-3xl",
          negative && "text-[#c75437]",
        )}
      >
        {value}
      </p>
      <div
        className={cn(
          "mt-3 flex items-center gap-1.5 text-[11px]",
          dark ? "text-[#dce8c7]" : "text-muted-foreground",
        )}
      >
        {dark ? <ArrowUpRight size={13} /> : <Minus size={12} />}
        {hint}
      </div>
    </div>
  );
}
export function Empty({
  title = "Пока пусто",
  text,
}: {
  title?: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-dashed bg-[#fafbf7] px-5 py-9 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
        {text}
      </p>
    </div>
  );
}
export function Progress({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[#edf0e6]">
      <div
        className="h-full rounded-full bg-[#7d9462] transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
