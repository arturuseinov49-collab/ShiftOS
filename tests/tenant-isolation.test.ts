import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { testDatabase } from "../scripts/test-database.mjs";

const alice = "10000000-0000-4000-8000-000000000001";
const bob = "10000000-0000-4000-8000-000000000002";
const staff = "10000000-0000-4000-8000-000000000003";
let db: Awaited<ReturnType<typeof testDatabase>>;
let orgA: string;
let orgB: string;
let restaurantA: string;
let restaurantB: string;
async function asUser(id: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
  await db.exec("set role authenticated");
}
async function scalar(sql: string, params: string[] = []) {
  const { rows } = await db.query<Record<string, string>>(sql, params);
  return Object.values(rows[0])[0];
}
beforeAll(async () => {
  db = await testDatabase();
  await db.query("insert into auth.users (id) values ($1), ($2), ($3)", [
    alice,
    bob,
    staff,
  ]);
  await asUser(alice);
  orgA = await scalar(
    "select public.create_organization('Alpha', 'Alpha bar')",
  );
  restaurantA = await scalar(
    "select id from restaurants where organization_id = $1",
    [orgA],
  );
  await asUser(bob);
  orgB = await scalar("select public.create_organization('Beta', 'Beta bar')");
  restaurantB = await scalar(
    "select id from restaurants where organization_id = $1",
    [orgB],
  );
  await db.exec("reset role");
  await db.query(
    "insert into memberships (organization_id,user_id,role_id) select $1,$2,id from roles where organization_id=$1 and key='staff'",
    [orgA, staff],
  );
});
afterAll(async () => {
  await db?.close();
});

describe("PostgreSQL tenant isolation", () => {
  it("enables RLS on every exposed table and denies anon grants", async () => {
    await db.exec("reset role");
    const { rows } = await db.query(
      "select relname from pg_class join pg_namespace on relnamespace=pg_namespace.oid where nspname='public' and relkind='r' and not relrowsecurity",
    );
    expect(rows).toEqual([]);
    const grants = await db.query(
      "select table_name from information_schema.role_table_grants where grantee='anon' and table_schema='public'",
    );
    expect(grants.rows).toEqual([]);
  });
  it("allows owners to see only their own organization", async () => {
    await asUser(alice);
    expect((await db.query("select id from organizations")).rows).toEqual([
      { id: orgA },
    ]);
    expect(
      (
        await db.query("select id from restaurants where organization_id=$1", [
          orgB,
        ])
      ).rows,
    ).toEqual([]);
  });
  it("rejects cross-tenant insert", async () => {
    await asUser(alice);
    await expect(
      db.query(
        "insert into tasks (organization_id,restaurant_id,title) values ($1,$2,'Wrong tenant')",
        [orgB, restaurantB],
      ),
    ).rejects.toThrow(/row-level security/);
  });
  it("rejects a foreign restaurant attached to own tenant", async () => {
    await asUser(alice);
    await expect(
      db.query(
        "insert into tasks (organization_id,restaurant_id,title) values ($1,$2,'Wrong link')",
        [orgA, restaurantB],
      ),
    ).rejects.toThrow(/foreign key/);
  });
  it("allows owner task create/update/delete and rejects forged author", async () => {
    await asUser(alice);
    const id = await scalar(
      "insert into tasks (organization_id,restaurant_id,title) values ($1,$2,'Owner task') returning id",
      [orgA, restaurantA],
    );
    await db.query("update tasks set status='done' where id=$1", [id]);
    expect(await scalar("select status from tasks where id=$1", [id])).toBe(
      "done",
    );
    await expect(
      db.query(
        "insert into tasks (organization_id,restaurant_id,title,created_by) values ($1,$2,'Forged',$3)",
        [orgA, restaurantA, staff],
      ),
    ).rejects.toThrow(/row-level security/);
    await asUser(bob);
    expect(
      (
        await db.query(
          "update tasks set title='hacked' where id=$1 returning id",
          [id],
        )
      ).rows,
    ).toEqual([]);
    expect(
      (await db.query("delete from tasks where id=$1 returning id", [id])).rows,
    ).toEqual([]);
    await asUser(alice);
    expect(
      (await db.query("delete from tasks where id=$1 returning id", [id])).rows,
    ).toHaveLength(1);
  });
  it("denies role or membership self-escalation even to an owner", async () => {
    await asUser(staff);
    await expect(
      db.query(
        "update memberships set role_id=(select id from roles where key='owner' and organization_id=$1) where user_id=$2",
        [orgA, staff],
      ),
    ).rejects.toThrow(/permission denied/);
    await asUser(alice);
    await expect(
      db.query("delete from role_permissions where organization_id=$1", [orgA]),
    ).rejects.toThrow(/permission denied/);
  });
  it("staff can read menu but cannot modify menu or issue scores", async () => {
    await asUser(staff);
    expect(
      await scalar("select has_permission($1, 'menu.read')::text", [orgA]),
    ).toBe("true");
    await expect(
      db.query(
        "insert into menu_categories (organization_id,name) values ($1,'Hacked')",
        [orgA],
      ),
    ).rejects.toThrow(/row-level security/);
    await expect(
      db.query("delete from test_attempts where organization_id=$1", [orgA]),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db.query("select * from private.test_answer_keys"),
    ).rejects.toThrow(/permission denied/);
  });
  it("revoked membership loses access immediately", async () => {
    await db.exec("reset role");
    await db.query(
      "update memberships set status='suspended' where user_id=$1",
      [staff],
    );
    await asUser(staff);
    expect(
      await scalar("select has_permission($1,'menu.read')::text", [orgA]),
    ).toBe("false");
    expect((await db.query("select * from organizations")).rows).toEqual([]);
    await db.exec("reset role");
    await db.query("update memberships set status='active' where user_id=$1", [
      staff,
    ]);
  });
  it("keeps storage private and isolates all object operations", async () => {
    await asUser(alice);
    const path = orgA + "/test.pdf";
    await db.query(
      "insert into storage.objects(bucket_id,name) values ('organization-files',$1)",
      [path],
    );
    await expect(
      db.query(
        "insert into storage.objects(bucket_id,name) values ('organization-files','invalid/test.pdf')",
      ),
    ).rejects.toThrow(/row-level security/);
    await asUser(bob);
    expect((await db.query("select * from storage.objects")).rows).toEqual([]);
    await expect(
      db.query(
        "insert into storage.objects(bucket_id,name) values ('organization-files',$1)",
        [path],
      ),
    ).rejects.toThrow(/row-level security/);
    expect(
      (
        await db.query(
          "update storage.objects set name='x/y' where name=$1 returning id",
          [path],
        )
      ).rows,
    ).toEqual([]);
    expect(
      (
        await db.query(
          "delete from storage.objects where name=$1 returning id",
          [path],
        )
      ).rows,
    ).toEqual([]);
    await asUser(alice);
    await expect(
      db.query("update storage.objects set name=$1 where name=$2", [
        orgB + "/moved.pdf",
        path,
      ]),
    ).rejects.toThrow(/row-level security/);
    expect(
      (
        await db.query(
          "delete from storage.objects where name=$1 returning id",
          [path],
        )
      ).rows,
    ).toHaveLength(1);
  });
  it("rolls back invalid onboarding without orphan organizations", async () => {
    await asUser(alice);
    await expect(
      db.query("select create_organization('Good name','x')"),
    ).rejects.toThrow(/2-100/);
    expect((await db.query("select id from organizations")).rows).toHaveLength(
      1,
    );
  });
  it("denies unauthenticated onboarding", async () => {
    await db.exec("reset role; set role anon");
    await expect(
      db.query("select create_organization('No identity','No identity')"),
    ).rejects.toThrow(/permission denied/);
  });
});
