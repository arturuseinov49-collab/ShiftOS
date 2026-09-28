import "server-only";
import { AIGateway } from "./gateway";
import { MockAIProvider } from "./providers/mock";
export function createAIGateway() {
  if (
    process.env.AI_PROVIDER === "mock" &&
    process.env.NODE_ENV !== "production"
  ) {
    return new AIGateway(new MockAIProvider());
  }
  return null; // Live adapters require quotas, audit logging and provider configuration first.
}
