import { test, expect } from "@playwright/test";
test("demo tasks, persistence, tenant filter, navigation and responsive layout", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/demo");
  await expect(
    page.getByRole("heading", { name: "Хороший день начинается с порядка" }),
  ).toBeVisible();
  await expect(
    page.getByText("Демо-данные · изменения только в браузере"),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/shiftos-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Новая задача" }).click();
  await page
    .getByLabel("Что нужно сделать?")
    .fill("Проверить тестовую поставку");
  await page
    .getByRole("button", { name: "Создать задачу", exact: true })
    .click();
  await expect(
    page.getByText("Проверить тестовую поставку", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Выполнить: Проверить тестовую поставку",
      exact: true,
    })
    .click();
  await page.goto("/demo/tasks");
  await expect(
    page.getByRole("button", {
      name: "Вернуть: Проверить тестовую поставку",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Поиск задач").fill("тестовую");
  await expect(
    page.getByText("Проверить тестовую поставку", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Выберите заведение").selectOption("ember");
  await expect(
    page.getByText("Проверить тестовую поставку", { exact: true }),
  ).toHaveCount(0);
  await page.goto("/demo/checklists");
  await expect(
    page.getByRole("heading", { name: "Открытие бара" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Подготовить станцию" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Подготовить станцию" }).locator("svg"),
  ).toHaveClass(/lucide-circle-check|lucide-check-circle/);
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Открыть меню" }).click();
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Обучение" })
      .click();
  } else {
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Обучение" })
      .click();
  }
  await page.getByRole("button", { name: "Открыть материал" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(errors).toEqual([]);
});
test("protected pages fail closed without Supabase and login offers demo", async ({
  page,
  request,
}) => {
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("button", { name: "Войти в ShiftOS" }),
  ).toBeDisabled();
  const health = await request.get("/api/health");
  expect(health.ok()).toBe(true);
  const ai = await request.post("/api/ai/briefing", {
    data: {},
    headers: { origin: "https://untrusted.example" },
  });
  expect(ai.status()).toBe(403);
  await page.goto("/demo/does-not-exist");
  await expect(
    page.getByRole("heading", { name: "Здесь пока пусто" }),
  ).toBeVisible();
});
