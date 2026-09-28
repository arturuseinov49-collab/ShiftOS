import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ShiftOS — управление заведением",
  description:
    "Команда, задачи и стандарты вашего заведения в одном пространстве.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
