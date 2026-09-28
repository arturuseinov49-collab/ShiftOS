import type { AIProvider, AIResult, BriefingInput } from "./contracts";

export class AIGateway {
  constructor(
    private readonly provider: AIProvider,
    private readonly timeoutMs = 8000,
  ) {}
  async briefing(input: BriefingInput): Promise<AIResult> {
    if (!input.organizationId || !input.actorId)
      throw new Error("Verified tenant context required");
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        this.provider.briefing(input, controller.signal),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new Error("AI_TIMEOUT"));
          }, this.timeoutMs);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
