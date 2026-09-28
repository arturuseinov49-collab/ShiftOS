"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function AuthForm({ configured }: { configured: boolean }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));
    try {
      const db = createClient();
      if (mode === "signup") {
        const { error } = await db.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        setMessage(
          error
            ? "Не удалось зарегистрироваться. Проверьте данные или попробуйте позже."
            : "Если адрес доступен для регистрации, на него придёт письмо. Подтвердите почту и войдите.",
        );
      } else {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error)
          setMessage(
            "Не удалось войти. Проверьте почту, пароль и подтверждение адреса.",
          );
        else {
          router.push("/workspace");
          router.refresh();
        }
      }
    } catch {
      setMessage("Сервис входа недоступен. Попробуйте позже.");
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-xs">
            Электронная почта
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={!configured}
            placeholder="you@restaurant.ru"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-xs">
            Пароль
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={mode === "signup" ? 12 : 1}
            maxLength={128}
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            disabled={!configured}
          />
          {mode === "signup" && (
            <p className="mt-2 text-[10px] text-muted-foreground">
              Не менее 12 символов.
            </p>
          )}
        </div>
        <Button
          disabled={!configured || pending}
          className="w-full"
          type="submit"
        >
          {pending
            ? "Подождите…"
            : mode === "login"
              ? "Войти в ShiftOS"
              : "Создать аккаунт"}
        </Button>
      </form>
      {message && (
        <p role="status" className="mt-4 text-xs leading-6">
          {message}
        </p>
      )}
      <button
        disabled={!configured}
        className="mt-5 w-full text-center text-xs text-muted-foreground disabled:opacity-50"
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setMessage("");
        }}
      >
        {mode === "login"
          ? "Нет аккаунта? Зарегистрироваться"
          : "Уже есть аккаунт? Войти"}
      </button>
    </>
  );
}
