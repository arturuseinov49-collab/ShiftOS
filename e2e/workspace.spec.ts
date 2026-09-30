import { test, expect } from "@playwright/test";
test("task assignment, staff work and admin approval survive reload", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/demo");
  await expect(
    page.getByRole("heading", { name: "Всё заведение перед глазами" }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/operations-${info.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Новая задача", exact: true }).click();
  await page
    .getByLabel("Что нужно сделать?")
    .fill("Сверить вечерние бронирования");
  await page.getByLabel("Участок задачи").selectOption("floor");
  await page.getByLabel("Исполнитель", { exact: true }).selectOption("e3");
  await page.getByLabel("Срок выполнения").fill("2026-09-29T17:30");
  await page
    .getByRole("button", { name: "Создать задачу", exact: true })
    .click();
  await page.getByLabel("Роль в демо").selectOption("employee");
  await expect(page.getByRole("heading", { name: "Моя смена" })).toBeVisible();
  await page.goto("/demo/tasks");
  await page.getByLabel("Поиск задач").fill("вечерние бронирования");
  await page
    .getByRole("button", {
      name: "Открыть задачу: Сверить вечерние бронирования",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Редактировать", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Начать работу", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Открыть задачу: Сверить вечерние бронирования",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Результат работы / комментарий")
    .fill("Все 12 бронирований подтверждены.");
  await page
    .getByRole("button", { name: "Передать на проверку", exact: true })
    .click();
  await page.getByLabel("Сотрудник в демо").selectOption("e2");
  await expect(
    page.getByRole("button", {
      name: "Открыть задачу: Сверить вечерние бронирования",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByLabel("Роль в демо").selectOption("admin");
  await page.goto("/demo/tasks");
  await page.getByLabel("Поиск задач").fill("вечерние бронирования");
  await page
    .getByRole("button", {
      name: "Открыть задачу: Сверить вечерние бронирования",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("Результат работы / комментарий")).toHaveValue(
    "Все 12 бронирований подтверждены.",
  );
  await page
    .getByRole("button", { name: "Принять результат", exact: true })
    .click();
  await page.reload();
  await page.getByLabel("Поиск задач").fill("вечерние бронирования");
  await page
    .getByRole("button", {
      name: "Открыть задачу: Сверить вечерние бронирования",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Вернуть в работу" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("area settings, checklists and direct-route role boundaries work", async ({
  page,
}, info) => {
  await page.goto("/demo/departments");
  await page.getByRole("button", { name: "Настроить участок Бар" }).click();
  await page.getByLabel("Норматив, минут").fill("6");
  await page.getByRole("button", { name: "Сохранить настройки" }).click();
  await expect(page.getByText(/Норматив: 6 мин/)).toBeVisible();
  await page.getByLabel("Роль в демо").selectOption("employee");
  await page.getByLabel("Сотрудник в демо").selectOption("e6");
  await page.goto("/demo/checklists");
  await expect(
    page.getByRole("heading", { name: "Открытие бара" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Готовность кухни" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Подготовить станцию" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Подготовить станцию" }),
  ).toHaveAttribute("aria-pressed", "true");
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Открыть меню" }).click();
  await expect(
    page
      .getByRole("navigation")
      .getByRole("link", { name: "Финансы", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Обучение", exact: true })
    .click();
  await page.getByRole("button", { name: "Открыть материал" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.goto("/demo/finance");
  await expect(
    page.getByRole("heading", { name: "Раздел недоступен для этой роли" }),
  ).toBeVisible();
  await expect(page.getByText("Прибыль и убытки", { exact: true })).toHaveCount(
    0,
  );
});
test("both POS providers, repeat imports and an expense affect owner reports", async ({
  page,
}, info) => {
  await page.goto("/demo/integrations");
  await page
    .getByRole("button", { name: "Настроить iiko", exact: true })
    .click();
  await page.getByRole("button", { name: "Проверить демо-настройку" }).click();
  await page
    .getByRole("button", { name: "Импортировать пример", exact: true })
    .click();
  await expect(
    page.getByText("Демо-импорт: +2 заказа, +1 накладных. Повторы пропущены."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Импортировать пример", exact: true })
    .click();
  await expect(
    page.getByText("Демо-импорт: +0 заказа, +0 накладных. Повторы пропущены."),
  ).toBeVisible();
  await page.getByLabel("Выберите заведение").selectOption("ember");
  await page
    .getByRole("button", { name: "Настроить r_keeper", exact: true })
    .click();
  await page.getByRole("button", { name: "Проверить демо-настройку" }).click();
  await page
    .getByRole("button", { name: "Импортировать пример", exact: true })
    .click();
  await expect(
    page.getByText("Демо-импорт: +2 заказа, +1 накладных. Повторы пропущены."),
  ).toBeVisible();
  await page.goto("/demo/finance");
  await page.getByLabel("Период отчёта").selectOption("1");
  await page
    .getByRole("button", { name: "Добавить расход", exact: true })
    .click();
  await page.getByLabel("Название расхода").fill("Ремонт кофемашины");
  await page.getByLabel("Сумма, ₽").fill("200000");
  await page.getByRole("button", { name: "Сохранить расход" }).click();
  await expect(
    page.getByText("Ремонт кофемашины", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Операционный убыток", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/finance-${info.project.name}.png`,
    fullPage: true,
  });
});
test("invoice receipt records shortages and blocks payment", async ({
  page,
}) => {
  await page.goto("/demo/invoices");
  await page
    .getByRole("button", { name: "Открыть накладную ПН-0929-01", exact: true })
    .click();
  await page.getByLabel("Принято: Тыква").fill("19");
  await page.getByRole("button", { name: "Подтвердить приёмку" }).click();
  await expect(
    page.getByText("Опишите расхождение перед приёмкой."),
  ).toBeVisible();
  await page.getByLabel("Комментарий к приёмке").fill("Не хватает 1 кг тыквы");
  await page.getByRole("button", { name: "Подтвердить приёмку" }).click();
  await page.goto("/demo/assistant");
  await page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", {
        name: "Расхождение в поставке ПН-0929-01",
        exact: true,
      }),
    })
    .getByRole("link", { name: "Открыть источник" })
    .click();
  await expect(page.getByLabel("Комментарий к приёмке")).toHaveValue(
    "Не хватает 1 кг тыквы",
  );
  await expect(
    page.getByRole("button", { name: "Отметить оплату в демо" }),
  ).toHaveCount(0);
  await page
    .getByLabel("Основание исправления")
    .fill("Исправленная ПН-0929-01/1: принято 19 кг");
  await page
    .getByRole("button", { name: "Принять исправленный документ" })
    .click();
  await page
    .getByRole("button", { name: "Открыть накладную ПН-0929-01", exact: true })
    .click();
  await page.getByRole("button", { name: "Отметить оплату в демо" }).click();
  await expect(
    page.getByText("Оплата отмечена в демо. Деньги не переводились."),
  ).toBeVisible();
});
test("shift problem creates one assigned task and disappears after preparation", async ({
  page,
}) => {
  await page.goto("/demo/assistant");
  const problem = page.getByRole("article").filter({
    has: page.getByRole("heading", {
      name: "Заказ #1502 задерживается · Кухня",
      exact: true,
    }),
  });
  await problem.getByRole("button", { name: /Назначить разбор/ }).click();
  await expect(
    problem.getByText("Разбор назначен", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    problem.getByRole("button", { name: /Назначить разбор/ }),
  ).toHaveCount(0);
  await problem.getByRole("link", { name: "Открыть источник" }).click();
  await expect(page.getByLabel("Поиск заказов")).toHaveValue("#1502");
  const order = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /^#1502/ }) })
    .last();
  await order
    .getByRole("button", { name: /Готово/ })
    .first()
    .click();
  await order
    .getByRole("button", { name: /Готово/ })
    .first()
    .click();
  await page.goto("/demo/assistant");
  await expect(problem).toHaveCount(0);
  await page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", {
        name: "Готовность участка не подтверждена · Бар",
        exact: true,
      }),
    })
    .getByRole("link", { name: "Открыть источник" })
    .click();
  await expect(page.getByLabel("Участок чек-листов")).toHaveValue("bar");
  await expect(
    page.getByRole("heading", { name: "Готовность кухни", exact: true }),
  ).toHaveCount(0);
});
test("production routes remain fail-closed without Supabase", async ({
  page,
  request,
}) => {
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("button", { name: "Войти в ShiftOS" }),
  ).toBeDisabled();
  expect((await request.get("/api/health")).ok()).toBe(true);
  expect(
    (
      await request.post("/api/ai/briefing", {
        data: {},
        headers: { origin: "https://untrusted.example" },
      })
    ).status(),
  ).toBe(403);
  await page.goto("/demo/does-not-exist");
  await expect(
    page.getByRole("heading", { name: "Здесь пока пусто" }),
  ).toBeVisible();
});
