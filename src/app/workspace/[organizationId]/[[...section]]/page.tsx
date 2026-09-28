import { notFound, redirect } from "next/navigation";
import { Workspace } from "@/components/workspace/workspace";
import { loadWorkspace } from "@/modules/workspace/repository";
import { AccessError } from "@/modules/identity/tenant";
import { sections, type Section } from "@/modules/workspace/types";
export const dynamic = "force-dynamic";
export default async function LiveWorkspace({
  params,
}: {
  params: Promise<{ organizationId: string; section?: string[] }>;
}) {
  const { organizationId, section: path = [] } = await params;
  const section = path[0] ?? "dashboard";
  if (path.length > 1 || !sections.includes(section as Section)) notFound();
  let data;
  try {
    data = await loadWorkspace(organizationId);
  } catch (error) {
    if (error instanceof AccessError) {
      if (error.status === 403) notFound();
      redirect("/login");
    }
    throw error;
  }
  return (
    <Workspace
      key={`${organizationId}:${section}`}
      data={data}
      section={section as Section}
    />
  );
}
