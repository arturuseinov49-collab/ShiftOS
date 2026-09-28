"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-content-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Не удалось загрузить данные</h1>
      <p>Проверьте подключение и настройку базы.</p>
      <button className="text-primary underline" onClick={reset}>
        Повторить
      </button>
    </main>
  );
}
