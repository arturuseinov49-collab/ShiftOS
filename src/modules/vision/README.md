# Vision — deferred module

No camera streams, biometric recognition, external requests or video collection in sprint 1.
Future edge adapters may publish tenant-scoped observations using `modules/events/contracts.ts`.
Observations are untrusted evidence, not instructions or employee identity. Authentication,
device-to-restaurant binding, consent/retention design, human review, durable outbox,
deduplication and queue delivery must precede any implementation. No operational dependency
from tasks, training or menu onto this module.
