"use client";
import Link from "next/link";
import { ArrowUpRight, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shiftProblems, assignProblem } from "@/modules/operations/problems";
import { type DemoContext, Empty, Pill } from "./common";

export function Problems({ ctx, limit }: { ctx: DemoContext; limit?: number }) {
  const problems = shiftProblems(ctx.state, ctx.actor);
  return (
    <div className="space-y-3">
      {problems.slice(0, limit ?? problems.length).map((p) => {
        const task = ctx.state.tasks.find(
          (t) =>
            t.restaurantId === ctx.state.restaurantId &&
            t.templateKey === `problem-${p.id}`,
        );
        const lead = ctx.state.areas.find(
          (a) =>
            a.restaurantId === ctx.state.restaurantId &&
            a.department === p.department,
        )?.leadId;
        return (
          <article
            key={p.id}
            className="rounded-xl border bg-[#fafbf7] p-4 sm:p-5"
          >
            <div className="flex items-start gap-3">
              <CircleAlert
                size={19}
                className="mt-0.5 shrink-0 text-[#aa6b38]"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold leading-relaxed">
                  {p.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {p.evidence}
                </p>
                <p className="mt-3 text-xs leading-relaxed">{p.instruction}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {p.href !== "/demo/finance" &&
                    (task ? (
                      <>
                        <Pill tone="green">Разбор назначен</Pill>
                        <Link
                          href="/demo/tasks"
                          className="text-xs font-medium underline"
                        >
                          К задаче
                        </Link>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`Назначить разбор: ${p.title}`}
                        onClick={() =>
                          ctx.apply(
                            (s) => assignProblem(s, ctx.actor, p.id),
                            "Разбор назначен ответственному участка. Повторная задача не создаётся.",
                          )
                        }
                      >
                        Назначить разбор
                      </Button>
                    ))}
                  <Link
                    href={p.href}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#657d50]"
                  >
                    Открыть источник <ArrowUpRight size={13} />
                  </Link>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Ответственный:{" "}
                  {p.href === "/demo/finance"
                    ? "Владелец"
                    : ctx.state.employees.find((e) => e.id === lead)?.name}
                </p>
              </div>
            </div>
          </article>
        );
      })}
      {!problems.length && (
        <Empty text="По текущим правилам отклонений не найдено. Продолжайте следить за сменой." />
      )}
      {limit && problems.length > limit && (
        <Link
          href="/demo/assistant"
          className="block pt-2 text-xs font-medium text-[#657d50]"
        >
          Все отклонения: {problems.length} →
        </Link>
      )}
    </div>
  );
}
