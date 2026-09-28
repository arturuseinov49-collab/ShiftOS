import { notFound } from "next/navigation";
import { Workspace } from "@/components/workspace/workspace";
import { demoWorkspace } from "@/modules/workspace/demo";
import { sections, type Section } from "@/modules/workspace/types";
export default async function DemoPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const { section: path = [] } = await params;
  const section = path[0] ?? "dashboard";
  if (path.length > 1 || !sections.includes(section as Section)) notFound();
  return (
    <Workspace
      key={section}
      data={demoWorkspace}
      section={section as Section}
    />
  );
}
