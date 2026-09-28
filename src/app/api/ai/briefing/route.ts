import { NextResponse } from "next/server";
import { z } from "zod";
import { AccessError, requireTenant } from "@/modules/identity/tenant";
import { createAIGateway } from "@/modules/ai/server";
import { appOrigin } from "@/lib/app-origin";
export async function POST(request: Request) {
  const respond = (body: object, status = 200) =>
    NextResponse.json(body, {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  if (request.headers.get("origin") !== appOrigin(request.url))
    return respond({ error: "Forbidden" }, 403);
  try {
    // Bound the actual stream, not only an attacker-controlled Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return respond({ error: "Invalid request" }, 400);
    let raw = "";
    let bytes = 0;
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > 2048) {
        await reader.cancel();
        return respond({ error: "Request too large" }, 413);
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    const input = z
      .object({ organizationId: z.uuid(), restaurantId: z.uuid() })
      .strict()
      .parse(JSON.parse(raw));
    const { db, user, organizationId } = await requireTenant(
      input.organizationId,
      "ai.use",
    );
    const gateway = createAIGateway();
    if (!gateway) return respond({ error: "AI provider is not enabled" }, 503);
    const { data: restaurant } = await db
      .from("restaurants")
      .select("name")
      .eq("organization_id", organizationId)
      .eq("id", input.restaurantId)
      .single();
    if (!restaurant) return respond({ error: "Restaurant unavailable" }, 404);
    const [open, priority] = await Promise.all([
      db
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("restaurant_id", input.restaurantId)
        .neq("status", "done"),
      db
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("restaurant_id", input.restaurantId)
        .neq("status", "done")
        .eq("priority", "high"),
    ]);
    if (open.error || priority.error)
      return respond({ error: "Data unavailable" }, 503);
    return respond(
      await gateway.briefing({
        organizationId,
        actorId: user.id,
        facts: {
          restaurantName: restaurant.name,
          openTasks: open.count ?? 0,
          highPriorityTasks: priority.count ?? 0,
        },
      }),
    );
  } catch (error) {
    if (error instanceof AccessError)
      return respond({ error: "Access unavailable" }, error.status);
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return respond({ error: "Invalid request" }, 400);
    return respond({ error: "Briefing unavailable" }, 503);
  }
}
