import type { ReactNode } from "react";
import { DemoProvider } from "@/components/demo/provider";
export default function DemoLayout({ children }: { children: ReactNode }) {
  return <DemoProvider>{children}</DemoProvider>;
}
