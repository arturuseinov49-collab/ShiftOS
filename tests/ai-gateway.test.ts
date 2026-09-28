import { describe, it, expect } from "vitest";
import { AIGateway } from "../src/modules/ai/gateway";
import { MockAIProvider } from "../src/modules/ai/providers/mock";
const input = {
  organizationId: "org-a",
  actorId: "user-a",
  facts: { openTasks: 4, highPriorityTasks: 1, restaurantName: "Test bar" },
};
describe("AI gateway", () => {
  it("preserves tenant context and is provider agnostic", async () => {
    const gateway = new AIGateway({
      id: "alternative",
      async briefing(received) {
        expect(received.organizationId).toBe("org-a");
        return {
          text: "Custom provider",
          provider: "alternative",
          isDemo: false,
        };
      },
    });
    expect((await gateway.briefing(input)).provider).toBe("alternative");
  });
  it("rejects missing actor identity", async () => {
    await expect(
      new AIGateway(new MockAIProvider()).briefing({ ...input, actorId: "" }),
    ).rejects.toThrow(/context/);
  });
  it("times out providers and cancels their request", async () => {
    let signal: AbortSignal | undefined;
    const gateway = new AIGateway(
      {
        id: "slow",
        briefing(_, received) {
          signal = received;
          return new Promise(() => {});
        },
      },
      10,
    );
    await expect(gateway.briefing(input)).rejects.toThrow("AI_TIMEOUT");
    expect(signal?.aborted).toBe(true);
  });
  it("labels the deterministic adapter as a demo", async () => {
    const result = await new AIGateway(new MockAIProvider()).briefing(input);
    expect(result.isDemo).toBe(true);
    expect(result.text).toContain("4");
  });
});
