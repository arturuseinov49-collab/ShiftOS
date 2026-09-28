import type { AIProvider, BriefingInput } from "../contracts";
export class MockAIProvider implements AIProvider {
  readonly id = "mock";
  async briefing({ facts }: BriefingInput) {
    return {
      text: `Тестовый обзор: ${facts.restaurantName}. Открытых задач: ${facts.openTasks}, с высоким приоритетом: ${facts.highPriorityTasks}. Начните с приоритетных задач.`,
      provider: this.id,
      isDemo: true,
    };
  }
}
