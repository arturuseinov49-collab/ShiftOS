import Link from "next/link";
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-content-center gap-4 p-6 text-center">
      <p className="text-sm text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold">Здесь пока пусто</h1>
      <Link className="text-primary underline" href="/demo">
        Вернуться в ShiftOS
      </Link>
    </main>
  );
}
