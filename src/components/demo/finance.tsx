"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Download, ArrowUpRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  type Expense,
  type Invoice,
  expenseNames,
  expenseCategories,
  demoDate,
  restaurants,
  departmentNames,
} from "@/modules/operations/types";
import { financials, rubles, addExpense } from "@/modules/finance/calculations";
import {
  invoiceTotal,
  receiveInvoice,
  payInvoice,
  acceptCorrectedInvoice,
} from "@/modules/operations/logic";
import {
  type DemoContext,
  Panel,
  Metric,
  Pill,
  Empty,
  Field,
  fieldClass,
} from "./common";
import { cn } from "@/lib/utils";

export function Finance({ ctx }: { ctx: DemoContext }) {
  const [period, setPeriod] = useState("7");
  const [scope, setScope] = useState(ctx.state.restaurantId);
  const [adding, setAdding] = useState(false);
  const from = new Date(Date.UTC(2026, 8, 30 - Number(period)))
    .toISOString()
    .slice(0, 10);
  const report = financials(ctx.state, scope, from, demoDate);
  const rows: [string, number][] = [
    ["Продажи до скидок", report.gross],
    ["Скидки", -report.discounts],
    ["Возвраты", -report.refunds],
    ["Выручка", report.revenue],
    ["Себестоимость продаж", -report.cost],
    ["Валовая прибыль", report.revenue - report.cost],
    ...expenseCategories.map(
      (c) =>
        [
          expenseNames[c],
          -report.expenses
            .filter((e) => e.category === c)
            .reduce((sum, e) => sum + e.amountMinor, 0),
        ] as [string, number],
    ),
    ["Операционный результат", report.profit],
  ];
  const trend = Array.from({ length: Number(period) }, (_, i) => {
    const day = new Date(new Date(`${from}T12:00:00Z`).getTime() + i * 86400000)
      .toISOString()
      .slice(0, 10);
    return { day, ...financials(ctx.state, scope, day, day) };
  });
  const max = Math.max(...trend.map((d) => d.revenue), 1);
  function download() {
    const csv =
      "\uFEFFПоказатель;Сумма RUB;Период\n" +
      rows
        .map(
          ([label, amount]) =>
            `${label};${(amount / 100).toFixed(2).replace(".", ",")};${from} — ${demoDate}`,
        )
        .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `ShiftOS-demo-${scope}-${from}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <select
            aria-label="Период отчёта"
            className={`${fieldClass} w-auto`}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="1">Сегодня</option>
            <option value="7">7 дней</option>
            <option value="30">30 дней</option>
          </select>
          <select
            aria-label="Заведения отчёта"
            className={`${fieldClass} w-auto`}
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          >
            <option value="all">Вся сеть</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={download}>
            <Download size={15} />
            CSV
          </Button>
          <Button onClick={() => setAdding(true)}>
            <Plus size={15} />
            Добавить расход
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {from} — {demoDate} · RUB · расчёт по закрытым демо-заказам и расходам
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Выручка"
          value={rubles(report.revenue)}
          hint={`${report.count} закрытых заказов`}
          dark
        />
        <Metric
          label={
            report.profit >= 0 ? "Операционная прибыль" : "Операционный убыток"
          }
          value={rubles(report.profit)}
          hint={`Рентабельность ${report.margin.toFixed(1)}%`}
          negative={report.profit < 0}
        />
        <Metric
          label="Расходы и себестоимость"
          value={rubles(report.operating + report.cost)}
          hint="За выбранный период"
        />
        <Metric
          label="Средний чек"
          value={rubles(report.average)}
          hint="После скидок и возвратов"
        />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Panel
          title="Как зарабатывало заведение"
          description="Выручка по дням. Наведите на столбец или перейдите к нему клавишей Tab."
        >
          <div
            className="flex h-52 items-end gap-1.5 border-b pt-6"
            role="img"
            aria-label="Динамика дневной выручки"
          >
            {trend.map((d) => (
              <div
                key={d.day}
                className="group flex h-full min-w-0 flex-1 flex-col justify-end"
              >
                <div
                  tabIndex={0}
                  title={`${d.day}: выручка ${rubles(d.revenue)}, результат ${rubles(d.profit)}`}
                  aria-label={`${d.day}: выручка ${rubles(d.revenue)}, результат ${rubles(d.profit)}`}
                  className="min-h-1 rounded-t-md bg-[#8ca46b] transition hover:bg-[#385842] focus:bg-[#385842]"
                  style={{ height: `${Math.max(2, (d.revenue / max) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
            <span>
              {from.slice(8)}.{from.slice(5, 7)}
            </span>
            <span>Выручка, ₽</span>
            <span>29.09</span>
          </div>
          <div className="mt-6 rounded-xl bg-[#f4f6ec] p-4 text-xs leading-relaxed">
            <p className="font-semibold">О чём говорят цифры</p>
            <p className="mt-2 text-muted-foreground">
              Себестоимость —{" "}
              {report.revenue > 0
                ? ((report.cost / report.revenue) * 100).toFixed(1)
                : "0"}
              % выручки.{" "}
              {report.profit < 0
                ? "Расходы превышают доходы: проверьте себестоимость, загрузку смен и постоянные расходы."
                : "Сравните результат заведений и проверьте, какие расходы можно планировать точнее."}
            </p>
          </div>
        </Panel>
        <Panel
          title="Прибыль и убытки"
          description="Управленческий отчёт · до налогов и кредитов"
        >
          <div className="divide-y">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className={cn(
                  "flex items-center justify-between gap-3 py-3 text-xs",
                  [
                    "Выручка",
                    "Валовая прибыль",
                    "Операционный результат",
                  ].includes(label) && "font-semibold text-sm",
                )}
              >
                <span>{label}</span>
                <span
                  className={cn(
                    "shrink-0 tabular-nums",
                    label === "Операционный результат" &&
                      value < 0 &&
                      "text-destructive",
                  )}
                >
                  {rubles(value)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Закупки из накладных не вычитаются повторно: здесь учтена
            себестоимость проданного. Оплата поставщикам — отдельное движение
            денег.
          </p>
        </Panel>
      </div>
      <Panel
        title="Сравнение заведений"
        description="Тот же период, одинаковые правила расчёта"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {restaurants.map((r) => {
            const totals = financials(ctx.state, r.id, from, demoDate);
            return (
              <button
                key={r.id}
                onClick={() => setScope(r.id)}
                className="rounded-xl border p-4 text-left hover:bg-[#f7f9f1]"
              >
                <div className="flex justify-between">
                  <p className="text-sm font-semibold">{r.name}</p>
                  <ArrowUpRight size={17} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Выручка</p>
                    <p className="mt-1 text-lg font-semibold">
                      {rubles(totals.revenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      Опер. результат
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-lg font-semibold",
                        totals.profit < 0 && "text-destructive",
                      )}
                    >
                      {rubles(totals.profit)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Panel>
      <Panel
        title="Расходы за период"
        description="Последние 12 записей; все записи периода включены в итог"
      >
        <div className="divide-y">
          {[...report.expenses]
            .sort((a, b) => b.day.localeCompare(a.day))
            .slice(0, 12)
            .map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="text-sm">{e.title}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {e.day} · {expenseNames[e.category]} ·{" "}
                    {restaurants.find((r) => r.id === e.restaurantId)?.name}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">
                  {rubles(e.amountMinor)}
                </span>
              </div>
            ))}
        </div>
        {!report.expenses.length && (
          <Empty text="В этом периоде расходов нет." />
        )}
      </Panel>
      {adding && (
        <Dialog open onOpenChange={(open) => !open && setAdding(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить расход</DialogTitle>
              <DialogDescription>
                {restaurants.find((r) => r.id === ctx.state.restaurantId)?.name}{" "}
                · расход попадёт в отчёт выбранной датой.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              action={(form) => {
                const expense: Expense = {
                  id: crypto.randomUUID(),
                  restaurantId: ctx.state.restaurantId,
                  title: String(form.get("title")),
                  day: String(form.get("day")),
                  amountMinor: Math.round(Number(form.get("amount")) * 100),
                  category: String(form.get("category")) as Expense["category"],
                };
                if (
                  ctx.apply(
                    (s) => addExpense(s, ctx.actor, expense),
                    "Расход добавлен в отчёт.",
                  )
                )
                  setAdding(false);
              }}
            >
              <Field label="Название расхода" htmlFor="expense-title">
                <input
                  id="expense-title"
                  name="title"
                  className={fieldClass}
                  required
                  maxLength={200}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Сумма, ₽" htmlFor="expense-amount">
                  <input
                    id="expense-amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    max="10000000"
                    step="0.01"
                    className={fieldClass}
                    required
                  />
                </Field>
                <Field label="Дата расхода" htmlFor="expense-day">
                  <input
                    id="expense-day"
                    name="day"
                    type="date"
                    defaultValue={demoDate}
                    className={fieldClass}
                    required
                  />
                </Field>
              </div>
              <Field label="Категория" htmlFor="expense-category">
                <select
                  id="expense-category"
                  name="category"
                  className={fieldClass}
                >
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>
                      {expenseNames[c]}
                    </option>
                  ))}
                </select>
              </Field>
              <Button className="w-full" type="submit">
                Сохранить расход
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
export function Invoices({ ctx }: { ctx: DemoContext }) {
  const params = useSearchParams();
  const [selected, setSelected] = useState<string | null>(
    () =>
      ctx.state.invoices.find(
        (i) =>
          i.restaurantId === ctx.state.restaurantId &&
          i.id === params.get("invoice"),
      )?.id ?? null,
  );
  const [filter, setFilter] = useState("all");
  const invoices = ctx.state.invoices.filter(
    (i) => i.restaurantId === ctx.state.restaurantId,
  );
  const names = {
    expected: "Ожидает приёмки",
    received: "Принята",
    discrepancy: "Расхождение",
  };
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Metric
          label="К оплате поставщикам"
          value={rubles(
            invoices
              .filter((i) => !i.paid)
              .reduce((s, i) => s + invoiceTotal(i), 0),
          )}
          hint="Включая ожидаемые документы"
        />
        <Metric
          label="Ждут приёмки"
          value={invoices.filter((i) => i.status === "expected").length}
          hint="Нужно сверить количество"
        />
        <Metric
          label="С расхождениями"
          value={invoices.filter((i) => i.status === "discrepancy").length}
          hint="Требуют внимания администратора"
        />
      </div>
      <Panel
        title="Поставки и документы"
        action={
          <select
            className={`${fieldClass} w-auto`}
            aria-label="Фильтр накладных"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Все документы</option>
            <option value="expected">Ожидают приёмки</option>
            <option value="discrepancy">Расхождения</option>
            <option value="unpaid">Не оплачены</option>
          </select>
        }
      >
        <div className="space-y-3">
          {invoices
            .filter(
              (i) =>
                filter === "all" ||
                (filter === "unpaid" && !i.paid) ||
                i.status === filter,
            )
            .map((i) => (
              <button
                key={i.id}
                aria-label={`Открыть накладную ${i.number}`}
                onClick={() => setSelected(i.id)}
                className="flex w-full flex-wrap items-center gap-4 rounded-xl border p-4 text-left hover:bg-[#f9faf5]"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-[#f0f2e8]">
                  <FileText size={19} />
                </span>
                <div className="min-w-[160px] flex-1">
                  <p className="text-sm font-semibold">
                    {i.number} · {i.supplier}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {i.day} · {departmentNames[i.department]} · оплатить до{" "}
                    {i.dueDay}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Pill
                    tone={
                      i.status === "discrepancy"
                        ? "red"
                        : i.status === "received"
                          ? "green"
                          : "orange"
                    }
                  >
                    {names[i.status]}
                  </Pill>
                  <Pill
                    tone={
                      i.paid ? "green" : i.dueDay < demoDate ? "red" : "neutral"
                    }
                  >
                    {i.paid
                      ? "Оплачена"
                      : i.dueDay < demoDate
                        ? "Оплата просрочена"
                        : "Не оплачена"}
                  </Pill>
                </div>
                <span className="text-sm font-semibold">
                  {rubles(invoiceTotal(i))}
                </span>
              </button>
            ))}
        </div>
      </Panel>
      {selected && (
        <InvoiceDetail
          ctx={ctx}
          invoice={invoices.find((i) => i.id === selected)!}
          close={() => setSelected(null)}
        />
      )}
    </div>
  );
}
function InvoiceDetail({
  ctx,
  invoice,
  close,
}: {
  ctx: DemoContext;
  invoice: Invoice;
  close: () => void;
}) {
  const [quantities, setQuantities] = useState(
    invoice.items.map((i) => String(i.received)),
  );
  const [note, setNote] = useState(invoice.note);
  const [error, setError] = useState("");
  const [resolution, setResolution] = useState("");
  function receive() {
    const values = quantities.map((q) => (q === "" ? NaN : Number(q)));
    if (
      values.some((n, i) => n !== invoice.items[i].quantity) &&
      !note.trim()
    ) {
      setError("Опишите расхождение перед приёмкой.");
      return;
    }
    if (
      ctx.apply(
        (s) => receiveInvoice(s, ctx.actor, invoice.id, values, note),
        "Приёмка накладной сохранена.",
      )
    )
      close();
  }
  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{invoice.number}</DialogTitle>
          <DialogDescription>
            {invoice.supplier} · {invoice.day}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {invoice.items.map((i, index) => (
            <div
              key={i.id}
              className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_120px]"
            >
              <div>
                <p className="text-sm font-semibold">{i.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  По документу: {i.quantity} {i.unit} × {rubles(i.priceMinor)}
                </p>
              </div>
              <Field label={`Принято, ${i.unit}`} htmlFor={`qty-${i.id}`}>
                <input
                  id={`qty-${i.id}`}
                  aria-label={`Принято: ${i.title}`}
                  type="number"
                  min="0"
                  step="0.01"
                  className={fieldClass}
                  value={quantities[index]}
                  disabled={invoice.status !== "expected"}
                  onChange={(e) =>
                    setQuantities(
                      quantities.map((q, n) =>
                        n === index ? e.target.value : q,
                      ),
                    )
                  }
                />
              </Field>
            </div>
          ))}
        </div>
        <p className="flex justify-between text-sm font-semibold">
          <span>Сумма по документу</span>
          <span>{rubles(invoiceTotal(invoice))}</span>
        </p>
        <Field label="Комментарий к приёмке" htmlFor="invoice-note">
          <textarea
            id="invoice-note"
            className={`${fieldClass} h-20 py-3`}
            maxLength={1000}
            value={note}
            readOnly={invoice.status !== "expected"}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {invoice.status === "expected" && (
          <Button onClick={receive}>Подтвердить приёмку</Button>
        )}
        {invoice.status === "discrepancy" && (
          <div className="space-y-3 rounded-xl bg-[#fff0e8] p-4">
            <p className="text-xs leading-relaxed">
              Оплата заблокирована. После согласования с поставщиком можно
              принять исправленный документ на фактически полученное количество.
              Новая сумма:{" "}
              {rubles(
                invoice.items.reduce(
                  (sum, i) => sum + Math.round(i.received * i.priceMinor),
                  0,
                ),
              )}
              .
            </p>
            <Field label="Основание исправления" htmlFor="invoice-resolution">
              <input
                id="invoice-resolution"
                className={fieldClass}
                value={resolution}
                maxLength={400}
                placeholder="Номер исправленного документа и что согласовано"
                onChange={(e) => setResolution(e.target.value)}
              />
            </Field>
            <Button
              onClick={() => {
                if (
                  ctx.apply(
                    (s) =>
                      acceptCorrectedInvoice(
                        s,
                        ctx.actor,
                        invoice.id,
                        resolution,
                      ),
                    "Документ принят по фактическому количеству. Сумма пересчитана.",
                  )
                )
                  close();
              }}
            >
              Принять исправленный документ
            </Button>
          </div>
        )}
        {invoice.status === "received" &&
          !invoice.paid &&
          ctx.actor.role === "owner" && (
            <Button
              onClick={() => {
                if (
                  ctx.apply(
                    (s) => payInvoice(s, ctx.actor, invoice.id),
                    "Оплата отмечена в демо. Деньги не переводились.",
                  )
                )
                  close();
              }}
            >
              Отметить оплату в демо
            </Button>
          )}
      </DialogContent>
    </Dialog>
  );
}
