# ShiftOS contributor guide

- Use TypeScript strict and the existing Next.js App Router structure.
- Business modules belong in src/modules; provider SDKs belong behind adapter interfaces.
- Every tenant-owned table and relationship must enforce organization_id in SQL, including composite FKs.
- Never trust a tenant ID, role, or user identity from a browser without server and RLS checks.
- Do not add a service-role client to application request paths. Keep demo and live data separate.
- New tables need explicit grants, RLS allow/deny tests and a migration. Regenerate database types.
- Keep private answer keys out of public schemas and client bundles.
- No vision implementation in sprint 1. Future event delivery requires an outbox and idempotency.
- Run lint, typecheck, relevant tests and build. For UI changes run the desktop/mobile smoke tests.
- Never commit .env.local, secrets, node_modules, build outputs, or browser test screenshots.
