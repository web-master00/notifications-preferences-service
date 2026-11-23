# Notification Preferences Service

Service that decides whether a specific notification may be sent to a user,
and stores their preference settings.

Stack: TypeScript, Node.js (built-in `http`), PostgreSQL + Prisma,
zod for validation, luxon for time zones, Jest for tests.

## Getting started

### With Docker (one command)

```bash
docker compose up --build
```

Default Postgres values are for local development only.
For another environment, set `POSTGRES_USER`, `POSTGRES_PASSWORD`, and
`POSTGRES_DB` via `.env` or the environment. For a non-standard app-container
database URL, use `DOCKER_DATABASE_URL`. `DATABASE_URL` from `.env.example`
is intended for running the app locally outside Docker.

This command builds the image, installs dependencies, starts Postgres,
waits until it is ready, runs migrations, seeds the database, and starts
the service at `http://localhost:3000`. No manual steps required.

### Locally (without Docker for the app)

If you want `npm run dev` with auto-reload:

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run prisma:migrate
npm run db:seed
npm run dev
```

## Tests

```bash
npm test
```

Tests use in-memory repositories; Postgres is not required.

## API

- `GET /users/:id/preferences` — current settings (merged defaults and
  user overrides) + quiet hours.
- `POST /users/:id/preferences` — update settings and/or quiet hours.
  Idempotent. To clear quiet hours, send `"quietHours": null`.
- `POST /evaluate` — `{ userId, notificationType, channel, region, datetime }`
  → `{ decision, reason }`.

Also `GET /live` and `GET /ready` for health probes.

## Architecture

```
src/
├── domain/          domain types, rules, repository interfaces
├── application/     use cases
├── infrastructure/  Prisma, repositories, Unit of Work, logger
└── api/             HTTP router, controllers, zod schemas
```

Domain logic is synchronous and straightforward: `NotificationEvaluatorService`
receives already-loaded values and applies rules in order —
global policy → quiet hours (marketing only; transactional passes) →
user preference → default → `no_preference_configured`.
That makes it easy to test.

Repositories are interfaces in `domain/` with implementations in
`infrastructure/`. Tests swap them for in-memory versions. Preference
updates go through a Unit of Work (`prisma.$transaction`); change logs are
written only after a successful commit. Idempotency uses `upsert` on unique keys.

Prisma enums (`SCREAMING_CASE`) and domain enums (`snake_case`) are mapped
in a single file so the domain stays independent of storage.

Input validation uses zod, including IANA timezones and `startTime !== endTime`.
Body size limit is 1 MB. Each request has its own `X-Request-Id` (incoming or
generated), which also appears in logs. In `evaluate_decision`, `userId` is
hashed to avoid exposing PII. User IDs in preference-update logs are also
pseudonymized; `X-Request-Id` is accepted only in a restricted safe format.

## What I would add for production

- Auth — the service currently trusts `userId` from the URL. Log
  pseudonymization is not a substitute for authentication and authorization.
- Prometheus metrics on `evaluate` (decision/reason/type/channel/region) and
  latency. Logs are already labeled for this.
- Optimistic locking on preference updates.
- Redis cache for `evaluate` — read-heavy, write-rare.
- Bulk `/evaluate` for campaign senders.
- Audit log for preference changes.
- Integration tests against real Postgres via Testcontainers.
- Move `transactional`/`marketing` categories from code into the DB so new
  types can be added without a release.
