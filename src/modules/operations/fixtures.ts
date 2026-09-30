import {
  type DemoState,
  type Department,
  type Employee,
  type OperationTask,
  type Order,
  departments,
  demoDate,
  restaurants,
} from "./types";

export const taskTemplates: {
  id: string;
  title: string;
  department: Department;
  description: string;
}[] = [
  {
    id: "prep-kitchen",
    title: "Проверить готовность кухни",
    department: "kitchen",
    description:
      "Проверьте маркировку заготовок, остатки на смену и стоп-лист. Отклонения передайте администратору.",
  },
  {
    id: "prep-bar",
    title: "Подготовить барную станцию",
    department: "bar",
    description:
      "Проверьте лёд, заготовки, посуду и расходники. Сверьте стоп-лист напитков.",
  },
  {
    id: "prep-floor",
    title: "Подготовить зал к вечерней посадке",
    department: "floor",
    description:
      "Проверьте сервировку, чистоту столов, бронирования и готовность терминалов.",
  },
];
const employees: Employee[] = [
  {
    id: "e1",
    restaurantId: "north",
    name: "Анна Смирнова",
    position: "Администратор",
    department: "floor",
    active: true,
  },
  {
    id: "e2",
    restaurantId: "north",
    name: "Алексей Морозов",
    position: "Шеф-повар",
    department: "kitchen",
    active: true,
  },
  {
    id: "e3",
    restaurantId: "north",
    name: "Мария Кузнецова",
    position: "Официант",
    department: "floor",
    active: true,
  },
  {
    id: "e4",
    restaurantId: "north",
    name: "Дмитрий Волков",
    position: "Повар",
    department: "kitchen",
    active: true,
  },
  {
    id: "e6",
    restaurantId: "north",
    name: "Софья Белова",
    position: "Бармен",
    department: "bar",
    active: true,
  },
  {
    id: "e7",
    restaurantId: "north",
    name: "Максим Орлов",
    position: "Бариста",
    department: "bar",
    active: true,
  },
  {
    id: "e5",
    restaurantId: "ember",
    name: "Илья Романов",
    position: "Бар-менеджер",
    department: "bar",
    active: true,
  },
  {
    id: "e8",
    restaurantId: "ember",
    name: "Елена Соколова",
    position: "Повар",
    department: "kitchen",
    active: true,
  },
  {
    id: "e9",
    restaurantId: "ember",
    name: "Павел Лебедев",
    position: "Официант",
    department: "floor",
    active: true,
  },
];
const task = (
  id: string,
  title: string,
  department: Department,
  assigneeId: string,
  status: OperationTask["status"],
  hour: string,
  restaurantId = "north",
  priority: OperationTask["priority"] = "normal",
): OperationTask => ({
  id,
  restaurantId,
  title,
  department,
  assigneeId,
  status,
  priority,
  dueAt: `${demoDate}T${hour}`,
  description:
    "Выполните задачу по стандарту участка. Отклонения укажите в комментарии перед отправкой на проверку.",
  note: "",
});
export function createDemoState(): DemoState {
  const orders: Order[] = [];
  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const day = new Date(Date.UTC(2026, 8, 29 - daysAgo))
      .toISOString()
      .slice(0, 10);
    for (const [r, restaurant] of restaurants.entries()) {
      for (let index = 0; index < 9 + (daysAgo % 5); index++) {
        const totalMinor =
          (2100 + ((index * 431 + daysAgo * 73 + r * 127) % 4800)) * 100;
        orders.push({
          id: `${restaurant.id}-${day}-${index}`,
          externalId: `${day}-${index}`,
          connectionId: `pos-${restaurant.id}`,
          restaurantId: restaurant.id,
          provider: r === 0 ? "iiko" : "rkeeper",
          number: `#${1000 + (29 - daysAgo) * 15 + index}`,
          day,
          table: `Стол ${(index % 7) + 1}`,
          status: "closed",
          placedAt: `${day}T11:00:00+03:00`,
          closedAt: `${day}T12:00:00+03:00`,
          totalMinor,
          discountMinor: index % 4 === 0 ? Math.round(totalMinor * 0.1) : 0,
          refundMinor: index === 2 && daysAgo === 1 ? 72000 : 0,
          costMinor: Math.round(totalMinor * 0.31),
          items: [
            {
              title: "Блюда кухни",
              department: "kitchen",
              quantity: 3,
              ready: true,
            },
            { title: "Напитки", department: "bar", quantity: 2, ready: true },
          ],
        });
      }
      for (let i = 0; i < 4; i++) {
        if (daysAgo !== 0) continue;
        orders.push({
          id: `active-${restaurant.id}-${i}`,
          externalId: `active-${i}`,
          connectionId: `pos-${restaurant.id}`,
          restaurantId: restaurant.id,
          provider: r === 0 ? "iiko" : "rkeeper",
          number: `#${1501 + i}`,
          day,
          table: i === 3 ? "С собой" : `Стол ${3 + i}`,
          status: i === 0 ? "new" : "preparing",
          placedAt: `${day}T15:${i === 0 ? "56" : i === 1 ? "38" : "48"}:00+03:00`,
          closedAt: null,
          totalMinor: (2450 + i * 570) * 100,
          discountMinor: 0,
          refundMinor: 0,
          costMinor: 90000,
          items: [
            {
              title: "Тыквенный суп",
              department: "kitchen",
              quantity: 2,
              ready: i === 2,
            },
            {
              title: "Бриошь с лососем",
              department: "kitchen",
              quantity: 1,
              ready: false,
            },
            {
              title: "Фильтр-кофе",
              department: "bar",
              quantity: 2,
              ready: i > 1,
            },
          ],
        });
      }
    }
  }
  return {
    version: 2,
    restaurantId: "north",
    role: "owner",
    employeeId: "e3",
    employees: structuredClone(employees),
    tasks: [
      task(
        "t1",
        "Проверить поставку от фермеров",
        "kitchen",
        "e2",
        "todo",
        "15:00",
        "north",
        "high",
      ),
      task(
        "t2",
        "Подготовить зал к вечерней посадке",
        "floor",
        "e3",
        "in_progress",
        "17:00",
      ),
      task("t3", "Подготовить барную станцию", "bar", "e6", "review", "16:00"),
      task("t4", "Проверить стоп-лист кухни", "kitchen", "e4", "done", "11:00"),
      task("t5", "Обновить выкладку десертов", "floor", "e3", "done", "11:30"),
      task("t8", "Сверить бронирования на вечер", "floor", "", "todo", "17:30"),
      task("t9", "Проверить запас молока", "bar", "", "todo", "16:30"),
      task(
        "t6",
        "Подготовить заготовки для коктейлей",
        "bar",
        "e5",
        "todo",
        "18:00",
        "ember",
        "high",
      ),
      task(
        "t7",
        "Проверить барный инвентарь",
        "bar",
        "e5",
        "done",
        "16:00",
        "ember",
      ),
      task(
        "t10",
        "Подготовить холодный цех",
        "kitchen",
        "e8",
        "todo",
        "17:00",
        "ember",
      ),
      task(
        "t11",
        "Проверить сервировку",
        "floor",
        "e9",
        "in_progress",
        "17:30",
        "ember",
      ),
    ],
    areas: restaurants.flatMap((r) =>
      departments.map((department) => ({
        restaurantId: r.id,
        department,
        leadId: employees.find(
          (e) => e.restaurantId === r.id && e.department === department,
        )!.id,
        opens: r.id === "north" ? "09:00" : "16:00",
        closes: r.id === "north" ? "23:00" : "02:00",
        targetMinutes:
          department === "kitchen" ? 20 : department === "bar" ? 8 : 5,
      })),
    ),
    checklists: restaurants.flatMap((r) =>
      departments.map((department, d) => ({
        id: `${r.id}-${department}`,
        restaurantId: r.id,
        department,
        title:
          department === "kitchen"
            ? "Готовность кухни"
            : department === "bar"
              ? "Открытие бара"
              : "Открытие зала",
        items: (department === "kitchen"
          ? [
              "Проверить температуры хранения",
              "Проверить маркировку заготовок",
              "Сверить стоп-лист",
            ]
          : department === "bar"
            ? [
                "Проверить лёд и заготовки",
                "Подготовить станцию",
                "Проверить посуду",
              ]
            : [
                "Проверить сервировку",
                "Проверить освещение и музыку",
                "Проверить бронирования",
              ]
        ).map((title, i) => ({
          id: `${department}-${i}`,
          title,
          done: i < (d === 0 ? 2 : 1),
        })),
      })),
    ),
    orders,
    expenses: restaurants.flatMap((r, ri) =>
      Array.from({ length: 30 }, (_, i) => {
        const day = new Date(Date.UTC(2026, 8, i)).toISOString().slice(0, 10);
        return [
          {
            id: `${r.id}-payroll-${i}`,
            restaurantId: r.id,
            day,
            title: "Оплата смены",
            category: "payroll" as const,
            amountMinor: (ri ? 11500 : 13000) * 100,
          },
          {
            id: `${r.id}-rent-${i}`,
            restaurantId: r.id,
            day,
            title: "Аренда, начисление за день",
            category: "rent" as const,
            amountMinor: (ri ? 4500 : 6000) * 100,
          },
          {
            id: `${r.id}-services-${i}`,
            restaurantId: r.id,
            day,
            title: "Коммунальные и сервисы",
            category: "services" as const,
            amountMinor: 1800 * 100,
          },
        ];
      }).flat(),
    ),
    invoices: restaurants.flatMap((r) => [
      {
        id: `invoice-${r.id}-1`,
        restaurantId: r.id,
        number: "ПН-0929-01",
        supplier: "Фермерское хозяйство «Рассвет»",
        day: demoDate,
        dueDay: "2026-10-02",
        department: "kitchen" as const,
        status: "expected" as const,
        paid: false,
        note: "",
        items: [
          {
            id: "veg",
            title: "Тыква",
            unit: "кг",
            quantity: 20,
            received: 20,
            priceMinor: 14000,
          },
          {
            id: "fish",
            title: "Лосось",
            unit: "кг",
            quantity: 8,
            received: 8,
            priceMinor: 175000,
          },
        ],
      },
      {
        id: `invoice-${r.id}-2`,
        restaurantId: r.id,
        number: "ПН-0928-04",
        supplier: "Coffee & Co",
        day: "2026-09-28",
        dueDay: "2026-09-28",
        department: "bar" as const,
        status: "received" as const,
        paid: false,
        note: "",
        items: [
          {
            id: "coffee",
            title: "Зерно Эфиопия",
            unit: "кг",
            quantity: 5,
            received: 5,
            priceMinor: 220000,
          },
        ],
      },
      {
        id: `invoice-${r.id}-3`,
        restaurantId: r.id,
        number: "ПН-0927-02",
        supplier: "Чистый зал",
        day: "2026-09-27",
        dueDay: "2026-10-01",
        department: "floor" as const,
        status: "discrepancy" as const,
        paid: false,
        note: "Не хватает двух упаковок салфеток. Поставщик уведомлён.",
        items: [
          {
            id: "napkin",
            title: "Салфетки",
            unit: "уп.",
            quantity: 12,
            received: 10,
            priceMinor: 35000,
          },
        ],
      },
    ]),
    connections: [
      {
        id: "pos-north",
        restaurantId: "north",
        provider: "iiko",
        externalRestaurant: "DEMO-NORTH",
        orders: true,
        inventory: true,
        state: "draft",
        lastSync: null,
        log: [],
      },
      {
        id: "pos-ember",
        restaurantId: "ember",
        provider: "rkeeper",
        externalRestaurant: "DEMO-EMBER",
        orders: true,
        inventory: true,
        state: "draft",
        lastSync: null,
        log: [],
      },
    ],
  };
}
