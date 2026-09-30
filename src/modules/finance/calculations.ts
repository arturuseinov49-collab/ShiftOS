import {
  type Actor,
  type DemoState,
  type Expense,
  expenseSchema,
} from "@/modules/operations/types";
export function financials(
  state: Pick<DemoState, "orders" | "expenses">,
  restaurantId: string,
  from: string,
  to: string,
) {
  const scope = (item: { restaurantId: string; day: string }) =>
    (restaurantId === "all" || item.restaurantId === restaurantId) &&
    item.day >= from &&
    item.day <= to;
  const orders = state.orders.filter((o) => scope(o) && o.status === "closed");
  const expenses = state.expenses.filter(scope);
  const gross = orders.reduce((s, o) => s + o.totalMinor, 0);
  const discounts = orders.reduce((s, o) => s + o.discountMinor, 0);
  const refunds = orders.reduce((s, o) => s + o.refundMinor, 0);
  const revenue = gross - discounts - refunds;
  const cost = orders.reduce((s, o) => s + o.costMinor, 0);
  const operating = expenses.reduce((s, e) => s + e.amountMinor, 0);
  const profit = revenue - cost - operating;
  return {
    gross,
    discounts,
    refunds,
    revenue,
    cost,
    operating,
    profit,
    margin: revenue > 0 ? (profit / revenue) * 100 : 0,
    count: orders.length,
    average: orders.length ? Math.round(revenue / orders.length) : 0,
    expenses,
  };
}
export function addExpense(
  state: DemoState,
  actor: Actor,
  input: Expense,
): DemoState {
  if (actor.role !== "owner") throw new Error("Расходы добавляет владелец.");
  const expense = expenseSchema.parse(input);
  if (
    expense.amountMinor <= 0 ||
    expense.restaurantId !== state.restaurantId ||
    state.expenses.some((e) => e.id === expense.id)
  )
    throw new Error("Проверьте сумму и заведение.");
  return { ...state, expenses: [...state.expenses, expense] };
}
export const rubles = (minor: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(minor / 100);
