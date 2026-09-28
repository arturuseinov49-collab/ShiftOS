export type EventSource = "tasks" | "checklists" | "training" | "vision";
export interface DomainEvent<T = unknown> {
  id: string;
  organizationId: string;
  restaurantId: string;
  type: string;
  source: EventSource;
  schemaVersion: 1;
  occurredAt: string;
  correlationId: string;
  payload: T;
}
// Contract only. Use a transactional outbox + idempotent consumers before shipping.
export interface EventPublisher {
  publish<T>(event: DomainEvent<T>): Promise<void>;
}
