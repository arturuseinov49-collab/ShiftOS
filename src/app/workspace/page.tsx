import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/modules/identity/tenant";
import { signOut } from "@/modules/identity/actions";
import { Brand } from "@/components/workspace/navigation";
import { OrganizationForm } from "@/components/organization-form";
import { Button } from "@/components/ui/button";
export const dynamic = "force-dynamic";
export default async function WorkspacePicker() {
  const context = await requireUser().catch(() => null);
  if (!context) redirect("/login");
  const { data, error } = await context.db
    .from("organizations")
    .select("id,name")
    .order("created_at");
  if (error) throw new Error("Organizations unavailable");
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <div className="mb-10 flex items-center justify-between">
        <Brand />
        <form action={signOut}>
          <Button variant="outline" type="submit">
            Выйти
          </Button>
        </form>
      </div>
      <h1 className="mb-8 text-3xl font-semibold">Мои организации</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          {data.length ? (
            data.map((o) => (
              <Link
                href={`/workspace/${o.id}/dashboard`}
                key={o.id}
                className="block rounded-xl border bg-white p-6 font-medium hover:border-primary"
              >
                {o.name} →
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Создайте первое рабочее пространство.
            </p>
          )}
        </div>
        <section className="rounded-xl border bg-white p-6">
          <OrganizationForm />
        </section>
      </div>
    </main>
  );
}
