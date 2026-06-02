# Notification Preferences Service

Сервис, который решает, можно ли отправить пользователю конкретное
уведомление, и хранит его настройки.

Стек: TypeScript, Node.js (встроенный `http`), PostgreSQL + Prisma,
zod для валидации, luxon для таймзон, Jest для тестов.

## Запуск

### Через Docker (одной командой)

```bash
docker compose up --build
```

Эта команда сама: соберёт образ, поставит зависимости, поднимет Postgres,
дождётся его готовности, накатит миграции, прогонит сид и запустит сервис
на `http://localhost:3000`. Делать руками ничего не надо.

### Локально (без Docker для приложения)

Если хочется гонять `npm run dev` с автоперезагрузкой:

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run prisma:migrate
npm run db:seed
npm run dev
```

## Тесты

```bash
npm test
```

Тесты идут на in-memory репозиториях, Postgres для них не нужен.

## API

- `GET /users/:id/preferences` — текущие настройки (merge дефолтов и
  пользовательских) + quiet hours.
- `POST /users/:id/preferences` — обновить настройки и/или quiet hours.
  Идемпотентно. Чтобы сбросить quiet hours — прислать `"quietHours": null`.
- `POST /evaluate` — `{ userId, notificationType, channel, region, datetime }`
  → `{ decision, reason }`.

Плюс `GET /live` и `GET /ready` для проб.

## Архитектура

```
src/
├── domain/          доменные типы, правила, интерфейсы репозиториев
├── application/     use-case'ы
├── infrastructure/  Prisma, репозитории, Unit of Work, логгер
└── api/             HTTP роутер, контроллеры, zod-схемы
```

Доменная логика синхронная и тупая: `NotificationEvaluatorService` получает
уже загруженные значения и применяет правила в нужном порядке —
глобальная политика → quiet hours (только для маркетинга, транзакционные
проходят) → пользовательская настройка → дефолт → `no_preference_configured`.
Это удобно тестировать.

Репозитории — интерфейсы в `domain/`, реализации в `infrastructure/`.
В тестах их подменяю на in-memory. Изменения настроек идут через Unit of
Work (`prisma.$transaction`), логи об изменениях пишу только после успешного
коммита. Идемпотентность — через `upsert` по уникальным ключам.

Prisma-енумы (`SCREAMING_CASE`) и доменные (`snake_case`) разведены через
маппер в одном файле — домен не зависит от хранилища.

Валидация на входе через zod, включая IANA timezone и `startTime !== endTime`.
Лимит на тело — 1 МБ. У каждого запроса свой `X-Request-Id` (приходящий или
сгенерированный), он же в логах. В `evaluate_decision` `userId` хешируется,
чтобы не светить PII.

## Что бы добавила для прода

- Авторизация — сейчас сервис верит `userId` из URL.
- Prometheus-метрики на `evaluate` (decision/reason/type/channel/region) и
  латентность. Логи под это уже размечены.
- Optimistic locking на обновлении настроек.
- Redis-кеш на `evaluate` — читается часто, меняется редко.
- Bulk `/evaluate` для рассыльщиков.
- Audit log изменений предпочтений.
- Интеграционные тесты на реальной Postgres через Testcontainers.
- Категорию `transactional`/`marketing` вынести из кода в БД, чтобы
  добавлять новые типы без релиза.
