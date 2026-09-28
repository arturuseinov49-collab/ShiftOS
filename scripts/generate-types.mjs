import { writeFile } from "node:fs/promises";
import { format } from "prettier";
import { testDatabase } from "./test-database.mjs";
const db = await testDatabase();
try {
  const { rows } =
    await db.query(`select c.table_name, c.column_name, c.is_nullable, c.column_default, c.udt_name
    from information_schema.columns c where c.table_schema = 'public' order by c.table_name, c.ordinal_position`);
  const tables = Object.groupBy(rows, (row) => row.table_name);
  const type = (c) =>
    (({
      uuid: "string",
      text: "string",
      timestamptz: "string",
      int4: "number",
      int8: "number",
      numeric: "number",
      bool: "boolean",
      jsonb: "Json",
      _text: "string[]",
    })[c.udt_name] ?? "unknown") + (c.is_nullable === "YES" ? " | null" : "");
  let output =
    "// Generated from the checked-in SQL migrations by npm run db:types. Do not edit.\n";
  output +=
    "export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];\n";
  output += "export type Database = { public: { Tables: {\n";
  for (const [name, columns] of Object.entries(tables)) {
    output +=
      `  ${name}: {\n    Row: {\n` +
      columns.map((c) => `      ${c.column_name}: ${type(c)};`).join("\n") +
      "\n    };\n";
    output +=
      "    Insert: {\n" +
      columns
        .map(
          (c) =>
            `      ${c.column_name}${c.column_default || c.is_nullable === "YES" ? "?" : ""}: ${type(c)};`,
        )
        .join("\n") +
      "\n    };\n";
    output +=
      "    Update: {\n" +
      columns.map((c) => `      ${c.column_name}?: ${type(c)};`).join("\n") +
      "\n    };\n    Relationships: [];\n  };\n";
  }
  output += `}; Views: { [_ in never]: never }; Functions: {
    has_permission: { Args: { org_id: string; permission: string }; Returns: boolean };
    create_organization: { Args: { organization_name: string; restaurant_name: string }; Returns: string };
  }; Enums: { [_ in never]: never }; CompositeTypes: { [_ in never]: never } } };\n`;
  await writeFile(
    new URL("../src/lib/supabase/database.types.ts", import.meta.url),
    await format(output, { parser: "typescript" }),
  );
  console.log("Database types generated from migrations.");
} finally {
  await db.close();
}
