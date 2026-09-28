"use client";
import { useActionState } from "react";
import { createOrganization } from "@/modules/identity/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function OrganizationForm() {
  const [state, action, pending] = useActionState(createOrganization, {
    error: "",
  });
  return (
    <form action={action} className="space-y-4">
      <h2 className="text-lg font-semibold">Создать организацию</h2>
      <p className="text-xs leading-6 text-muted-foreground">
        Создадим рабочее пространство, первое заведение и назначим вам роль
        владельца.
      </p>
      <div>
        <label htmlFor="org-name" className="mb-2 block text-xs">
          Организация
        </label>
        <Input
          id="org-name"
          name="name"
          required
          minLength={2}
          maxLength={100}
          placeholder="Название компании"
        />
      </div>
      <div>
        <label htmlFor="restaurant-name" className="mb-2 block text-xs">
          Первое заведение
        </label>
        <Input
          id="restaurant-name"
          name="restaurant"
          required
          minLength={2}
          maxLength={100}
          placeholder="Например, Север · бистро"
        />
      </div>
      {state.error && (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      )}
      <Button disabled={pending} type="submit">
        {pending ? "Создаём…" : "Создать пространство"}
      </Button>
    </form>
  );
}
