import { notFound } from "next/navigation";
import { DemoWorkspace } from "@/components/demo/workspace";
import { demoSections, type DemoSection } from "@/modules/operations/types";
export default async function DemoPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const { section: path = [] } = await params;
  const section = path[0] ?? "dashboard";
  if (path.length > 1 || !demoSections.includes(section as DemoSection))
    notFound();
  return <DemoWorkspace key={section} section={section as DemoSection} />;
}
