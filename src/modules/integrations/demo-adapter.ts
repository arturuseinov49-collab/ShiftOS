import {
  type Actor,
  type Connection,
  type DemoState,
  type Order,
  connectionSchema,
  demoDate,
  demoNow,
} from "@/modules/operations/types";
import { type POSAdapter, type ProviderId, importKey } from "./contracts";
/** No network calls or credentials. Fixed external IDs deliberately exercise replay handling. */
export function demoAdapter(provider: ProviderId): POSAdapter {
  return {
    provider,
    mode: "demo",
    async pull(connection) {
      const orders: Order[] = connection.orders
        ? [0, 1].map((i) => ({
            id: `import-${connection.id}-${i}`,
            provider,
            connectionId: connection.id,
            externalId: `sample-order-${i}`,
            restaurantId: connection.restaurantId,
            number: `ИМП-${i + 1}`,
            day: demoDate,
            table: "Демо-импорт",
            status: "closed",
            placedAt: `${demoDate}T12:00:00+03:00`,
            closedAt: demoNow,
            totalMinor: (3200 + i * 700) * 100,
            discountMinor: 0,
            refundMinor: 0,
            costMinor: 110000,
            items: [
              {
                title: "Тестовый заказ из интеграции",
                department: "kitchen",
                quantity: 1,
                ready: true,
              },
            ],
          }))
        : [];
      return {
        orders,
        invoices: connection.inventory
          ? [
              {
                id: `import-invoice-${connection.id}`,
                restaurantId: connection.restaurantId,
                number: `ИМП-${provider}-001`,
                supplier: "Демо-поставщик",
                day: demoDate,
                dueDay: "2026-10-05",
                department: "kitchen",
                status: "expected",
                paid: false,
                note: "Пример импортированного документа",
                items: [
                  {
                    id: "import-line",
                    title: "Тестовая поставка",
                    unit: "уп.",
                    quantity: 4,
                    received: 4,
                    priceMinor: 65000,
                  },
                ],
              },
            ]
          : [],
        cursor: "demo-batch-v1",
      };
    },
  };
}
export function saveConnection(
  state: DemoState,
  actor: Actor,
  input: Connection,
): DemoState {
  if (actor.role !== "owner")
    throw new Error("Интеграции настраивает владелец.");
  const c = connectionSchema.parse(input);
  if (c.restaurantId !== state.restaurantId || (!c.orders && !c.inventory))
    throw new Error("Выберите заведение и хотя бы один поток данных.");
  if (
    state.connections.some(
      (x) =>
        x.id !== c.id &&
        x.restaurantId === c.restaurantId &&
        x.state !== "paused" &&
        x.orders &&
        c.orders,
    )
  )
    throw new Error(
      "Для заказов этого заведения уже выбран источник. Приостановите его, чтобы избежать двойного учёта.",
    );
  if (
    state.connections.some(
      (x) =>
        x.id === c.id &&
        (x.restaurantId !== c.restaurantId || x.provider !== c.provider),
    )
  )
    throw new Error("Нельзя менять владельца существующего подключения.");
  return {
    ...state,
    connections: state.connections.some((x) => x.id === c.id)
      ? state.connections.map((x) =>
          x.id === c.id ? { ...c, state: "ready" } : x,
        )
      : [...state.connections, { ...c, state: "ready" }],
  };
}
export function mergeDemoBatch(
  state: DemoState,
  actor: Actor,
  id: string,
  batch: Awaited<ReturnType<POSAdapter["pull"]>>,
): DemoState {
  const c = state.connections.find(
    (x) => x.id === id && x.restaurantId === state.restaurantId,
  );
  if (actor.role !== "owner" || !c || c.state !== "ready")
    throw new Error("Сначала проверьте демо-настройку подключения.");
  if (
    batch.orders.some(
      (o) =>
        o.restaurantId !== c.restaurantId ||
        o.provider !== c.provider ||
        o.connectionId !== c.id,
    ) ||
    batch.invoices.some((i) => i.restaurantId !== c.restaurantId)
  )
    throw new Error("Импорт другого заведения заблокирован.");
  const keys = new Set(state.orders.map(importKey));
  const invoiceIds = new Set(state.invoices.map((i) => i.id));
  // Demo replay preserves operational edits and never counts the same document twice.
  const orders = batch.orders.filter(
    (o) => !keys.has(importKey(o)) && !!keys.add(importKey(o)),
  );
  const invoices = batch.invoices.filter(
    (i) => !invoiceIds.has(i.id) && !!invoiceIds.add(i.id),
  );
  return {
    ...state,
    orders: [...state.orders, ...orders],
    invoices: [...state.invoices, ...invoices],
    connections: state.connections.map((x) =>
      x.id === id
        ? {
            ...x,
            lastSync: new Date().toISOString(),
            log: [
              `Демо-импорт: +${orders.length} заказа, +${invoices.length} накладных. Повторы пропущены.`,
              ...x.log,
            ].slice(0, 10),
          }
        : x,
    ),
  };
}
export function pauseConnection(
  state: DemoState,
  actor: Actor,
  id: string,
): DemoState {
  if (
    actor.role !== "owner" ||
    !state.connections.some(
      (x) => x.id === id && x.restaurantId === state.restaurantId,
    )
  )
    throw new Error("Недостаточно прав.");
  return {
    ...state,
    connections: state.connections.map((x) =>
      x.id === id ? { ...x, state: "paused" } : x,
    ),
  };
}
