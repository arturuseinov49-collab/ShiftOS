import type { Connection, Order, Invoice } from "@/modules/operations/types";
export type ProviderId = "iiko" | "rkeeper";
/** Future network adapters run only on the server with tenant authorization and vault references. */
export interface POSAdapter {
  provider: ProviderId;
  mode: "demo" | "live";
  pull(
    connection: Connection,
    signal?: AbortSignal,
  ): Promise<{ orders: Order[]; invoices: Invoice[]; cursor: string }>;
}
export const providerCatalog = {
  iiko: {
    name: "iiko",
    channel: "iiko Cloud / iikoServer",
    detail:
      "Заказы и меню — канал кассы; документы и финансовые данные — отдельный канал учёта. Доступ зависит от API, версии и лицензии заведения.",
    docs: "https://ru.iiko.help/",
  },
  rkeeper: {
    name: "r_keeper",
    channel: "White Server / StoreHouse",
    detail:
      "Касса r_keeper и складской контур StoreHouse подключаются отдельно. Для боевого подключения нужны настройки дилера и доступ к API.",
    docs: "https://docs.rkeeper.ru/ws/white-server-api-27844345.html",
  },
} as const;
export const importKey = (
  record: Pick<Order, "provider" | "connectionId" | "externalId">,
) => `${record.provider}:${record.connectionId}:${record.externalId}`;
