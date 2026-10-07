# task-tracker

A Task Tracker that goes from an empty repo to production on Railway. Built with [Better-T-Stack](https://better-t-stack.dev): Turborepo, TanStack Router (web), Hono on Bun (server), oRPC, Drizzle and PostgreSQL, with pnpm.

```
apps/web        TanStack Router + Vite, served by nginx in Docker
apps/server     Hono on Bun, GET /health checks the DB and returns APP_VERSION
packages/api    oRPC routers shared by web and server
packages/db     Drizzle schema + SQL migrations (src/migrations, committed)
packages/ui     shared shadcn/ui components
```

## Local development

```bash
pnpm install
pnpm db:start        # Postgres in docker compose
pnpm db:migrate      # apply migrations
pnpm dev             # web :3001, server :3000
curl localhost:3000/health   # {"status":"ok","db":"ok","version":"dev"}
```

Schema change: edit `packages/db/src/schema/*` → `pnpm -F @task-tracker/db db:generate --name <change>` → commit the generated SQL. Only `db:migrate` ever runs against staging or production. Never use `db:push` there.

Env vars live in each app's `.env.schema` (committed, validated by varlock on start) and `.env` (not committed). A new variable must be added to `.env.schema` first, or the app won't see it. `VITE_*` values are baked in at `vite build`, so changing them requires rebuilding web.

## Environments and release flow

| Env        | Branch       | Web / API                        | Database                      |
| ---------- | ------------ | -------------------------------- | ----------------------------- |
| dev        | any          | localhost:3001 / localhost:3000  | Postgres in docker compose    |
| staging    | `main`       | Railway `staging` environment    | Railway Postgres (staging)    |
| production | `production` | Railway `production` environment | Railway Postgres (production) |

feature branch → PR to `main` (CI: lint, types, migrations on a clean DB, tests, build, docker) → merge, which auto-deploys staging → PR `main` → `production` → merge, which deploys production.

Railway service settings (set per service, per environment):

| Setting         | server                                               | web                                               |
| --------------- | ---------------------------------------------------- | ------------------------------------------------- |
| Source / branch | this repo, `production` (prod) / `main` (staging)    | same                                              |
| Dockerfile      | `RAILWAY_DOCKERFILE_PATH=apps/server/Dockerfile`     | `RAILWAY_DOCKERFILE_PATH=apps/web/Dockerfile`     |
| Watch paths     | `/apps/server/**`, `/packages/**`, `/pnpm-lock.yaml` | `/apps/web/**`, `/packages/**`, `/pnpm-lock.yaml` |
| Pre-deploy      | `bun run --cwd /app/packages/db db:migrate`          | none                                              |
| Healthcheck     | `/health`                                            | `/`                                               |
| Wait for CI     | on                                                   | on                                                |

The pre-deploy command runs without a shell, so `cd … && …` fails. Use `bun run --cwd`. It runs migrations before the new version gets traffic. If it fails, the old version keeps serving.

## Runbook

**Where are the logs?** Railway → service → Deployments → a deployment → Build / Deploy logs. Server logs are JSON lines (`level`, `msg`, `requestId`, `version`), so you can filter with `@level:error` or `@requestId:<id>`. From the CLI: `railway logs -s server -e production`. CPU/RAM graphs are in the project's Observability tab.

**Is it up?** `curl https://<api-domain>/health` returns `version`, the commit SHA that is live. The web footer shows the same value.

**Rollback (code).** Railway → service → Deployments → last good deployment → ⋮ → Rollback. Takes seconds and works for server and web independently. Then revert the bad PR so the branch matches what's running.

**Failed deploy.** If the healthcheck or pre-deploy migration fails, Railway keeps the old version serving. Nothing to do in production: read the deploy logs and fix via a new PR.

**Database.** A rollback does **not** undo migrations. Migrations only add things (expand → contract). Before any destructive migration, take a manual backup: Postgres service → Backups. To restore, create a new Postgres service from the backup and point `DATABASE_URL` at it.

**Alerts.** UptimeRobot checks `/health` every 5 min and emails the owner. Railway sends emails about failed deploys and crashes.

**Owner.** @ArtemixArt228

**Security note.** The demo has no auth (`--auth none`). Anyone with the URL can create or delete tasks. Add auth before putting real data in it.
