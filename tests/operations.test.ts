import { describe, expect, it } from "vitest";
import { createDemoState } from "../src/modules/operations/fixtures";
import {
  allowedSections,
  visibleTasks,
  saveTask,
  transitionTask,
  distributeTasks,
  prepareShift,
  toggleCheck,
  receiveInvoice,
  payInvoice,
  markOrderItem,
  closeOrder,
  acceptCorrectedInvoice,
  invoiceTotal,
} from "../src/modules/operations/logic";
import {
  shiftProblems,
  assignProblem,
} from "../src/modules/operations/problems";
import { demoNow, type Actor } from "../src/modules/operations/types";
import { restoreDemo } from "../src/modules/operations/storage";
import { financials, addExpense } from "../src/modules/finance/calculations";
import {
  demoAdapter,
  saveConnection,
  mergeDemoBatch,
} from "../src/modules/integrations/demo-adapter";
const owner: Actor = { role: "owner", employeeId: "e3" };
const admin: Actor = { role: "admin", employeeId: "e3" };
const employee: Actor = { role: "employee", employeeId: "e3" };
describe("demo operations permissions and workflow", () => {
  it("employee sees own assignments and unassigned work only in their area", () => {
    const s = createDemoState();
    expect(
      visibleTasks(s, employee)
        .map((t) => t.id)
        .sort(),
    ).toEqual(["t2", "t5", "t8"]);
    expect(allowedSections(employee)).not.toContain("finance");
    expect(allowedSections(admin)).not.toContain("integrations");
    expect(allowedSections(owner)).toContain("finance");
    expect(visibleTasks({ ...s, restaurantId: "ember" }, employee)).toEqual([]);
  });
  it("staff claim a task and send a result but cannot approve it", () => {
    let s = transitionTask(createDemoState(), employee, "t8", "in_progress");
    expect(s.tasks.find((t) => t.id === "t8")?.assigneeId).toBe("e3");
    expect(() => transitionTask(s, employee, "t8", "review")).toThrow();
    s = transitionTask(s, employee, "t8", "review", "Бронирования сверены");
    expect(() => transitionTask(s, employee, "t8", "done")).toThrow();
    s = transitionTask(s, admin, "t8", "done");
    expect(s.tasks.find((t) => t.id === "t8")).toMatchObject({
      status: "done",
      note: "Бронирования сверены",
    });
    expect(() => transitionTask(s, employee, "t1", "in_progress")).toThrow();
  });
  it("assignments cannot cross departments or restaurants", () => {
    const s = createDemoState();
    const task = s.tasks[0];
    expect(() => saveTask(s, admin, { ...task, assigneeId: "e3" })).toThrow();
    expect(() => saveTask(s, admin, { ...task, assigneeId: "e8" })).toThrow();
    expect(() => saveTask(s, employee, task)).toThrow();
    const distributed = distributeTasks(s, admin);
    expect(distributed.tasks.find((t) => t.id === "t8")?.assigneeId).toBe("e1");
    expect(distributed.tasks.find((t) => t.id === "t9")?.assigneeId).toBe("e7");
    expect(distributed.tasks.filter((t) => t.restaurantId === "ember")).toEqual(
      s.tasks.filter((t) => t.restaurantId === "ember"),
    );
  });
  it("shift tasks use area lead and cannot be duplicated", () => {
    const s = prepareShift(createDemoState(), admin, "bar");
    const again = prepareShift(s, admin, "bar");
    expect(again.tasks).toHaveLength(s.tasks.length);
    expect(again.tasks[0]).toMatchObject({
      assigneeId: "e6",
      department: "bar",
      dueAt: "2026-09-29T09:00",
    });
    expect(() => toggleCheck(s, employee, "north-bar", "bar-1")).toThrow();
    expect(
      toggleCheck(s, employee, "north-floor", "floor-1").checklists.find(
        (c) => c.id === "north-floor",
      )?.items[1].done,
    ).toBe(true);
  });
  it("kitchen cannot prepare drinks and only a ready order can close", () => {
    let s = createDemoState();
    const chef: Actor = { role: "employee", employeeId: "e2" };
    expect(() => markOrderItem(s, chef, "active-north-0", 2)).toThrow();
    expect(() => closeOrder(s, employee, "active-north-0")).toThrow();
    s = markOrderItem(s, chef, "active-north-0", 0);
    s = markOrderItem(s, chef, "active-north-0", 1);
    s = markOrderItem(
      s,
      { role: "employee", employeeId: "e6" },
      "active-north-0",
      2,
    );
    expect(() => closeOrder(s, chef, "active-north-0")).toThrow();
    expect(
      closeOrder(s, employee, "active-north-0").orders.find(
        (o) => o.id === "active-north-0",
      ),
    ).toMatchObject({ status: "closed", closedAt: demoNow });
  });
  it("requires shortage explanation and restricts payment to owner", () => {
    const s = createDemoState();
    expect(() =>
      receiveInvoice(s, admin, "invoice-north-1", [19, 8], ""),
    ).toThrow();
    const received = receiveInvoice(
      s,
      admin,
      "invoice-north-1",
      [19, 8],
      "Не хватает 1 кг тыквы",
    );
    expect(received.invoices[0].status).toBe("discrepancy");
    expect(() => payInvoice(received, owner, "invoice-north-1")).toThrow();
    expect(() =>
      acceptCorrectedInvoice(
        received,
        employee,
        "invoice-north-1",
        "Документ 42",
      ),
    ).toThrow();
    expect(() =>
      acceptCorrectedInvoice(received, admin, "invoice-north-1", ""),
    ).toThrow();
    const corrected = acceptCorrectedInvoice(
      received,
      admin,
      "invoice-north-1",
      "Документ 42: оплачиваем только 19 кг",
    );
    expect(corrected.invoices[0].status).toBe("received");
    expect(invoiceTotal(corrected.invoices[0])).toBe(
      invoiceTotal(s.invoices[0]) - s.invoices[0].items[0].priceMinor,
    );
    expect(corrected.invoices[0].note).toContain("Не хватает 1 кг");
    expect(
      payInvoice(corrected, owner, "invoice-north-1").invoices[0].paid,
    ).toBe(true);
    expect(() => payInvoice(s, admin, "invoice-north-2")).toThrow();
    expect(payInvoice(s, owner, "invoice-north-2").invoices[1].paid).toBe(true);
  });
  it("rejects damaged snapshots", () => {
    const s = createDemoState();
    expect(restoreDemo(JSON.stringify(s))).toEqual(s);
    expect(restoreDemo("not JSON")).toBeNull();
    expect(restoreDemo(JSON.stringify({ ...s, areas: [] }))).toBeNull();
    expect(
      restoreDemo(JSON.stringify({ ...s, employeeId: "missing" })),
    ).toBeNull();
  });
});
describe("restaurant problems lead to scoped actions", () => {
  it("detects an actual delay, assigns once and clears it when dishes are ready", () => {
    let s = createDemoState();
    const problem = shiftProblems(s, admin).find(
      (p) => p.id === "delay-active-north-1-kitchen",
    )!;
    expect(problem.evidence).toContain("22 мин");
    expect(problem.evidence).toContain("норматив участка 20 мин");
    expect(shiftProblems(s, employee)).toEqual([]);
    expect(() => assignProblem(s, employee, problem.id)).toThrow();
    s = assignProblem(s, admin, problem.id);
    const count = s.tasks.length;
    s = assignProblem(s, admin, problem.id);
    expect(s.tasks).toHaveLength(count);
    expect(s.tasks[0]).toMatchObject({
      restaurantId: "north",
      department: "kitchen",
      assigneeId: "e2",
    });
    s = markOrderItem(s, admin, "active-north-1", 0);
    s = markOrderItem(s, admin, "active-north-1", 1);
    expect(shiftProblems(s, admin).some((p) => p.id === problem.id)).toBe(
      false,
    );
    expect(() => assignProblem(s, admin, problem.id)).toThrow();
    expect(
      shiftProblems({ ...s, restaurantId: "ember" }, admin).some((p) =>
        p.id.includes("north"),
      ),
    ).toBe(false);
  });
  it("does not disclose owner financial facts through shared tasks", () => {
    const s = addExpense(createDemoState(), owner, {
      id: "loss",
      restaurantId: "north",
      day: "2026-09-29",
      category: "other",
      title: "Ремонт",
      amountMinor: 20000000,
    });
    const loss = shiftProblems(s, owner).find(
      (p) => p.href === "/demo/finance",
    )!;
    expect(loss).toBeDefined();
    expect(
      shiftProblems(s, admin).some((p) => p.href === "/demo/finance"),
    ).toBe(false);
    expect(() => assignProblem(s, owner, loss.id)).toThrow();
  });
});
describe("owner management accounting", () => {
  it("nets refunds and discounts, excludes open orders and scopes venue/date", () => {
    const s = createDemoState();
    const sample = s.orders[0];
    s.orders = [
      {
        ...sample,
        id: "one",
        restaurantId: "north",
        day: "2026-09-29",
        status: "closed",
        totalMinor: 10000,
        discountMinor: 1000,
        refundMinor: 1000,
        costMinor: 3000,
      },
      {
        ...sample,
        id: "two",
        restaurantId: "north",
        day: "2026-09-29",
        status: "new",
        totalMinor: 99000,
      },
      {
        ...sample,
        id: "other",
        restaurantId: "ember",
        day: "2026-09-29",
        status: "closed",
        totalMinor: 99999,
      },
      {
        ...sample,
        id: "old",
        restaurantId: "north",
        day: "2026-09-28",
        status: "closed",
        totalMinor: 99999,
      },
    ];
    s.expenses = [
      {
        id: "salary",
        restaurantId: "north",
        day: "2026-09-29",
        category: "payroll",
        title: "Смена",
        amountMinor: 2000,
      },
    ];
    expect(financials(s, "north", "2026-09-29", "2026-09-29")).toMatchObject({
      revenue: 8000,
      cost: 3000,
      operating: 2000,
      profit: 3000,
      count: 1,
      average: 8000,
      margin: 37.5,
    });
    const loss = addExpense(s, owner, {
      id: "loss",
      restaurantId: "north",
      day: "2026-09-29",
      category: "other",
      title: "Ремонт",
      amountMinor: 7000,
    });
    expect(financials(loss, "north", "2026-09-29", "2026-09-29").profit).toBe(
      -4000,
    );
    expect(() => addExpense(s, admin, s.expenses[0])).toThrow();
  });
});
describe("independent POS demo adapters", () => {
  it("imports both providers into separate venues and safely replays", async () => {
    let s = createDemoState();
    s = saveConnection(s, owner, s.connections[0]);
    const batch = await demoAdapter("iiko").pull(s.connections[0]);
    const before = s.orders.length;
    s = mergeDemoBatch(s, owner, "pos-north", batch);
    expect(s.orders).toHaveLength(before + 2);
    const after = mergeDemoBatch(s, owner, "pos-north", batch);
    expect(after.orders).toEqual(s.orders);
    expect(after.invoices).toEqual(s.invoices);
    s = { ...s, restaurantId: "ember", employeeId: "e5" };
    s = saveConnection(s, owner, s.connections[1]);
    s = mergeDemoBatch(
      s,
      owner,
      "pos-ember",
      await demoAdapter("rkeeper").pull(s.connections[1]),
    );
    expect(s.orders).toHaveLength(before + 4);
    expect(s.connections.filter((c) => c.state === "ready")).toHaveLength(2);
  });
  it("rejects cross-venue batches, staff configuration, duplicate sales sources", async () => {
    let s = createDemoState();
    expect(() => saveConnection(s, admin, s.connections[0])).toThrow();
    expect(() =>
      saveConnection(s, owner, {
        ...s.connections[1],
        id: "duplicate",
        restaurantId: "north",
      }),
    ).toThrow();
    s = saveConnection(s, owner, s.connections[0]);
    const bad = await demoAdapter("iiko").pull({
      ...s.connections[0],
      restaurantId: "ember",
    });
    expect(() => mergeDemoBatch(s, owner, "pos-north", bad)).toThrow();
  });
});
