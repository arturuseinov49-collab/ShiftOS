import Link from "next/link";
import { supabaseConfig } from "@/lib/env";
import { Brand } from "@/components/workspace/navigation";
import { AuthForm } from "@/components/auth-form";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const configured = !!supabaseConfig();
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center p-5">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <section className="rounded-2xl border bg-white p-7 sm:p-9">
          <h1 className="mb-2 text-2xl font-semibold">Добро пожаловать</h1>
          <p className="mb-7 text-sm text-muted-foreground">
            Ваше заведение начинается здесь.
          </p>
          {!configured && (
            <p className="mb-6 rounded-lg bg-[#faf2e5] p-4 text-xs leading-6 text-[#957544]">
              Вход станет доступен после подключения Supabase. Сейчас можно
              открыть демо и попробовать интерфейс.
            </p>
          )}
          {error && (
            <p role="alert" className="mb-4 text-xs text-destructive">
              Ссылка не сработала или доступ к организации закрыт. Войдите
              снова.
            </p>
          )}
          <AuthForm configured={configured} />
        </section>
        <Link
          href="/demo"
          className="mt-6 block text-center text-sm text-muted-foreground hover:text-primary"
        >
          ← Посмотреть демо-пространство
        </Link>
      </div>
    </main>
  );
}
