"use client";
import { useState } from "react";
import {
  Plug,
  RefreshCw,
  Pause,
  Plus,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { type Connection } from "@/modules/operations/types";
import { providerCatalog } from "@/modules/integrations/contracts";
import {
  demoAdapter,
  mergeDemoBatch,
  pauseConnection,
  saveConnection,
} from "@/modules/integrations/demo-adapter";
import {
  type DemoContext,
  Panel,
  Pill,
  Field,
  fieldClass,
  Empty,
} from "./common";

export function Integrations({ ctx }: { ctx: DemoContext }) {
  const [editing, setEditing] = useState<Connection | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const connections = ctx.state.connections.filter(
    (c) => c.restaurantId === ctx.state.restaurantId,
  );
  async function sync(c: Connection) {
    setSyncing(c.id);
    setError("");
    try {
      const batch = await demoAdapter(c.provider).pull(c);
      ctx.apply(
        (s) => mergeDemoBatch(s, ctx.actor, c.id, batch),
        "Демо-импорт завершён. Заказы и накладные обновлены.",
      );
    } catch {
      setError("Не удалось выполнить демо-импорт. Проверьте настройку.");
    } finally {
      setSyncing(null);
    }
  }
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#dfdacb] bg-[#fbf5e9] p-5">
        <p className="text-sm font-semibold">Обе системы в одной сети</p>
        <p className="mt-2 max-w-4xl text-xs leading-relaxed text-[#786b52]">
          Например, iiko в «Севере» и r_keeper в «Искре». Подключения хранятся
          отдельно для каждого заведения. В демо можно проверить настройку,
          импортировать пример данных и повторить синхронизацию без дубликатов.
          Реального соединения с кассой здесь нет.
        </p>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {(Object.keys(providerCatalog) as Connection["provider"][]).map(
          (provider) => {
            const catalog = providerCatalog[provider];
            return (
              <Panel key={provider}>
                <div className="flex items-start justify-between">
                  <div
                    className={`grid size-14 place-items-center rounded-2xl text-lg font-bold ${provider === "iiko" ? "bg-[#f7e9e5] text-[#c35135]" : "bg-[#edf0e5] text-[#486143]"}`}
                  >
                    {provider === "iiko" ? "iiko" : "r_k"}
                  </div>
                  <Pill>Демо-адаптер</Pill>
                </div>
                <h2 className="mt-5 text-xl font-semibold">{catalog.name}</h2>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {catalog.channel}
                </p>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  {catalog.detail}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setEditing(
                        connections.find((c) => c.provider === provider) ?? {
                          id: crypto.randomUUID(),
                          restaurantId: ctx.state.restaurantId,
                          provider,
                          externalRestaurant: "",
                          orders: true,
                          inventory: true,
                          state: "draft",
                          lastSync: null,
                          log: [],
                        },
                      )
                    }
                  >
                    <Plus size={15} />
                    {connections.some((c) => c.provider === provider)
                      ? "Настроить"
                      : "Добавить подключение"}{" "}
                    {catalog.name}
                  </Button>
                  <a
                    href={catalog.docs}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2 text-xs text-muted-foreground"
                  >
                    Документация
                    <ArrowUpRight size={13} />
                  </a>
                </div>
              </Panel>
            );
          },
        )}
      </div>
      <Panel
        title="Подключения заведения"
        description="Для заказов выбирается один источник на заведение, чтобы не считать выручку дважды."
      >
        <div className="space-y-4">
          {connections.map((c) => (
            <div key={c.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Plug size={20} className="text-[#678057]" />
                  <div>
                    <h3 className="text-sm font-semibold">
                      {providerCatalog[c.provider].name} ·{" "}
                      {c.externalRestaurant || "Не настроено"}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[c.orders && "Заказы", c.inventory && "Накладные"]
                        .filter(Boolean)
                        .join(" + ")}
                    </p>
                  </div>
                </div>
                <Pill tone={c.state === "ready" ? "green" : "neutral"}>
                  {c.state === "ready"
                    ? "Демо-настройка готова"
                    : c.state === "paused"
                      ? "Приостановлено"
                      : "Нужна настройка"}
                </Pill>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={c.state !== "ready" || syncing !== null}
                  onClick={() => sync(c)}
                >
                  <RefreshCw
                    size={14}
                    className={syncing === c.id ? "animate-spin" : ""}
                  />
                  {syncing === c.id ? "Импорт…" : "Импортировать пример"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(c)}
                >
                  Изменить настройку
                </Button>
                {c.state === "ready" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      ctx.apply(
                        (s) => pauseConnection(s, ctx.actor, c.id),
                        "Демо-подключение приостановлено.",
                      )
                    }
                  >
                    <Pause size={13} />
                    Приостановить
                  </Button>
                )}
              </div>
              {c.lastSync && (
                <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <CheckCircle2 size={13} />
                  Последний демо-импорт:{" "}
                  {new Date(c.lastSync).toLocaleString("ru-RU")}
                </p>
              )}
              {c.log.length > 0 && (
                <div
                  className="mt-3 space-y-1 border-t pt-3"
                  aria-label="Журнал синхронизации"
                >
                  {c.log.slice(0, 3).map((line, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {!connections.length && (
          <Empty text="Добавьте iiko или r_keeper для этого заведения." />
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
      </Panel>
      <Panel title="Что понадобится для настоящего подключения">
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            [
              "01",
              "Уточнить систему",
              "Версия кассы, серверный или облачный вариант, складской модуль и доступная лицензия.",
            ],
            [
              "02",
              "Подключить доступ",
              "Ключи будут храниться на сервере. В публичном демо поля для боевых ключей отсутствуют.",
            ],
            [
              "03",
              "Сверить данные",
              "Сопоставить заведение, подразделения и справочники; проверить продажи, возвраты и документы.",
            ],
          ].map(([n, title, text]) => (
            <div key={n}>
              <p className="text-xs font-semibold text-[#899b75]">{n}</p>
              <h3 className="mt-2 text-sm font-semibold">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {text}
              </p>
            </div>
          ))}
        </div>
      </Panel>
      {editing && (
        <ConnectionEditor
          ctx={ctx}
          connection={editing}
          close={() => setEditing(null)}
        />
      )}
    </div>
  );
}
function ConnectionEditor({
  ctx,
  connection,
  close,
}: {
  ctx: DemoContext;
  connection: Connection;
  close: () => void;
}) {
  const [error, setError] = useState("");
  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Настройка {providerCatalog[connection.provider].name}
          </DialogTitle>
          <DialogDescription>
            Тестовое сопоставление с текущим заведением. API-ключи не нужны и не
            сохраняются.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          action={(form) => {
            const c = {
              ...connection,
              externalRestaurant: String(form.get("external")).trim(),
              orders: form.get("orders") === "on",
              inventory: form.get("inventory") === "on",
            };
            if (!c.externalRestaurant || (!c.orders && !c.inventory)) {
              setError("Укажите код и выберите хотя бы один поток данных.");
              return;
            }
            if (
              ctx.apply(
                (s) => saveConnection(s, ctx.actor, c),
                "Демо-настройка проверена. Теперь можно импортировать пример.",
              )
            )
              close();
          }}
        >
          <Field label="Условный код заведения в кассе" htmlFor="external-code">
            <input
              id="external-code"
              name="external"
              className={fieldClass}
              required
              maxLength={100}
              defaultValue={connection.externalRestaurant}
              placeholder="Например, DEMO-NORTH"
            />
          </Field>
          <div className="space-y-3 rounded-xl border p-4">
            <label className="flex items-center gap-3 text-sm">
              <input
                name="orders"
                type="checkbox"
                defaultChecked={connection.orders}
                className="size-4 accent-[#56764b]"
              />
              Заказы и продажи
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                name="inventory"
                type="checkbox"
                defaultChecked={connection.inventory}
                className="size-4 accent-[#56764b]"
              />
              Поставки и накладные
            </label>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Проверка подтверждает заполнение формы. Доступ к реальному API в
            этом демо не проверяется.
          </p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full">
            Проверить демо-настройку
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
