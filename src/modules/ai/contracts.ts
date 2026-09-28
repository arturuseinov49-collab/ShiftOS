export interface BriefingInput {
  organizationId: string;
  actorId: string;
  facts: {
    openTasks: number;
    highPriorityTasks: number;
    restaurantName: string;
  };
}
export interface AIResult {
  text: string;
  provider: string;
  isDemo: boolean;
}
export interface AIProvider {
  readonly id: string;
  briefing(input: BriefingInput, signal: AbortSignal): Promise<AIResult>;
}
